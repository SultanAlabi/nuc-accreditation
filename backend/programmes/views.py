from rest_framework import generics, permissions
from accounts.permissions import IsHOD, IsAPU, IsHODOrAPU, IsAnyRole
from .models import Programme, Milestone
from .serializers import ProgrammeSerializer, MilestoneSerializer

class ProgrammeListCreateView(generics.ListCreateAPIView):
    serializer_class = ProgrammeSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHOD()]
        return [IsAnyRole()]

    def get_queryset(self):
        return Programme.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProgrammeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Programme.objects.all()
    serializer_class = ProgrammeSerializer

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsHOD()]
        if self.request.method in ['PUT', 'PATCH']:
            return [IsHODOrAPU()]
        return [IsAnyRole()]

class MilestoneListCreateView(generics.ListCreateAPIView):
    serializer_class = MilestoneSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHODOrAPU()]
        return [IsAnyRole()]

    def get_queryset(self):
        return Milestone.objects.filter(programme_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(programme_id=self.kwargs['pk'])

class MilestoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsHOD()]
        if self.request.method in ['PUT', 'PATCH']:
            return [IsHODOrAPU()]
        return [IsAnyRole()]