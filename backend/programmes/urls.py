from django.urls import path
from .views import (
    ProgrammeListCreateView,
    ProgrammeDetailView,
    MilestoneListCreateView,
    MilestoneDetailView,
    RatioCalculatorView,
    NUCStandardsView,
    ProgrammeRatioView
)

urlpatterns = [
    path('', ProgrammeListCreateView.as_view(), name='programme-list'),
    path('<int:pk>/', ProgrammeDetailView.as_view(), name='programme-detail'),
    path('<int:pk>/milestones/', MilestoneListCreateView.as_view(), name='milestone-list'),
    path('milestones/<int:pk>/', MilestoneDetailView.as_view(), name='milestone-detail'),
    path('calculator/', RatioCalculatorView.as_view(), name='ratio-calculator'),
    path('standards/', NUCStandardsView.as_view(), name='nuc-standards'),
    path('<int:pk>/ratio/', ProgrammeRatioView.as_view(), name='programme-ratio'),
]