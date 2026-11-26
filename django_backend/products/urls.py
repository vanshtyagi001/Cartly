from django.urls import path

from .views import CategoryListView, HealthView, ProductDetailView, ProductListCreateView, RootView


urlpatterns = [
    path("", RootView.as_view(), name="root"),
    path("api/health", HealthView.as_view(), name="health"),
    path("api/products", ProductListCreateView.as_view(), name="products"),
    path("api/products/<int:product_id>", ProductDetailView.as_view(), name="product-detail"),
    path("api/categories", CategoryListView.as_view(), name="categories"),
]
