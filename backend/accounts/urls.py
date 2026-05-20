from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, MeView,
    ProfileUpdateView, ChangePasswordView, PreferencesView, DeactivateAccountView,
    ForgotPasswordView, ResetPasswordView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/', ProfileUpdateView.as_view(), name='profile-update'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('account/', DeactivateAccountView.as_view(), name='deactivate-account'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]