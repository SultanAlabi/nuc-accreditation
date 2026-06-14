from django.urls import path
from .views import (
    GlobalDocumentListView, DocumentListCreateView,
    DocumentDetailView, VerifyDocumentView
)

urlpatterns = [
    path('documents/', GlobalDocumentListView.as_view(), name='global-document-list'),
    path('programmes/<int:pk>/documents/', DocumentListCreateView.as_view(), name='document-list'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('documents/<int:pk>/verify/', VerifyDocumentView.as_view(), name='document-verify'),
]