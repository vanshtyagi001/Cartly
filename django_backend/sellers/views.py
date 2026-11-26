from datetime import datetime, timezone
from bson import ObjectId
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.auth import get_user_from_request, serialize_user
from accounts.repository import get_users_collection
from orders.repository import get_orders_collection
from orders.serializers import format_order
from products.repository import get_collection as get_products_collection
from products.serializers import format_product, normalize_product_images


def check_is_approved_seller(request):
    user = get_user_from_request(request)
    if not user:
        return False, Response(
            {"error": "Please log in to access Seller Studio."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    raw_status = user.get("sellerStatus")
    if not raw_status:
        seller_status = "approved" if user.get("isSeller") else "none"
    else:
        seller_status = str(raw_status).lower()

    if seller_status == "pending":
        return False, Response(
            {
                "error": "Your seller application is under review by campus administrators. Access will be unlocked upon approval.",
                "sellerStatus": "pending",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if seller_status == "suspended":
        return False, Response(
            {
                "error": "Your seller account has been suspended by administration.",
                "sellerStatus": "suspended",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if seller_status == "rejected":
        return False, Response(
            {
                "error": "Your seller application was not approved.",
                "sellerStatus": "rejected",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if seller_status != "approved" and not user.get("isSeller"):
        return False, Response(
            {
                "error": "Seller account required. Please submit a seller application first.",
                "sellerStatus": "none",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return True, user


class SellerOnboardView(APIView):
    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response(
                {"error": "Please log in to register as a campus seller."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        data = request.data or {}
        store_name = str(data.get("storeName", "")).strip()
        campus_location = str(data.get("campusLocation", "")).strip()
        phone = str(data.get("phone", "")).strip()
        bio = str(data.get("bio", "")).strip()

        if not store_name:
            return Response(
                {"error": "Store or Stall name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not campus_location:
            return Response(
                {"error": "Campus / Hostel pickup location is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = datetime.now(timezone.utc)
        seller_profile = {
            "storeName": store_name,
            "campusLocation": campus_location,
            "phone": phone or user.get("phone", ""),
            "bio": bio or "Student seller at Cartly Campus Hub.",
            "isVerified": False,
            "appliedAt": now.isoformat(),
            "reviewedAt": None,
            "reviewedBy": None,
            "statusReason": "",
        }

        users_col = get_users_collection()
        users_col.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "isSeller": False,
                    "sellerStatus": "pending",
                    "sellerProfile": seller_profile,
                    "sellerDetails": seller_profile,
                    "updatedAt": now,
                }
            },
        )

        updated_user = users_col.find_one({"_id": user["_id"]})
        return Response(
            {
                "message": f"Application for '{store_name}' submitted successfully. Please wait until campus administration verifies your profile.",
                "user": serialize_user(updated_user),
            },
            status=status.HTTP_200_OK,
        )


class SellerDashboardStatsView(APIView):
    def get(self, request):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        user_id = str(user["_id"])
        products_col = get_products_collection()
        orders_col = get_orders_collection()

        seller_products = list(products_col.find({"sellerId": user_id}))
        total_products = len(seller_products)

        # Orders that include items from this seller
        orders_query = {
            "$or": [
                {"items.sellerId": user_id},
                {"sellerId": user_id},
            ]
        }
        all_orders = list(orders_col.find(orders_query).sort("createdAt", -1))
        total_orders = len(all_orders)

        total_revenue = 0.0
        for o in all_orders:
            for item in o.get("items", []):
                if item.get("sellerId") == user_id:
                    total_revenue += float(item.get("rawPrice", 0)) * int(item.get("quantity", 1))

        return Response(
            {
                "storeName": user.get("sellerProfile", {}).get("storeName", "Campus Store"),
                "campusLocation": user.get("sellerProfile", {}).get("campusLocation", "Main Campus"),
                "isVerified": user.get("sellerProfile", {}).get("isVerified", True),
                "stats": {
                    "totalProducts": total_products,
                    "totalOrders": total_orders,
                    "totalRevenue": f"₹{total_revenue:,.2f}",
                    "rawRevenue": total_revenue,
                },
                "recentOrders": [format_order(o) for o in all_orders[:5]],
            },
            status=status.HTTP_200_OK,
        )


class SellerProductListCreateView(APIView):
    def get(self, request):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        user_id = str(user["_id"])
        products_col = get_products_collection()
        docs = list(products_col.find({"sellerId": user_id}))
        return Response([format_product(p) for p in docs], status=status.HTTP_200_OK)

    def post(self, request):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        data = request.data or {}
        name = str(data.get("name", "")).strip()
        category = str(data.get("category", "Hostel Essentials")).strip()
        featured_img, images = normalize_product_images(data.get("img"), data.get("images"))
        description = str(data.get("description", "")).strip()

        try:
            raw_price = data.get("price", 0)
            if isinstance(raw_price, str):
                cleaned = "".join(ch for ch in raw_price if ch.isdigit() or ch in ".-")
                price = float(cleaned) if cleaned else 0.0
            else:
                price = float(raw_price)
        except (ValueError, TypeError):
            price = 0.0

        if not name or price <= 0:
            return Response(
                {"error": "Product name and valid price are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not featured_img:
            return Response(
                {"error": "Featured product image is compulsory and will be used as the shop thumbnail."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            raw_stock = data.get("stock", 25)
            stock = max(0, int(raw_stock)) if raw_stock is not None else 25
        except (ValueError, TypeError):
            stock = 25

        products_col = get_products_collection()

        # Find next sequential or unique productId
        latest = products_col.find_one(sort=[("productId", -1)])
        next_id = (latest.get("productId", 0) + 1) if latest and isinstance(latest.get("productId"), int) else 101

        now = datetime.now(timezone.utc)
        seller_profile = user.get("sellerProfile", {})

        new_product = {
            "productId": next_id,
            "name": name,
            "category": category,
            "price": price,
            "stock": stock,
            "img": featured_img,
            "images": images,
            "description": description or f"Listed by {seller_profile.get('storeName', user.get('name'))}",
            "sellerId": str(user["_id"]),
            "sellerName": seller_profile.get("storeName", user.get("name")),
            "sellerLocation": seller_profile.get("campusLocation", "Main Campus"),
            "inStock": stock > 0,
            "createdAt": now,
            "updatedAt": now,
        }

        try:
            products_col.insert_one(new_product)
            return Response(
                {
                    "message": f"'{name}' was added to Cartly campus catalog successfully!",
                    "product": format_product(new_product),
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response(
                {"error": f"Failed to create listing: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SellerProductDetailView(APIView):
    def put(self, request, product_id):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        products_col = get_products_collection()
        prod = products_col.find_one({"productId": product_id, "sellerId": str(user["_id"])})
        if not prod:
            return Response(
                {"error": "Product not found or unauthorized to edit."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = request.data or {}
        update_fields = {"updatedAt": datetime.now(timezone.utc)}

        if "name" in data and str(data["name"]).strip():
            update_fields["name"] = str(data["name"]).strip()
        if "category" in data:
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
        if "inStock" in data:
            update_fields["inStock"] = bool(data["inStock"])

        products_col.update_one({"_id": prod["_id"]}, {"$set": update_fields})
        updated = products_col.find_one({"_id": prod["_id"]})
        return Response(
            {
                "message": "Product listing updated successfully.",
                "product": format_product(updated),
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, product_id):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        products_col = get_products_collection()
        result = products_col.delete_one({"productId": product_id, "sellerId": str(user["_id"])})

        if result.deleted_count == 0:
            return Response(
                {"error": "Product not found or already deleted."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"message": "Product removed from catalog."},
            status=status.HTTP_200_OK,
        )


class SellerOrdersView(APIView):
    def get(self, request):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        user_id = str(user["_id"])
        orders_col = get_orders_collection()
        orders_query = {
            "$or": [
                {"items.sellerId": user_id},
                {"sellerId": user_id},
            ]
        }
        matched = list(orders_col.find(orders_query).sort("createdAt", -1))

        return Response([format_order(o) for o in matched], status=status.HTTP_200_OK)


class SellerOrderStatusUpdateView(APIView):
    def patch(self, request, order_id):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        data = request.data or {}
        new_status = str(data.get("status", "")).strip()

        valid_statuses = ["Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Choose from {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orders_col = get_orders_collection()
        result = orders_col.update_one(
            {"$or": [{"orderId": order_id}, {"_id": order_id}]},
            {"$set": {"status": new_status, "updatedAt": datetime.now(timezone.utc)}},
        )

        if result.matched_count == 0:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"message": f"Order #{order_id} marked as '{new_status}'."},
            status=status.HTTP_200_OK,
        )


class SellerProfileView(APIView):
    """
    Endpoint for sellers to view and update their registered company/store profile.
    GET /api/seller/profile
    PUT /api/seller/profile -> { storeName, campusLocation, phone, bio }
    """
    def get(self, request):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        profile = user.get("sellerProfile") or user.get("sellerDetails") or {}
        return Response(
            {
                "storeName": profile.get("storeName") or user.get("name") or "Campus Store",
                "campusLocation": profile.get("campusLocation") or "North Campus",
                "phone": profile.get("phone") or user.get("phone") or "",
                "bio": profile.get("bio") or "",
                "isVerified": profile.get("isVerified", True),
                "sellerStatus": user.get("sellerStatus", "approved"),
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        is_ok, res = check_is_approved_seller(request)
        if not is_ok:
            return res
        user = res

        data = request.data or {}
        store_name = str(data.get("storeName", "")).strip()
        campus_location = str(data.get("campusLocation", "")).strip()
        phone = str(data.get("phone", "")).strip()
        bio = str(data.get("bio", "")).strip()

        if not store_name:
            return Response(
                {"error": "Registered Company / Store name cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = datetime.now(timezone.utc)
        users_col = get_users_collection()
        existing_profile = user.get("sellerProfile") or user.get("sellerDetails") or {}

        updated_profile = dict(existing_profile)
        updated_profile["storeName"] = store_name
        if campus_location:
            updated_profile["campusLocation"] = campus_location
        if phone:
            updated_profile["phone"] = phone
        if "bio" in data:
            updated_profile["bio"] = bio
        updated_profile["updatedAt"] = now.isoformat()

        users_col.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "sellerProfile": updated_profile,
                    "sellerDetails": updated_profile,
                    "updatedAt": now,
                }
            },
        )

        # Synchronize updated seller company/store name across all this seller's products
        user_id = str(user["_id"])
        products_col = get_products_collection()
        prod_update = {"sellerName": store_name, "updatedAt": now}
        if campus_location:
            prod_update["sellerLocation"] = campus_location

        products_col.update_many({"sellerId": user_id}, {"$set": prod_update})

        updated_user = users_col.find_one({"_id": user["_id"]})

        return Response(
            {
                "message": f"Company profile updated to '{store_name}'. All your active listings have been updated.",
                "user": serialize_user(updated_user),
                "sellerProfile": updated_profile,
            },
            status=status.HTTP_200_OK,
        )


class PublicSellerStoreView(APIView):
    """
    Public storefront endpoint for buyers to view a seller's profile and all their listings.
    GET /api/seller/store/<seller_id>
    """
    def get(self, request, seller_id):
        users_col = get_users_collection()
        try:
            seller = users_col.find_one({"_id": ObjectId(seller_id)})
        except Exception:
            return Response({"error": "Invalid seller ID."}, status=status.HTTP_400_BAD_REQUEST)

        if not seller:
            return Response({"error": "Campus store not found."}, status=status.HTTP_404_NOT_FOUND)

        raw_status = seller.get("sellerStatus")
        seller_status = str(raw_status).lower() if raw_status else ("approved" if seller.get("isSeller") else "none")
        if seller_status != "approved" and not seller.get("isSeller"):
            return Response({"error": "This campus store is not currently active."}, status=status.HTTP_404_NOT_FOUND)

        profile = seller.get("sellerProfile") or seller.get("sellerDetails") or {}
        products_col = get_products_collection()
        docs = list(products_col.find({"sellerId": str(seller["_id"])}).sort("productId", -1))

        return Response(
            {
                "store": {
                    "id": str(seller["_id"]),
                    "storeName": profile.get("storeName") or seller.get("name") or "Campus Store",
                    "campusLocation": profile.get("campusLocation") or "North Campus",
                    "bio": profile.get("bio") or "Verified student seller at Cartly Campus Hub.",
                    "isVerified": bool(profile.get("isVerified", True)),
                    "ownerName": seller.get("name", ""),
                },
                "products": [format_product(p) for p in docs],
            },
            status=status.HTTP_200_OK,
        )

