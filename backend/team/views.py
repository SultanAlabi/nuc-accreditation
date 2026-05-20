from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsAnyRole, IsHODOrAPU
from .models import TeamMember, TeamInvite
from .serializers import TeamMemberSerializer, TeamInviteSerializer


class TeamMemberListCreateView(generics.ListCreateAPIView):
    serializer_class = TeamMemberSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHODOrAPU()]
        return [IsAnyRole()]

    def get_queryset(self):
        return TeamMember.objects.select_related('user').all()

    def perform_create(self, serializer):
        serializer.save()


class TeamMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TeamMember.objects.select_related('user').all()
    serializer_class = TeamMemberSerializer

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsHODOrAPU()]
        if self.request.method in ['PUT', 'PATCH']:
            return [IsHODOrAPU()]
        return [IsAnyRole()]


class TeamInviteCreateView(generics.CreateAPIView):
    serializer_class = TeamInviteSerializer
    permission_classes = [IsHODOrAPU]

    def perform_create(self, serializer):
        serializer.save(invited_by=self.request.user)
