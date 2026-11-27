from datetime import datetime, timezone

from django.http import HttpResponse
from pymongo.errors import DuplicateKeyError
from rest_framework.response import Response
from rest_framework.views import APIView

from .repository import (
    create_notification,
    get_categories_collection,
    get_collection,
    get_newsletter_collection,
    get_questions_collection,
    get_reviews_collection,
    get_stock_alerts_collection,
    get_support_tickets_collection,
)
from .serializers import format_product, json_safe, validate_product_payload
from accounts.auth import get_user_from_request, is_valid_email, normalize_email
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


def _has_user_purchased(user, product_id):
    if not user:
        return False
    user_id = str(user.get("_id", ""))
    user_email = str(user.get("email", "")).strip().lower()
    identity_filters = []
    if user_id:
        identity_filters.append({"userId": user_id})
    if user_email:
        identity_filters.append({"userEmail": user_email})
    if not identity_filters:
        return False
    orders_col = get_orders_collection()
    return bool(
        orders_col.find_one({
            "$or": identity_filters,
            "status": {"$ne": "Cancelled"},
            "items.id": product_id,
        })
    )


class ProductReviewsView(APIView):
    def get(self, request, product_id):
        try:
            user = get_user_from_request(request)
            summary = _build_reviews_summary(product_id)
            summary["canReview"] = _has_user_purchased(user, product_id)
            return Response(summary)
        except Exception as error:
            return Response({"error": str(error)}, status=500)

    def post(self, request, product_id):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Please sign in to leave a review."}, status=401)

        if not _has_user_purchased(user, product_id):
            return Response(
                {"error": "Only verified buyers who have purchased this product can leave a review."},
                status=403,
            )

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
                    "verifiedPurchase": True,
                    "updatedAt": now,
                },
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
        )

        summary = _build_reviews_summary(product_id)
        summary["canReview"] = True
        summary["message"] = "Thank you! Your review has been published."
        return Response(summary, status=201)

    def delete(self, request, product_id):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Please sign in to manage your review."}, status=401)

        user_id = str(user["_id"])
        reviews_col = get_reviews_collection()
        result = reviews_col.delete_one({"productId": product_id, "userId": user_id})
        if result.deleted_count == 0:
            return Response({"error": "Review not found."}, status=404)

        summary = _build_reviews_summary(product_id)
        summary["canReview"] = _has_user_purchased(user, product_id)
        summary["message"] = "Your review has been deleted."
        return Response(summary)


class ProductStockAlertView(APIView):
    def post(self, request, product_id):
        data = request.data or {}
        raw_email = str(data.get("email", "")).strip()
        if not raw_email or not is_valid_email(raw_email):
            return Response({"error": "Please enter a valid campus email address."}, status=400)

        clean_email = normalize_email(raw_email)
        prod = get_collection().find_one({"productId": product_id})
        if not prod:
            return Response({"error": "Product not found."}, status=404)

        now = datetime.now(timezone.utc)
        alerts_col = get_stock_alerts_collection()
        alerts_col.update_one(
            {"productId": product_id, "email": clean_email},
            {
                "$set": {
                    "productId": product_id,
                    "productName": prod.get("name", ""),
                    "sellerId": prod.get("sellerId"),
                    "email": clean_email,
                    "notified": False,
                    "updatedAt": now,
                },
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
        )

        return Response(
            {
                "message": f"You're on the list! We'll notify {clean_email} when {prod.get('name', 'this item')} is restocked.",
                "email": clean_email,
                "productId": product_id,
            },
            status=201,
        )


class SupportTicketCreateView(APIView):
    def post(self, request):
        data = request.data or {}
        name = str(data.get("name", "")).strip()
        raw_email = str(data.get("email", "")).strip()
        order_id = str(data.get("orderId", "")).strip()
        topic = str(data.get("topic", "General Inquiry")).strip()
        message = str(data.get("message", "")).strip()

        if not name:
            return Response({"error": "Full name is required."}, status=400)
        if not raw_email or not is_valid_email(raw_email):
            return Response({"error": "Please provide a valid email address."}, status=400)
        if not message:
            return Response({"error": "Please enter your message."}, status=400)

        now = datetime.now(timezone.utc)
        tickets_col = get_support_tickets_collection()
        doc = {
            "name": name,
            "email": normalize_email(raw_email),
            "orderId": order_id,
            "topic": topic,
            "message": message,
            "status": "Open",
            "createdAt": now,
            "updatedAt": now,
        }
        ins = tickets_col.insert_one(doc)
        return Response(
            {
                "message": "Your support inquiry has been logged. Our campus desk will respond shortly.",
                "ticketId": str(ins.inserted_id),
            },
            status=201,
        )


class NewsletterSubscribeView(APIView):
    def post(self, request):
        data = request.data or {}
        raw_email = str(data.get("email", "")).strip()
        if not raw_email or not is_valid_email(raw_email):
            return Response({"error": "Please enter a valid email address."}, status=400)

        clean_email = normalize_email(raw_email)
        now = datetime.now(timezone.utc)
        get_newsletter_collection().update_one(
            {"email": clean_email},
            {
                "$set": {"email": clean_email, "active": True, "updatedAt": now},
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
        )
        return Response(
            {"message": "Subscribed to the Cartly dispatch.", "email": clean_email},
            status=201,
        )


def _format_question(doc):
    created = doc.get("createdAt")
    answered_at = doc.get("answeredAt")
    return {
        "id": str(doc["_id"]),
        "productId": doc.get("productId"),
        "productName": doc.get("productName", ""),
        "userName": doc.get("userName", "Campus Student"),
        "question": doc.get("question", ""),
        "answer": doc.get("answer", ""),
        "answeredBy": doc.get("answeredBy", ""),
        "date": created.strftime("%b %d, %Y") if isinstance(created, datetime) else "",
        "answeredDate": answered_at.strftime("%b %d, %Y") if isinstance(answered_at, datetime) else "",
    }


class ProductQuestionsView(APIView):
    def get(self, request, product_id):
        try:
            docs = list(get_questions_collection().find({"productId": product_id}).sort("createdAt", -1))
            return Response({"questions": [_format_question(d) for d in docs]})
        except Exception as error:
            return Response({"error": str(error)}, status=500)

    def post(self, request, product_id):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Please sign in to ask a question."}, status=401)

        question = str((request.data or {}).get("question", "")).strip()
        if not question:
            return Response({"error": "Please enter your question."}, status=400)

        prod = get_collection().find_one({"productId": product_id})
        if not prod:
            return Response({"error": "Product not found."}, status=404)

        now = datetime.now(timezone.utc)
        doc = {
            "productId": product_id,
            "productName": prod.get("name", ""),
            "sellerId": prod.get("sellerId"),
            "userId": str(user["_id"]),
            "userName": user.get("name", "Campus Student"),
            "question": question,
            "answer": "",
            "answeredBy": "",
            "answeredAt": None,
            "createdAt": now,
        }
        ins = get_questions_collection().insert_one(doc)
        doc["_id"] = ins.inserted_id

        if prod.get("sellerId"):
            create_notification(
                user_id=prod.get("sellerId"),
                title=f"New Question on {prod.get('name', 'Product')}",
                message=question[:100],
                link="/seller",
            )

        docs = list(get_questions_collection().find({"productId": product_id}).sort("createdAt", -1))
        return Response(
            {
                "message": "Your question has been sent to the campus seller.",
                "questions": [_format_question(d) for d in docs],
            },
            status=201,
        )
