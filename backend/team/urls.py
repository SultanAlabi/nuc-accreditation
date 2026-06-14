from django.urls import path
from .views import TeamMemberListCreateView, TeamMemberDetailView, TeamInviteCreateView

urlpatterns = [
    path('members/', TeamMemberListCreateView.as_view(), name='team-member-list'),
    path('members/<int:pk>/', TeamMemberDetailView.as_view(), name='team-member-detail'),
    path('invites/', TeamInviteCreateView.as_view(), name='team-invite'),
]
