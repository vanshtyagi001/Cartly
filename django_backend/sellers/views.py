from datetime import datetime, timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.auth import get_user_from_request, serialize_user
from accounts.repository import get_users_collection
from orders.repository import get_orders_collection
from orders.serializers import format_order
from products.repository import get_collection as get_products_collection
from products.serializers import format_product


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
            "isVerified": True,
            "joinedAt": now.isoformat(),
        }

        users_col = get_users_collection()
        users_col.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "isSeller": True,
                    "sellerProfile": seller_profile,
                    "updatedAt": now,
                }
            },
        )

        updated_user = users_col.find_one({"_id": user["_id"]})
        return Response(
            {
                "message": f"Welcome to the Cartly Seller Hub! Your store '{store_name}' is live.",
                "user": serialize_user(updated_user),
            },
            status=status.HTTP_200_OK,
        )


class SellerDashboardStatsView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user or not user.get("isSeller"):
            return Response(
                {"error": "Seller account required."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
        user = get_user_from_request(request)
        if not user or not user.get("isSeller"):
            return Response(
                {"error": "Seller account required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_id = str(user["_id"])
        products_col = get_products_collection()
        docs = list(products_col.find({"sellerId": user_id}))
        return Response([format_product(p) for p in docs], status=status.HTTP_200_OK)

    def post(self, request):
        user = get_user_from_request(request)
        if not user or not user.get("isSeller"):
            return Response(
                {"error": "Seller account required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data or {}
        name = str(data.get("name", "")).strip()
        category = str(data.get("category", "Hostel Essentials")).strip()
        img = str(data.get("img", "")).strip()
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

        # Default fallback image if none provided
        if not img:
            img = "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop"

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
            "img": img,
            "description": description or f"Listed by {seller_profile.get('storeName', user.get('name'))}",
            "sellerId": str(user["_id"]),
            "sellerName": seller_profile.get("storeName", user.get("name")),
            "sellerLocation": seller_profile.get("campusLocation", "Main Campus"),
            "inStock": True,
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
        user = get_user_from_request(request)
        if not user or not user.get("isSeller"):
            return Response(
                {"error": "Seller account required."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
        if "img" in data and str(data["img"]).strip():
            update_fields["img"] = str(data["img"]).strip()
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
        user = get_user_from_request(request)
        if not user or not user.get("isSeller"):
            return Response(
                {"error": "Seller account required."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
        user = get_user_from_request(request)
        if not user or not user.get("isSeller"):
            return Response(
                {"error": "Seller account required."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
        user = get_user_from_request(request)
        if not user or not user.get("isSeller"):
            return Response(
                {"error": "Seller account required."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
