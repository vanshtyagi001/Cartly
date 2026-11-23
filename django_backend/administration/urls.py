from django.urls import path
from .views import (
    AdminLoginView,
    AdminMeView,
    AdminMetricsView,
    AdminOrdersView,
    AdminProductsView,
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
    path("users", AdminUsersView.as_view(), name="admin-users"),
    path("users/<str:user_id>/toggle-admin", AdminUsersView.as_view(), name="admin-user-toggle"),
]
