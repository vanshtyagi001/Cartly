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
