from datetime import datetime, timezone
import re
from bson import ObjectId
from django.contrib.auth.hashers import check_password, make_password
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

from .repository import get_users_collection

signer = TimestampSigner(salt="cartly-user-auth-salt-v1")
TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 30  # 30 days


def normalize_email(email: str) -> str:
    return email.strip().lower()


def is_valid_email(email: str) -> bool:
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email.strip()))


def hash_password(password: str) -> str:
    return make_password(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return check_password(plain_password, hashed_password)


def generate_token(user_id: str) -> str:
    return signer.sign(str(user_id))


def verify_token(token: str) -> str | None:
    try:
        return signer.unsign(token, max_age=TOKEN_EXPIRY_SECONDS)
    except (BadSignature, SignatureExpired):
        return None


def serialize_user(user_doc: dict) -> dict:
    created_at = user_doc.get("createdAt")
    if isinstance(created_at, datetime):
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        created_at_str = created_at.isoformat()
    else:
        created_at_str = str(created_at or "")

    default_address = user_doc.get("defaultAddress")
    if not isinstance(default_address, dict):
        default_address = {
            "fullName": user_doc.get("name", ""),
            "phone": user_doc.get("phone", ""),
            "campus": "North Campus",
            "hostelBlock": "",
            "roomNumber": "",
            "city": "Delhi",
            "pincode": "110007",
        }

    raw_status = user_doc.get("sellerStatus")
    if not raw_status:
        seller_status = "approved" if user_doc.get("isSeller") else "none"
    else:
        seller_status = str(raw_status).lower()

    is_seller = (seller_status == "approved")
    seller_details = user_doc.get("sellerDetails") or user_doc.get("sellerProfile")

    return {
        "id": str(user_doc["_id"]),
        "name": user_doc.get("name", ""),
        "email": user_doc.get("email", ""),
        "phone": user_doc.get("phone", ""),
        "isAdmin": bool(user_doc.get("isAdmin", False)),
        "isSeller": is_seller,
        "sellerStatus": seller_status,
        "sellerProfile": seller_details,
        "sellerDetails": seller_details,
        "wishlist": user_doc.get("wishlist", []),
        "defaultAddress": default_address,
        "createdAt": created_at_str,
    }


def get_user_from_request(request) -> dict | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    user_id = verify_token(token)
    if not user_id:
        return None
    try:
        return get_users_collection().find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None
