from django.urls import path
from .views import (
    PublicSellerStoreView,
    SellerDashboardStatsView,
    SellerOnboardView,
    SellerOrderStatusUpdateView,
    SellerOrdersView,
    SellerProductDetailView,
    SellerProductListCreateView,
    SellerProfileView,
)

urlpatterns = [
    path("onboard", SellerOnboardView.as_view(), name="seller-onboard"),
    path("dashboard", SellerDashboardStatsView.as_view(), name="seller-dashboard"),
    path("profile", SellerProfileView.as_view(), name="seller-profile"),
    path("store/<str:seller_id>", PublicSellerStoreView.as_view(), name="public-seller-store"),
    path("products", SellerProductListCreateView.as_view(), name="seller-products"),
    path("products/<int:product_id>", SellerProductDetailView.as_view(), name="seller-product-detail"),
    path("orders", SellerOrdersView.as_view(), name="seller-orders"),
    path("orders/<str:order_id>/status", SellerOrderStatusUpdateView.as_view(), name="seller-order-status"),
]
