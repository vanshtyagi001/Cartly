from django.urls import path
from .views import (
    AdminCategoriesView,
    AdminLoginView,
    AdminMeView,
    AdminMetricsView,
    AdminOrdersView,
    AdminProductsView,
    AdminSellerStatusView,
    AdminSellerUpdateView,
    AdminSupportView,
    AdminUsersView,
)

urlpatterns = [
    path("login", AdminLoginView.as_view(), name="admin-login"),
    path("me", AdminMeView.as_view(), name="admin-me"),
    path("metrics", AdminMetricsView.as_view(), name="admin-metrics"),
    path("orders", AdminOrdersView.as_view(), name="admin-orders"),
    path("orders/<str:order_id>", AdminOrdersView.as_view(), name="admin-order-detail"),
    path("products", AdminProductsView.as_view(), name="admin-products"),
    path("products/<int:product_id>", AdminProductsView.as_view(), name="admin-product-detail"),
    path("categories", AdminCategoriesView.as_view(), name="admin-categories"),
    path("categories/<str:category_name>", AdminCategoriesView.as_view(), name="admin-category-delete"),
    path("users", AdminUsersView.as_view(), name="admin-users"),
    path("users/<str:user_id>/toggle-admin", AdminUsersView.as_view(), name="admin-user-toggle"),
    path("sellers/<str:user_id>", AdminSellerUpdateView.as_view(), name="admin-seller-update"),
    path("sellers/<str:user_id>/status", AdminSellerStatusView.as_view(), name="admin-seller-status"),
    path("support", AdminSupportView.as_view(), name="admin-support"),
    path("support/<str:ticket_id>", AdminSupportView.as_view(), name="admin-support-update"),
]
