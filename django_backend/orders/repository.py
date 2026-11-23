from django.conf import settings
from products.repository import get_client


def get_orders_collection():
    client = get_client()
    database = settings.MONGO_DATABASE
    if not database:
        database = client.get_default_database("test").name
    return client[database]["orders"]
