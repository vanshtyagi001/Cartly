from django.urls import path

from .views import (
    CategoryListView,
    HealthView,
    NewsletterSubscribeView,
    ProductDetailView,
    ProductListCreateView,
    ProductQuestionsView,
    ProductReviewsView,
    ProductStockAlertView,
    RootView,
    SupportTicketCreateView,
)


urlpatterns = [
    path("", RootView.as_view(), name="root"),
    path("api/health", HealthView.as_view(), name="health"),
    path("api/products", ProductListCreateView.as_view(), name="products"),
    path("api/products/<int:product_id>", ProductDetailView.as_view(), name="product-detail"),
    path("api/products/<int:product_id>/reviews", ProductReviewsView.as_view(), name="product-reviews"),
    path("api/products/<int:product_id>/questions", ProductQuestionsView.as_view(), name="product-questions"),
    path("api/products/<int:product_id>/stock-alert", ProductStockAlertView.as_view(), name="product-stock-alert"),
    path("api/support/tickets", SupportTicketCreateView.as_view(), name="support-tickets"),
    path("api/newsletter", NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
    path("api/categories", CategoryListView.as_view(), name="categories"),
]
