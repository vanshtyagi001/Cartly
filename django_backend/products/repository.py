from datetime import datetime, timezone
from functools import lru_cache

from django.conf import settings
from pymongo import MongoClient


@lru_cache(maxsize=1)
def get_client():
    if not settings.MONGO_URI:
        raise RuntimeError("MONGO_URI is not configured")
    return MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)


def _get_db():
    client = get_client()
    database = settings.MONGO_DATABASE
    if not database:
        database = client.get_default_database("test").name
    return client[database]


def get_collection():
    return _get_db()[settings.MONGO_COLLECTION]


def get_categories_collection():
    return _get_db()["categories"]


def get_reviews_collection():
    return _get_db()["reviews"]


def get_stock_alerts_collection():
    return _get_db()["stock_alerts"]


def get_support_tickets_collection():
    return _get_db()["support_tickets"]


def get_newsletter_collection():
    return _get_db()["newsletter_subscribers"]


def get_coupons_collection():
    return _get_db()["coupons"]


def get_questions_collection():
    return _get_db()["product_questions"]


def get_notifications_collection():
    return _get_db()["notifications"]


def create_notification(user_id=None, email=None, title="", message="", link="/"):
    """Insert an in-app notification for a user by userId and/or email."""
    if not user_id and not email:
        return
    now = datetime.now(timezone.utc)
    doc = {
        "userId": str(user_id) if user_id else None,
        "email": str(email).strip().lower() if email else None,
        "title": title,
        "message": message,
        "link": link,
        "read": False,
        "createdAt": now,
    }
    try:
        get_notifications_collection().insert_one(doc)
    except Exception:
        pass
