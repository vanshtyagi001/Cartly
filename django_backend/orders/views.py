from datetime import datetime, timezone
from bson import ObjectId
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.auth import get_user_from_request
from products.repository import get_collection as get_products_collection
from .repository import get_orders_collection
from .serializers import format_order, generate_order_id


class OrderListCreateView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        orders_col = get_orders_collection()
        
        query = {}
        if user:
            # Query by user id or user email
            query = {
                "$or": [
                    {"userId": str(user["_id"])},
                    {"userEmail": user["email"]},
                ]
            }
        else:
            email = request.query_params.get("email")
            if email:
                query = {"userEmail": email.strip().lower()}

        try:
            docs = list(orders_col.find(query).sort("createdAt", -1))
            return Response([format_order(doc) for doc in docs], status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"error": f"Failed to fetch orders: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        user = get_user_from_request(request)
        data = request.data or {}

        items = data.get("items", [])
        if not items or not isinstance(items, list):
            return Response(
                {"error": "Order must contain at least one item."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shipping_address = data.get("shippingAddress", {})
        full_name = str(shipping_address.get("fullName", "")).strip()
        phone = str(shipping_address.get("phone", "")).strip()
        campus = str(shipping_address.get("campus", "")).strip()
        hostel_block = str(shipping_address.get("hostelBlock", "")).strip()
        room_number = str(shipping_address.get("roomNumber", "")).strip()

        if not full_name or not phone or not hostel_block or not room_number:
            return Response(
                {"error": "Please provide full name, phone number, hostel block, and room number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_method = str(data.get("paymentMethod", "")).strip()
        if not payment_method:
            payment_method = "Cash on Delivery (COD)"

        # Only COD is supported for actual order placement
        if "cod" not in payment_method.lower() and "cash" not in payment_method.lower():
            return Response(
                {"error": "Only Cash on Delivery (COD) is currently supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate totals
        subtotal = 0.0
        sanitized_items = []
        products_col = get_products_collection()

        # Validate stock availability before confirming order
        for item in items:
            raw_id = item.get("id") or item.get("productId")
            qty = max(1, int(item.get("quantity", 1)))
            
            # Match product in DB by integer productId or string ID
            prod_query = {}
            if isinstance(raw_id, int) or (isinstance(raw_id, str) and raw_id.isdigit()):
                prod_query = {"productId": int(raw_id)}
            elif ObjectId.is_valid(str(raw_id)):
                prod_query = {"_id": ObjectId(str(raw_id))}

            db_prod = products_col.find_one(prod_query) if prod_query else None
            current_stock = db_prod.get("stock", 25) if db_prod else 25
            try:
                current_stock = int(current_stock)
            except (ValueError, TypeError):
                current_stock = 0

            if db_prod and current_stock < qty:
                return Response(
                    {
                        "error": f"Insufficient stock for '{db_prod.get('name', 'Product')}'. Only {current_stock} item(s) left in stock.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Determine price (from db or request)
            if db_prod and db_prod.get("price") is not None:
                price = float(db_prod["price"])
            else:
                raw_price = item.get("price", 0)
                if isinstance(raw_price, str):
                    cleaned_price = "".join(ch for ch in raw_price if ch.isdigit() or ch in ".-")
                    price = float(cleaned_price) if cleaned_price else 0.0
                else:
                    price = float(raw_price)

            subtotal += price * qty

            sanitized_items.append(
                {
                    "id": item.get("id") or (db_prod.get("productId") if db_prod else None),
                    "name": db_prod.get("name") if db_prod else item.get("name"),
                    "category": db_prod.get("category") if db_prod else item.get("category", "Essentials"),
                    "price": f"₹{price:,.2f}",
                    "rawPrice": price,
                    "quantity": qty,
                    "img": db_prod.get("img") if db_prod else item.get("img", ""),
                    "sellerId": db_prod.get("sellerId") if db_prod else item.get("sellerId"),
                }
            )

        tax = round(subtotal * 0.08, 2)
        total = round(subtotal + tax, 2)

        now = datetime.now(timezone.utc)
        order_doc = {
            "orderId": generate_order_id(),
            "userId": str(user["_id"]) if user else None,
            "userName": user.get("name") if user else full_name,
            "userEmail": user.get("email") if user else str(shipping_address.get("email", "")).strip().lower(),
            "items": sanitized_items,
            "shippingAddress": {
                "fullName": full_name,
                "phone": phone,
                "campus": campus or "Main Campus",
                "hostelBlock": hostel_block,
                "roomNumber": room_number,
                "city": str(shipping_address.get("city", "")).strip() or "Campus City",
                "pincode": str(shipping_address.get("pincode", "")).strip() or "",
            },
            "paymentMethod": "Cash on Delivery",
            "paymentStatus": "Pending (Cash on Delivery)",
            "subtotal": subtotal,
            "tax": tax,
            "shipping": 0,
            "total": total,
            "status": "Confirmed",
            "createdAt": now,
            "updatedAt": now,
        }

        try:
            orders_col = get_orders_collection()
            result = orders_col.insert_one(order_doc)
            order_doc["_id"] = result.inserted_id

            # Automatically decrement stock and update inStock status
            for it in sanitized_items:
                raw_id = it.get("id")
                qty = it.get("quantity", 1)
                prod_query = {}
                if isinstance(raw_id, int) or (isinstance(raw_id, str) and str(raw_id).isdigit()):
                    prod_query = {"productId": int(raw_id)}
                elif ObjectId.is_valid(str(raw_id)):
                    prod_query = {"_id": ObjectId(str(raw_id))}

                if prod_query:
                    # Fetch and decrement
                    p = products_col.find_one(prod_query)
                    if p:
                        curr = p.get("stock", 25)
                        try:
                            curr = int(curr)
                        except (ValueError, TypeError):
                            curr = 25
                        new_stock = max(0, curr - qty)
                        products_col.update_one(
                            {"_id": p["_id"]},
                            {
                                "$set": {
                                    "stock": new_stock,
                                    "inStock": new_stock > 0,
                                    "updatedAt": now,
                                }
                            },
                        )

            return Response(
                {
                    "message": "Order placed successfully via Cash on Delivery!",
                    "order": format_order(order_doc),
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response(
                {"error": f"Failed to place order: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrderDetailView(APIView):
    def get(self, request, order_id):
        orders_col = get_orders_collection()
        doc = orders_col.find_one({"orderId": order_id})
        if not doc and ObjectId.is_valid(order_id):
            doc = orders_col.find_one({"_id": ObjectId(order_id)})
        if not doc:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(format_order(doc), status=status.HTTP_200_OK)


class OrderCancelView(APIView):
    def post(self, request, order_id):
        user = get_user_from_request(request)
        if not user:
            return Response(
                {"error": "Please sign in to cancel an order."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        orders_col = get_orders_collection()
        doc = orders_col.find_one({"orderId": order_id})
        if not doc and ObjectId.is_valid(order_id):
            doc = orders_col.find_one({"_id": ObjectId(order_id)})

        if not doc:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        user_id = str(user["_id"])
        user_email = str(user.get("email", "")).lower()
        owns_order = (
            doc.get("userId") == user_id
            or (user_email and str(doc.get("userEmail", "")).lower() == user_email)
        )
        if not owns_order:
            return Response(
                {"error": "You are not authorized to cancel this order."},
                status=status.HTTP_403_FORBIDDEN,
            )

        current_status = doc.get("status", "Confirmed")
        if current_status != "Confirmed":
            return Response(
                {"error": f"Order cannot be cancelled once it is '{current_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = datetime.now(timezone.utc)
        orders_col.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "status": "Cancelled",
                    "cancelledBy": "buyer",
                    "cancelledAt": now,
                    "updatedAt": now,
                }
            },
        )

        # Restore product stock for every cancelled item
        products_col = get_products_collection()
        for it in doc.get("items", []):
            raw_id = it.get("id")
            qty = int(it.get("quantity", 1) or 1)
            prod_query = {}
            if isinstance(raw_id, int) or (isinstance(raw_id, str) and str(raw_id).isdigit()):
                prod_query = {"productId": int(raw_id)}
            elif ObjectId.is_valid(str(raw_id)):
                prod_query = {"_id": ObjectId(str(raw_id))}

            if prod_query:
                p = products_col.find_one(prod_query)
                if p:
                    curr = p.get("stock", 0)
                    try:
                        curr = int(curr)
                    except (ValueError, TypeError):
                        curr = 0
                    new_stock = max(0, curr + qty)
                    products_col.update_one(
                        {"_id": p["_id"]},
                        {
                            "$set": {
                                "stock": new_stock,
                                "inStock": new_stock > 0,
                                "updatedAt": now,
                            }
                        },
                    )

        updated_doc = orders_col.find_one({"_id": doc["_id"]})
        return Response(
            {
                "message": f"Order #{doc.get('orderId', order_id)} has been cancelled and stock restored.",
                "order": format_order(updated_doc),
            },
            status=status.HTTP_200_OK,
        )
