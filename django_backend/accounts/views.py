from datetime import datetime, timezone
from bson import ObjectId
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from products.repository import get_notifications_collection

from .auth import (
    generate_token,
    get_user_from_request,
    hash_password,
    is_valid_email,
    normalize_email,
    serialize_user,
    verify_password,
)
from .repository import get_users_collection


class RegisterView(APIView):
    def post(self, request):
        data = request.data or {}
        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip()
        password = str(data.get("password", ""))

        if not name:
            return Response(
                {"error": "Please provide your full name."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not email or not is_valid_email(email):
            return Response(
                {"error": "Please enter a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clean_email = normalize_email(email)
        users = get_users_collection()

        # Check for existing user (case-insensitive)
        existing_user = users.find_one({"email": clean_email})
        if existing_user:
            return Response(
                {"error": "An account with this email address already exists. Please sign in."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = datetime.now(timezone.utc)
        user_doc = {
            "name": name,
            "email": clean_email,
            "password": hash_password(password),
            "createdAt": now,
            "updatedAt": now,
        }

        try:
            result = users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            token = generate_token(str(result.inserted_id))
            return Response(
                {
                    "message": "Account created successfully.",
                    "user": serialize_user(user_doc),
                    "token": token,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response(
                {"error": f"Failed to create account: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(APIView):
    def post(self, request):
        data = request.data or {}
        email = str(data.get("email", "")).strip()
        password = str(data.get("password", ""))

        if not email or not password:
            return Response(
                {"error": "Please provide both email and password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clean_email = normalize_email(email)
        users = get_users_collection()
        user = users.find_one({"email": clean_email})

        if not user or not verify_password(password, user.get("password", "")):
            return Response(
                {"error": "Invalid email or password. Please try again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = generate_token(str(user["_id"]))
        return Response(
            {
                "message": "Signed in successfully.",
                "user": serialize_user(user),
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response(
                {"error": "Authentication required or session expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({"user": serialize_user(user)}, status=status.HTTP_200_OK)

    def put(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        data = request.data or {}
        users_col = get_users_collection()
        now = datetime.now(timezone.utc)

        update_fields = {"updatedAt": now}

        if "name" in data and str(data["name"]).strip():
            update_fields["name"] = str(data["name"]).strip()

        if "phone" in data:
            update_fields["phone"] = str(data["phone"]).strip()

        if "defaultAddress" in data and isinstance(data["defaultAddress"], dict):
            addr = data["defaultAddress"]
            update_fields["defaultAddress"] = {
                "fullName": str(addr.get("fullName", update_fields.get("name", user.get("name", "")))).strip(),
                "phone": str(addr.get("phone", update_fields.get("phone", user.get("phone", "")))).strip(),
                "campus": str(addr.get("campus", "North Campus")).strip(),
                "hostelBlock": str(addr.get("hostelBlock", "")).strip(),
                "roomNumber": str(addr.get("roomNumber", "")).strip(),
                "city": str(addr.get("city", "Delhi")).strip(),
                "pincode": str(addr.get("pincode", "")).strip(),
            }

        users_col.update_one({"_id": user["_id"]}, {"$set": update_fields})
        updated_user = users_col.find_one({"_id": user["_id"]})
        return Response(
            {
                "message": "Profile and campus delivery address updated successfully.",
                "user": serialize_user(updated_user),
            },
            status=status.HTTP_200_OK,
        )


class WishlistView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({"wishlist": user.get("wishlist", [])}, status=status.HTTP_200_OK)

    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data or {}
        try:
            product_id = int(data.get("productId"))
        except (TypeError, ValueError):
            return Response({"error": "Valid productId is required."}, status=status.HTTP_400_BAD_REQUEST)

        users_col = get_users_collection()
        current = list(user.get("wishlist", []))
        if product_id in current:
            users_col.update_one({"_id": user["_id"]}, {"$pull": {"wishlist": product_id}})
            action = "removed"
        else:
            users_col.update_one({"_id": user["_id"]}, {"$addToSet": {"wishlist": product_id}})
            action = "added"

        updated = users_col.find_one({"_id": user["_id"]})
        return Response(
            {"wishlist": updated.get("wishlist", []), "action": action},
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        raw_id = request.query_params.get("productId") or (request.data or {}).get("productId")
        try:
            product_id = int(raw_id)
        except (TypeError, ValueError):
            return Response({"error": "Valid productId is required."}, status=status.HTTP_400_BAD_REQUEST)

        users_col = get_users_collection()
        users_col.update_one({"_id": user["_id"]}, {"$pull": {"wishlist": product_id}})
        updated = users_col.find_one({"_id": user["_id"]})
        return Response({"wishlist": updated.get("wishlist", [])}, status=status.HTTP_200_OK)


class NotificationsView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        user_id = str(user["_id"])
        email = str(user.get("email", "")).strip().lower()
        query = {"$or": [{"userId": user_id}]}
        if email:
            query["$or"].append({"email": email})

        col = get_notifications_collection()
        docs = list(col.find(query).sort("createdAt", -1).limit(15))
        items = []
        unread_count = 0
        for d in docs:
            is_read = bool(d.get("read", False))
            if not is_read:
                unread_count += 1
            created = d.get("createdAt")
            items.append({
                "id": str(d["_id"]),
                "title": d.get("title", ""),
                "message": d.get("message", ""),
                "link": d.get("link", "/"),
                "read": is_read,
                "date": created.strftime("%b %d, %I:%M %p") if isinstance(created, datetime) else "",
            })

        return Response({"notifications": items, "unreadCount": unread_count}, status=status.HTTP_200_OK)

    def patch(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        user_id = str(user["_id"])
        email = str(user.get("email", "")).strip().lower()
        query = {"$or": [{"userId": user_id}]}
        if email:
            query["$or"].append({"email": email})

        notif_id = (request.data or {}).get("id")
        col = get_notifications_collection()
        if notif_id and ObjectId.is_valid(str(notif_id)):
            col.update_one({"_id": ObjectId(str(notif_id)), **query}, {"$set": {"read": True}})
        else:
            col.update_many(query, {"$set": {"read": True}})

        return Response({"message": "Notifications marked as read."}, status=status.HTTP_200_OK)
