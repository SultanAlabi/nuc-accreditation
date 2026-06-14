from django.urls import path
from .views import (
    ProgrammeListCreateView,
    ProgrammeDetailView,
    MilestoneListCreateView,
    MilestoneDetailView,
    RatioCalculatorView,
    NUCStandardsView,
    ProgrammeRatioView,
    SubmitProgrammeView,
    ForwardToNUCView,
    NUCDecisionView,
    ProgrammeReportView,
)

urlpatterns = [
    path('', ProgrammeListCreateView.as_view(), name='programme-list'),
    path('<int:pk>/', ProgrammeDetailView.as_view(), name='programme-detail'),
    path('<int:pk>/report/', ProgrammeReportView.as_view(), name='programme-report'),
    path('<int:pk>/milestones/', MilestoneListCreateView.as_view(), name='milestone-list'),
    path('milestones/<int:pk>/', MilestoneDetailView.as_view(), name='milestone-detail'),
    path('calculator/', RatioCalculatorView.as_view(), name='ratio-calculator'),
    path('standards/', NUCStandardsView.as_view(), name='nuc-standards'),
    path('<int:pk>/ratio/', ProgrammeRatioView.as_view(), name='programme-ratio'),
    path('<int:pk>/submit/', SubmitProgrammeView.as_view(), name='submit-programme'),
    path('<int:pk>/forward/', ForwardToNUCView.as_view(), name='forward-to-nuc'),
    path('<int:pk>/decision/', NUCDecisionView.as_view(), name='nuc-decision'),
]