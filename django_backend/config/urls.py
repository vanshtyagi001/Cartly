from django.urls import include, path

urlpatterns = [
    path("", include("products.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/orders/", include("orders.urls")),
]
