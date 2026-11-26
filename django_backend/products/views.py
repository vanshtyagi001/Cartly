from datetime import datetime, timezone

from django.http import HttpResponse
from pymongo.errors import DuplicateKeyError
from rest_framework.response import Response
from rest_framework.views import APIView

from .repository import get_categories_collection, get_collection, get_reviews_collection
from .serializers import format_product, json_safe, validate_product_payload
from accounts.auth import get_user_from_request
from orders.repository import get_orders_collection


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
            col = get_collection()
            query = {}

            category = request.query_params.get("category", "").strip()
            if category and category != "All Products":
                query["category"] = category

            search = request.query_params.get("search", "").strip()
            if search:
                import re
                safe_q = re.escape(search)
                query["$or"] = [
                    {"name": {"$regex": safe_q, "$options": "i"}},
                    {"description": {"$regex": safe_q, "$options": "i"}},
                    {"sellerName": {"$regex": safe_q, "$options": "i"}},
                    {"category": {"$regex": safe_q, "$options": "i"}},
                ]

            sort_param = request.query_params.get("sort", "").strip()
            sort_spec = None
            if sort_param == "price-asc":
                sort_spec = [("price", 1)]
            elif sort_param == "price-desc":
                sort_spec = [("price", -1)]
            elif sort_param == "name-desc":
                sort_spec = [("name", -1)]
            elif sort_param == "name-asc":
                sort_spec = [("name", 1)]

            cursor = col.find(query)
            if sort_spec:
                cursor = cursor.sort(sort_spec)

            products = [format_product(product) for product in cursor]
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


class ProductDetailView(APIView):
    def get(self, request, product_id):
        try:
            col = get_collection()
            prod = col.find_one({"productId": product_id})
            if not prod:
                return Response(
                    {"error": "Product not found."},
                    status=404,
                )

            category = prod.get("category")
            same_cat = list(
                col.find({"productId": {"$ne": product_id}, "category": category}).limit(4)
            )
            suggestions = list(same_cat)

            if len(suggestions) < 4:
                needed = 4 - len(suggestions)
                other_cat = list(
                    col.find({"productId": {"$ne": product_id}, "category": {"$ne": category}}).limit(needed)
                )
                suggestions.extend(other_cat)

            return Response(
                {
                    "product": format_product(prod),
                    "suggestions": [format_product(s) for s in suggestions],
                }
            )
        except Exception as error:
            return Response(
                {"message": "Server Error", "error": str(error)},
                status=500,
            )


def _build_reviews_summary(product_id):
    reviews_col = get_reviews_collection()
    docs = list(reviews_col.find({"productId": product_id}).sort("updatedAt", -1))
    total = len(docs)
    distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    rating_sum = 0
    formatted = []

    for d in docs:
        r = int(d.get("rating", 5))
        r = max(1, min(5, r))
        rating_sum += r
        distribution[str(r)] += 1
        created = d.get("updatedAt") or d.get("createdAt")
        date_str = created.strftime("%b %d, %Y") if isinstance(created, datetime) else str(created or "")
        formatted.append({
            "id": str(d["_id"]),
            "userId": d.get("userId", ""),
            "userName": d.get("userName", "Campus Student"),
            "rating": r,
            "comment": d.get("comment", ""),
            "verifiedPurchase": bool(d.get("verifiedPurchase", False)),
            "date": date_str,
        })

    avg = round(rating_sum / total, 1) if total > 0 else 0.0
    return {
        "averageRating": avg,
        "totalReviews": total,
        "distribution": distribution,
        "reviews": formatted,
    }


class ProductReviewsView(APIView):
    def get(self, request, product_id):
        try:
            return Response(_build_reviews_summary(product_id))
        except Exception as error:
            return Response({"error": str(error)}, status=500)

    def post(self, request, product_id):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Please sign in to leave a review."}, status=401)

        data = request.data or {}
        try:
            rating = int(data.get("rating", 0))
        except (ValueError, TypeError):
            rating = 0

        comment = str(data.get("comment", "")).strip()
        if rating < 1 or rating > 5:
            return Response({"error": "Please select a star rating between 1 and 5."}, status=400)
        if not comment:
            return Response({"error": "Please write a brief review comment."}, status=400)

        user_id = str(user["_id"])
        orders_col = get_orders_collection()
        has_ordered = orders_col.find_one({
            "userId": user_id,
            "status": {"$ne": "Cancelled"},
            "items.id": product_id,
        })

        now = datetime.now(timezone.utc)
        reviews_col = get_reviews_collection()
        reviews_col.update_one(
            {"productId": product_id, "userId": user_id},
            {
                "$set": {
                    "productId": product_id,
                    "userId": user_id,
                    "userName": user.get("name", "Campus Student"),
                    "rating": rating,
                    "comment": comment,
                    "verifiedPurchase": bool(has_ordered),
                    "updatedAt": now,
                },
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
        )

        summary = _build_reviews_summary(product_id)
        summary["message"] = "Thank you! Your review has been published."
        return Response(summary, status=201)
