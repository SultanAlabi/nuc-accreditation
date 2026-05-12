from django.urls import path
from .views import (
    ProgrammeListCreateView,
    ProgrammeDetailView,
    MilestoneListCreateView,
    MilestoneDetailView
)

urlpatterns = [
    path('', ProgrammeListCreateView.as_view(), name='programme-list'),
    path('<int:pk>/', ProgrammeDetailView.as_view(), name='programme-detail'),
    path('<int:pk>/milestones/', MilestoneListCreateView.as_view(), name='milestone-list'),
    path('milestones/<int:pk>/', MilestoneDetailView.as_view(), name='milestone-detail'),
]