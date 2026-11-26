from django.urls import path
from .views import LoginView, MeView, NotificationsView, RegisterView, WishlistView

urlpatterns = [
    path("register", RegisterView.as_view(), name="auth-register"),
    path("login", LoginView.as_view(), name="auth-login"),
    path("me", MeView.as_view(), name="auth-me"),
    path("profile", MeView.as_view(), name="auth-profile"),
    path("wishlist", WishlistView.as_view(), name="auth-wishlist"),
    path("notifications", NotificationsView.as_view(), name="auth-notifications"),
]
