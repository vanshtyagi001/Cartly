import os
from datetime import datetime, timezone
from bson import ObjectId
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.auth import (
    generate_token,
    get_user_from_request,
    hash_password,
    serialize_user,
    verify_password,
)
from accounts.repository import get_users_collection
from orders.repository import get_orders_collection
from orders.serializers import format_order
from products.repository import get_categories_collection, get_collection as get_products_collection
from products.serializers import format_product
from products.views import DEFAULT_CATEGORIES, ensure_default_categories


def check_is_admin(request):
    user = get_user_from_request(request)
    if not user:
        return False, Response({"error": "Admin authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.get("isAdmin", False):
        return False, Response({"error": "Administrator privileges required."}, status=status.HTTP_403_FORBIDDEN)
    return True, user


class AdminLoginView(APIView):
    def post(self, request):
        data = request.data or {}
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", "")).strip()

        if not email or not password:
            return Response(
                {"error": "Admin email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        env_admin_email = os.environ.get("ADMIN_EMAIL", "admin@cartly.com").strip().lower()
        env_admin_password = os.environ.get("ADMIN_PASSWORD", "cartlyadmin123").strip()

        users_col = get_users_collection()
        admin_user = None

        # 1. Match against .env credentials
        if email == env_admin_email and password == env_admin_password:
            admin_user = users_col.find_one({"email": env_admin_email})
            now = datetime.now(timezone.utc)
            if not admin_user:
                new_admin = {
                    "name": "Cartly Administrator",
                    "email": env_admin_email,
                    "password": hash_password(env_admin_password),
                    "isAdmin": True,
                    "isSeller": False,
                    "createdAt": now,
                    "updatedAt": now,
                }
                res = users_col.insert_one(new_admin)
                admin_user = users_col.find_one({"_id": res.inserted_id})
            else:
                if not admin_user.get("isAdmin"):
                    users_col.update_one({"_id": admin_user["_id"]}, {"$set": {"isAdmin": True, "updatedAt": now}})
                    admin_user["isAdmin"] = True
        else:
            # 2. Check existing database user with isAdmin=True
            user = users_col.find_one({"email": email})
            if user and user.get("isAdmin") and verify_password(password, user.get("password", "")):
                admin_user = user

        if not admin_user:
            return Response(
                {"error": "Invalid administrative credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = generate_token(str(admin_user["_id"]))
        return Response(
            {
                "message": "Administrative session authorized.",
                "token": token,
                "user": serialize_user(admin_user),
            },
            status=status.HTTP_200_OK,
        )


class AdminMeView(APIView):
    def get(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res
        return Response({"user": serialize_user(res)}, status=status.HTTP_200_OK)


class AdminMetricsView(APIView):
    def get(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        orders_col = get_orders_collection()
        products_col = get_products_collection()
        users_col = get_users_collection()

        all_orders = list(orders_col.find())
        all_products = list(products_col.find())
        all_users = list(users_col.find())

        total_orders = len(all_orders)
        total_products = len(all_products)
        total_users = len(all_users)
        total_sellers = len([u for u in all_users if u.get("isSeller")])

        gmv = sum(float(o.get("total", 0)) for o in all_orders)

        # Status breakdown
        status_counts = {}
        for o in all_orders:
            st = o.get("status", "Confirmed")
            status_counts[st] = status_counts.get(st, 0) + 1

        # Category breakdown
        category_counts = {}
        for p in all_products:
            cat = p.get("category", "Uncategorized")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        return Response(
            {
                "metrics": {
                    "gmv": f"₹{gmv:,.2f}",
                    "rawGmv": gmv,
                    "totalOrders": total_orders,
                    "totalProducts": total_products,
                    "totalUsers": total_users,
                    "totalSellers": total_sellers,
                },
                "statusBreakdown": status_counts,
                "categoryBreakdown": category_counts,
            },
            status=status.HTTP_200_OK,
        )


class AdminOrdersView(APIView):
    def get(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        orders_col = get_orders_collection()
        docs = list(orders_col.find().sort("createdAt", -1))
        return Response([format_order(o) for o in docs], status=status.HTTP_200_OK)

    def patch(self, request, order_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        data = request.data or {}
        new_status = str(data.get("status", "")).strip()

        orders_col = get_orders_collection()
        result = orders_col.update_one(
            {"$or": [{"orderId": order_id}, {"_id": order_id}]},
            {"$set": {"status": new_status, "updatedAt": datetime.now(timezone.utc)}},
        )

        if result.matched_count == 0:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": f"Order #{order_id} status updated to '{new_status}'."}, status=status.HTTP_200_OK)


class AdminProductsView(APIView):
    def get(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        products_col = get_products_collection()
        docs = list(products_col.find().sort("productId", 1))
        return Response([format_product(p) for p in docs], status=status.HTTP_200_OK)

    def post(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        user = res
        data = request.data or {}
        name = str(data.get("name", "")).strip()
        category = str(data.get("category", "Hostel Essentials")).strip()
        img = str(data.get("img", "")).strip()
        description = str(data.get("description", "")).strip()

        try:
            raw_price = data.get("price", 0)
            cleaned = "".join(ch for ch in str(raw_price) if ch.isdigit() or ch in ".-")
            price = float(cleaned) if cleaned else 0.0
        except (ValueError, TypeError):
            price = 0.0

        if not name or price <= 0:
            return Response({"error": "Product name and price are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not img:
            img = "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop"

        products_col = get_products_collection()
        latest = products_col.find_one(sort=[("productId", -1)])
        next_id = (latest.get("productId", 0) + 1) if latest and isinstance(latest.get("productId"), int) else 101

        now = datetime.now(timezone.utc)
        new_prod = {
            "productId": next_id,
            "name": name,
            "category": category,
            "price": price,
            "img": img,
            "description": description or "Official Cartly Campus Catalog Essential.",
            "sellerName": "Cartly Official Hub",
            "sellerLocation": "Central Store",
            "inStock": True,
            "createdAt": now,
            "updatedAt": now,
        }

        products_col.insert_one(new_prod)
        return Response({"message": f"'{name}' added to catalog.", "product": format_product(new_prod)}, status=status.HTTP_201_CREATED)

    def delete(self, request, product_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        products_col = get_products_collection()
        result = products_col.delete_one({"productId": product_id})
        if result.deleted_count == 0:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": f"Product #{product_id} deleted."}, status=status.HTTP_200_OK)


class AdminUsersView(APIView):
    def get(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        users_col = get_users_collection()
        docs = list(users_col.find().sort("createdAt", -1))
        return Response([serialize_user(u) for u in docs], status=status.HTTP_200_OK)

    def patch(self, request, user_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        users_col = get_users_collection()
        try:
            target = users_col.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return Response({"error": "Invalid user ID format."}, status=status.HTTP_400_BAD_REQUEST)

        if not target:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = not target.get("isAdmin", False)
        users_col.update_one({"_id": ObjectId(user_id)}, {"$set": {"isAdmin": new_status}})
        return Response({"message": f"User admin status set to {new_status}."}, status=status.HTTP_200_OK)


class AdminSellerStatusView(APIView):
    """
    Endpoint for admins to approve, suspend, or cancel/reject a seller.
    POST /api/admin/sellers/<user_id>/status
    Body: { "status": "approved" | "suspended" | "rejected" | "none", "reason": "optional reason" }
    """
    def post(self, request, user_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res
        admin_user = res

        data = request.data or {}
        new_status = str(data.get("status", "")).strip().lower()
        reason = str(data.get("reason", "")).strip()

        valid_statuses = ["approved", "suspended", "rejected", "none"]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status '{new_status}'. Allowed: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        users_col = get_users_collection()
        try:
            target = users_col.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return Response({"error": "Invalid user ID format."}, status=status.HTTP_400_BAD_REQUEST)

        if not target:
            return Response({"error": "User account not found."}, status=status.HTTP_404_NOT_FOUND)

        now = datetime.now(timezone.utc)
        is_seller = (new_status == "approved")

        existing_details = target.get("sellerDetails") or target.get("sellerProfile") or {}
        updated_details = dict(existing_details)
        updated_details["isVerified"] = is_seller
        updated_details["reviewedAt"] = now.isoformat()
        updated_details["reviewedBy"] = admin_user.get("email", "admin")
        if reason:
            updated_details["statusReason"] = reason

        update_payload = {
            "sellerStatus": new_status,
            "isSeller": is_seller,
            "sellerProfile": updated_details,
            "sellerDetails": updated_details,
            "updatedAt": now,
        }

        users_col.update_one({"_id": target["_id"]}, {"$set": update_payload})
        refreshed = users_col.find_one({"_id": target["_id"]})

        action_labels = {
            "approved": "approved as campus seller",
            "suspended": "seller account suspended",
            "rejected": "seller application rejected / cancelled",
            "none": "seller privileges reset",
        }

        return Response(
            {
                "message": f"User {refreshed.get('name', 'Seller')} has been {action_labels.get(new_status, new_status)}.",
                "user": serialize_user(refreshed),
            },
            status=status.HTTP_200_OK,
        )


class AdminCategoriesView(APIView):
    """
    Endpoint for admins to list, add, and manage product categories.
    GET /api/admin/categories
    POST /api/admin/categories -> { "name": "Study Supplies" }
    DELETE /api/admin/categories/<str:name>
    """
    def get(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        ensure_default_categories()
        col = get_categories_collection()
        docs = list(col.find().sort("createdAt", 1))
        categories = []
        for d in docs:
            name = d.get("name")
            if name:
                categories.append({
                    "id": str(d.get("_id")),
                    "name": name,
                    "isDefault": name in DEFAULT_CATEGORIES,
                    "createdAt": d.get("createdAt").isoformat() if isinstance(d.get("createdAt"), datetime) else str(d.get("createdAt") or ""),
                })
        return Response({"categories": categories}, status=status.HTTP_200_OK)

    def post(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        data = request.data or {}
        raw_name = str(data.get("name", "")).strip()

        if not raw_name:
            return Response({"error": "Category name cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Capitalize nicely or preserve case
        cat_name = " ".join([word.capitalize() for word in raw_name.split()])

        col = get_categories_collection()
        existing = col.find_one({"name": {"$regex": f"^{cat_name}$", "$options": "i"}})
        if existing:
            return Response({"error": f"Category '{cat_name}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

        now = datetime.now(timezone.utc)
        doc = {
            "name": cat_name,
            "createdAt": now,
            "updatedAt": now,
        }
        ins = col.insert_one(doc)

        return Response(
            {
                "message": f"Category '{cat_name}' created successfully.",
                "category": {
                    "id": str(ins.inserted_id),
                    "name": cat_name,
                    "isDefault": False,
                    "createdAt": now.isoformat(),
                },
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, category_name=None):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        if not category_name:
            category_name = request.query_params.get("name", "").strip()

        if not category_name:
            return Response({"error": "Category name required."}, status=status.HTTP_400_BAD_REQUEST)

        col = get_categories_collection()
        result = col.delete_one({"name": {"$regex": f"^{category_name}$", "$options": "i"}})
        if result.deleted_count == 0:
            return Response({"error": f"Category '{category_name}' not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": f"Category '{category_name}' removed."}, status=status.HTTP_200_OK)


