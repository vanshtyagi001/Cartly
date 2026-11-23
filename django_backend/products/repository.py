from functools import lru_cache

from django.conf import settings
from pymongo import MongoClient


@lru_cache(maxsize=1)
def get_client():
    if not settings.MONGO_URI:
        raise RuntimeError("MONGO_URI is not configured")
    return MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)


def get_collection():
    client = get_client()
    database = settings.MONGO_DATABASE
    if not database:
        database = client.get_default_database("test").name
    return client[database][settings.MONGO_COLLECTION]


def get_categories_collection():
    client = get_client()
    database = settings.MONGO_DATABASE
    if not database:
        database = client.get_default_database("test").name
    return client[database]["categories"]
