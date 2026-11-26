from django.urls import path
from .views import OrderCancelView, OrderDetailView, OrderListCreateView, ValidateCouponView

urlpatterns = [
    path("", OrderListCreateView.as_view(), name="order-list-create"),
    path("validate-coupon", ValidateCouponView.as_view(), name="order-validate-coupon"),
    path("<str:order_id>", OrderDetailView.as_view(), name="order-detail"),
    path("<str:order_id>/cancel", OrderCancelView.as_view(), name="order-cancel"),
]
