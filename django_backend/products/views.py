from datetime import datetime, timezone

from django.http import HttpResponse
from pymongo.errors import DuplicateKeyError
from rest_framework.response import Response
from rest_framework.views import APIView

from .repository import get_collection
from .serializers import format_product, json_safe, validate_product_payload


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
