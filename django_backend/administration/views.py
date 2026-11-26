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
from products.repository import (
    create_notification,
    get_categories_collection,
    get_collection as get_products_collection,
    get_coupons_collection,
    get_newsletter_collection,
    get_stock_alerts_collection,
    get_support_tickets_collection,
)
from products.serializers import format_product, normalize_product_images
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

        # Category revenue & top stores from non-cancelled orders
        seller_map = {}
        for u in all_users:
            if u.get("isSeller") or (u.get("sellerStatus") or "").lower() == "approved":
                prof = u.get("sellerProfile") or u.get("sellerDetails") or {}
                seller_map[str(u["_id"])] = prof.get("storeName") or u.get("name") or "Campus Store"

        category_revenue = {}
        store_stats = {}
        pending_returns = 0
        for o in all_orders:
            rr = o.get("returnRequest")
            if rr and rr.get("status") in ("Requested", "Approved"):
                pending_returns += 1
            if o.get("status") == "Cancelled":
                continue
            seen_stores_in_order = set()
            for item in o.get("items", []):
                cat = item.get("category", "Essentials")
                qty = int(item.get("quantity", 1) or 1)
                rev = float(item.get("rawPrice", 0) or 0) * qty
                category_revenue[cat] = round(category_revenue.get(cat, 0.0) + rev, 2)

                sid = item.get("sellerId")
                sname = seller_map.get(sid, "Cartly Official Hub") if sid else "Cartly Official Hub"
                store_key = sid or "official"
                if store_key not in store_stats:
                    store_stats[store_key] = {"id": store_key, "storeName": sname, "revenue": 0.0, "orders": 0, "units": 0}
                store_stats[store_key]["revenue"] += rev
                store_stats[store_key]["units"] += qty
                if store_key not in seen_stores_in_order:
                    store_stats[store_key]["orders"] += 1
                    seen_stores_in_order.add(store_key)

        top_stores = sorted(store_stats.values(), key=lambda x: x["revenue"], reverse=True)[:4]
        for ts in top_stores:
            ts["formattedRevenue"] = f"₹{ts['revenue']:,.2f}"

        pending_sellers = len([u for u in all_users if (u.get("sellerStatus") or "").lower() == "pending"])
        out_of_stock_products = len([p for p in all_products if int(p.get("stock", 25) if p.get("stock") is not None else 25) <= 0])
        open_tickets = get_support_tickets_collection().count_documents({"status": "Open"})

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
                "categoryRevenue": category_revenue,
                "topStores": top_stores,
                "actionQueue": {
                    "pendingSellers": pending_sellers,
                    "openTickets": open_tickets,
                    "outOfStockProducts": out_of_stock_products,
                    "pendingReturns": pending_returns,
                },
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
        featured_img, images = normalize_product_images(data.get("img"), data.get("images"))
        description = str(data.get("description", "")).strip()
        condition = str(data.get("condition", "Brand New")).strip()
        if condition not in ("Brand New", "Like New", "Gently Used"):
            condition = "Brand New"

        try:
            raw_price = data.get("price", 0)
            cleaned = "".join(ch for ch in str(raw_price) if ch.isdigit() or ch in ".-")
            price = float(cleaned) if cleaned else 0.0
        except (ValueError, TypeError):
            price = 0.0

        try:
            raw_stock = data.get("stock", 25)
            stock = max(0, int(raw_stock)) if raw_stock is not None else 25
        except (ValueError, TypeError):
            stock = 25

        if not name or price <= 0:
            return Response({"error": "Product name and price are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not featured_img:
            return Response(
                {"error": "Featured product image is compulsory and will be used as the shop thumbnail."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        products_col = get_products_collection()
        latest = products_col.find_one(sort=[("productId", -1)])
        next_id = (latest.get("productId", 0) + 1) if latest and isinstance(latest.get("productId"), int) else 101

        now = datetime.now(timezone.utc)
        new_prod = {
            "productId": next_id,
            "name": name,
            "category": category,
            "price": price,
            "stock": stock,
            "condition": condition,
            "img": featured_img,
            "images": images,
            "description": description or "Official Cartly Campus Catalog Essential.",
            "sellerName": "Cartly Official Hub",
            "sellerLocation": "Central Store",
            "inStock": stock > 0,
            "createdAt": now,
            "updatedAt": now,
        }

        products_col.insert_one(new_prod)
        return Response({"message": f"'{name}' added to catalog.", "product": format_product(new_prod)}, status=status.HTTP_201_CREATED)

    def put(self, request, product_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        products_col = get_products_collection()
        prod = products_col.find_one({"productId": product_id})
        if not prod:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data or {}
        now = datetime.now(timezone.utc)
        update_fields = {"updatedAt": now}

        if "name" in data and str(data["name"]).strip():
            update_fields["name"] = str(data["name"]).strip()
        if "category" in data and str(data["category"]).strip():
            update_fields["category"] = str(data["category"]).strip()
        if "price" in data:
            raw = str(data["price"])
            cleaned = "".join(ch for ch in raw if ch.isdigit() or ch in ".-")
            update_fields["price"] = float(cleaned) if cleaned else prod.get("price", 0)
        if "stock" in data:
            try:
                new_stock = max(0, int(data["stock"]))
                update_fields["stock"] = new_stock
                update_fields["inStock"] = (new_stock > 0)
            except (ValueError, TypeError):
                pass
        if "img" in data or "images" in data:
            target_img = data.get("img") if "img" in data else prod.get("img")
            target_images = data.get("images") if "images" in data else prod.get("images")
            featured_img, images = normalize_product_images(target_img, target_images)
            if not featured_img:
                return Response(
                    {"error": "Featured product image is compulsory and cannot be empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            update_fields["img"] = featured_img
            update_fields["images"] = images
        if "description" in data:
            update_fields["description"] = str(data["description"]).strip()
        if "condition" in data:
            cond = str(data["condition"]).strip()
            if cond in ("Brand New", "Like New", "Gently Used"):
                update_fields["condition"] = cond
        if "inStock" in data:
            update_fields["inStock"] = bool(data["inStock"])

        products_col.update_one({"_id": prod["_id"]}, {"$set": update_fields})
        updated = products_col.find_one({"_id": prod["_id"]})
        return Response(
            {
                "message": f"Product #{product_id} updated successfully.",
                "product": format_product(updated),
            },
            status=status.HTTP_200_OK,
        )

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

        if str(target["_id"]) == str(res["_id"]):
            return Response({"error": "You cannot revoke your own admin privileges."}, status=status.HTTP_400_BAD_REQUEST)

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


class AdminSellerUpdateView(APIView):
    """
    Endpoint for admins to update a seller's registered company/store name, location, or bio.
    PUT /api/admin/sellers/<user_id>
    """
    def put(self, request, user_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        data = request.data or {}
        store_name = str(data.get("storeName", "")).strip()
        campus_location = str(data.get("campusLocation", "")).strip()
        bio = str(data.get("bio", "")).strip()

        users_col = get_users_collection()
        try:
            target = users_col.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return Response({"error": "Invalid user ID format."}, status=status.HTTP_400_BAD_REQUEST)

        if not target:
            return Response({"error": "User account not found."}, status=status.HTTP_404_NOT_FOUND)

        now = datetime.now(timezone.utc)
        existing_profile = target.get("sellerProfile") or target.get("sellerDetails") or {}
        updated_profile = dict(existing_profile)

        if store_name:
            updated_profile["storeName"] = store_name
        if campus_location:
            updated_profile["campusLocation"] = campus_location
        if "bio" in data:
            updated_profile["bio"] = bio
        updated_profile["updatedAt"] = now.isoformat()

        users_col.update_one(
            {"_id": target["_id"]},
            {
                "$set": {
                    "sellerProfile": updated_profile,
                    "sellerDetails": updated_profile,
                    "updatedAt": now,
                }
            },
        )

        if store_name or campus_location:
            products_col = get_products_collection()
            prod_update = {"updatedAt": now}
            if store_name:
                prod_update["sellerName"] = store_name
            if campus_location:
                prod_update["sellerLocation"] = campus_location
            products_col.update_many({"sellerId": str(target["_id"])}, {"$set": prod_update})

        refreshed = users_col.find_one({"_id": target["_id"]})
        return Response(
            {
                "message": f"Seller details for {refreshed.get('name')} updated successfully.",
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


class AdminSupportView(APIView):
    """
    Admin endpoint for viewing support tickets, newsletter subscribers, and restock alerts.
    GET /api/admin/support
    PATCH /api/admin/support/<ticket_id> -> { "status": "Open" | "In Progress" | "Resolved" }
    """
    def get(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        tickets_docs = list(get_support_tickets_collection().find().sort("createdAt", -1))
        tickets = []
        for t in tickets_docs:
            created = t.get("createdAt")
            tickets.append({
                "id": str(t["_id"]),
                "name": t.get("name", ""),
                "email": t.get("email", ""),
                "orderId": t.get("orderId", ""),
                "topic": t.get("topic", "General Inquiry"),
                "message": t.get("message", ""),
                "status": t.get("status", "Open"),
                "date": created.strftime("%b %d, %Y %I:%M %p") if isinstance(created, datetime) else str(created or ""),
            })

        subs_docs = list(get_newsletter_collection().find().sort("createdAt", -1))
        subscribers = [
            {
                "id": str(s["_id"]),
                "email": s.get("email", ""),
                "date": s.get("createdAt").strftime("%b %d, %Y") if isinstance(s.get("createdAt"), datetime) else "",
            }
            for s in subs_docs
        ]

        alerts_docs = list(get_stock_alerts_collection().find().sort("createdAt", -1))
        alerts = [
            {
                "id": str(a["_id"]),
                "productId": a.get("productId"),
                "productName": a.get("productName", ""),
                "email": a.get("email", ""),
                "date": a.get("createdAt").strftime("%b %d, %Y") if isinstance(a.get("createdAt"), datetime) else "",
            }
            for a in alerts_docs
        ]

        return Response(
            {
                "tickets": tickets,
                "subscribers": subscribers,
                "stockAlerts": alerts,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, ticket_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        data = request.data or {}
        new_status = str(data.get("status", "")).strip()
        if new_status not in ("Open", "In Progress", "Resolved"):
            return Response({"error": "Invalid ticket status."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            oid = ObjectId(ticket_id)
        except Exception:
            return Response({"error": "Invalid ticket ID."}, status=status.HTTP_400_BAD_REQUEST)

        result = get_support_tickets_collection().update_one(
            {"_id": oid},
            {"$set": {"status": new_status, "updatedAt": datetime.now(timezone.utc)}},
        )
        if result.matched_count == 0:
            return Response({"error": "Support ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": f"Ticket marked as '{new_status}'."}, status=status.HTTP_200_OK)


class AdminCouponsView(APIView):
    """
    Admin endpoint to list, create, toggle, and delete campus promo codes.
    GET /api/admin/coupons
    POST /api/admin/coupons -> { code, discountType: "percent"|"flat", discountValue, minOrder }
    PATCH /api/admin/coupons/<coupon_id> -> { isActive: bool }
    DELETE /api/admin/coupons/<coupon_id>
    """
    def get(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        docs = list(get_coupons_collection().find().sort("createdAt", -1))
        coupons = [
            {
                "id": str(d["_id"]),
                "code": d.get("code", ""),
                "discountType": d.get("discountType", "percent"),
                "discountValue": float(d.get("discountValue", 0)),
                "minOrder": float(d.get("minOrder", 0)),
                "isActive": bool(d.get("isActive", True)),
            }
            for d in docs
        ]
        return Response({"coupons": coupons}, status=status.HTTP_200_OK)

    def post(self, request):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        data = request.data or {}
        code = str(data.get("code", "")).strip().upper().replace(" ", "")
        discount_type = str(data.get("discountType", "percent")).strip().lower()
        try:
            discount_value = float(data.get("discountValue", 0))
            min_order = max(0.0, float(data.get("minOrder", 0) or 0))
        except (ValueError, TypeError):
            return Response({"error": "Invalid discount or minimum order value."}, status=status.HTTP_400_BAD_REQUEST)

        if not code:
            return Response({"error": "Promo code is required."}, status=status.HTTP_400_BAD_REQUEST)
        if discount_type not in ("percent", "flat"):
            return Response({"error": "Discount type must be 'percent' or 'flat'."}, status=status.HTTP_400_BAD_REQUEST)
        if discount_value <= 0 or (discount_type == "percent" and discount_value > 90):
            return Response({"error": "Enter a valid discount value (1–90% or positive flat amount)."}, status=status.HTTP_400_BAD_REQUEST)

        col = get_coupons_collection()
        if col.find_one({"code": code}):
            return Response({"error": f"Promo code '{code}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

        now = datetime.now(timezone.utc)
        doc = {
            "code": code,
            "discountType": discount_type,
            "discountValue": discount_value,
            "minOrder": min_order,
            "isActive": True,
            "createdAt": now,
            "updatedAt": now,
        }
        ins = col.insert_one(doc)
        return Response(
            {
                "message": f"Promo code '{code}' created.",
                "coupon": {
                    "id": str(ins.inserted_id),
                    "code": code,
                    "discountType": discount_type,
                    "discountValue": discount_value,
                    "minOrder": min_order,
                    "isActive": True,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, coupon_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        try:
            oid = ObjectId(coupon_id)
        except Exception:
            return Response({"error": "Invalid coupon ID."}, status=status.HTTP_400_BAD_REQUEST)

        is_active = bool((request.data or {}).get("isActive", True))
        result = get_coupons_collection().update_one(
            {"_id": oid},
            {"$set": {"isActive": is_active, "updatedAt": datetime.now(timezone.utc)}},
        )
        if result.matched_count == 0:
            return Response({"error": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": f"Coupon {'activated' if is_active else 'paused'}."}, status=status.HTTP_200_OK)

    def delete(self, request, coupon_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        try:
            oid = ObjectId(coupon_id)
        except Exception:
            return Response({"error": "Invalid coupon ID."}, status=status.HTTP_400_BAD_REQUEST)

        result = get_coupons_collection().delete_one({"_id": oid})
        if result.deleted_count == 0:
            return Response({"error": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Promo code deleted."}, status=status.HTTP_200_OK)


class AdminOrderReturnView(APIView):
    """
    Admin endpoint to approve, complete, or decline a buyer return/replacement request.
    PATCH /api/admin/orders/<str:order_id>/return
    """
    def patch(self, request, order_id):
        is_ok, res = check_is_admin(request)
        if not is_ok:
            return res

        new_status = str((request.data or {}).get("status", "")).strip()
        if new_status not in ("Approved", "Completed", "Declined"):
            return Response({"error": "Status must be 'Approved', 'Completed', or 'Declined'."}, status=status.HTTP_400_BAD_REQUEST)

        orders_col = get_orders_collection()
        order_doc = orders_col.find_one({"$or": [{"orderId": order_id}, {"_id": order_id}]})
        if not order_doc or not order_doc.get("returnRequest"):
            return Response({"error": "Return request not found on this order."}, status=status.HTTP_404_NOT_FOUND)

        now = datetime.now(timezone.utc)
        orders_col.update_one(
            {"_id": order_doc["_id"]},
            {
                "$set": {
                    "returnRequest.status": new_status,
                    "returnRequest.reviewedByAdmin": True,
                    "returnRequest.updatedAt": now.isoformat(),
                    "updatedAt": now,
                }
            },
        )

        if order_doc.get("userId") or order_doc.get("userEmail"):
            req_type = order_doc["returnRequest"].get("type", "Return")
            create_notification(
                user_id=order_doc.get("userId"),
                email=order_doc.get("userEmail"),
                title=f"{req_type} {new_status} (#{order_doc.get('orderId', order_id)})",
                message=f"Admin marked your {req_type.lower()} request as {new_status}.",
                link="/orders",
            )

        return Response({"message": f"Return request on Order #{order_id} marked as '{new_status}'."}, status=status.HTTP_200_OK)


