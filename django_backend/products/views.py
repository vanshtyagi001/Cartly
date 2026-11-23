from datetime import datetime, timezone

from django.http import HttpResponse
from pymongo.errors import DuplicateKeyError
from rest_framework.response import Response
from rest_framework.views import APIView

from .repository import get_categories_collection, get_collection
from .serializers import format_product, json_safe, validate_product_payload


DEFAULT_CATEGORIES = [
    "Hostel Essentials",
    "Electronics",
    "Stationery",
    "Trekking Essentials",
]


def ensure_default_categories():
    col = get_categories_collection()
    now = datetime.now(timezone.utc)
    for cat in DEFAULT_CATEGORIES:
        col.update_one(
            {"name": cat},
            {
                "$setOnInsert": {
                    "name": cat,
                    "createdAt": now,
                    "updatedAt": now,
                }
            },
            upsert=True,
        )


class CategoryListView(APIView):
    def get(self, request):
        try:
            ensure_default_categories()
            col = get_categories_collection()
            docs = list(col.find().sort("createdAt", 1))
            names = [doc.get("name") for doc in docs if doc.get("name")]
            # Guarantee defaults are always present and unique
            for d in DEFAULT_CATEGORIES:
                if d not in names:
                    names.append(d)
            return Response({"categories": names})
        except Exception as error:
            return Response({"categories": DEFAULT_CATEGORIES})



class RootView(APIView):
    def get(self, request):
        return HttpResponse("Cartly API is running!")


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "OK"})


class ProductListCreateView(APIView):
    def get(self, request):
        try:
            products = [format_product(product) for product in get_collection().find()]
            return Response(products)
        except Exception as error:
            return Response(
                {"message": "Server Error", "error": str(error)},
                status=500,
            )

    def post(self, request):
        try:
            product = validate_product_payload(request.data)
            now = datetime.now(timezone.utc)
            product["createdAt"] = now
            product["updatedAt"] = now
            result = get_collection().insert_one(product)
            saved_product = get_collection().find_one({"_id": result.inserted_id})
            return Response(json_safe(saved_product), status=201)
        except ValueError as error:
            return Response(
                {"message": "Error adding product", "error": str(error)},
                status=400,
            )
        except DuplicateKeyError as error:
            return Response(
                {"message": "Error adding product", "error": str(error)},
                status=400,
            )
        except Exception as error:
            return Response(
                {"message": "Error adding product", "error": str(error)},
                status=400,
            )
