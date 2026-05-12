from rest_framework import generics, permissions
from .models import Programme, Milestone
from .serializers import ProgrammeSerializer, MilestoneSerializer

class ProgrammeListCreateView(generics.ListCreateAPIView):
    queryset = Programme.objects.all()
    serializer_class = ProgrammeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProgrammeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Programme.objects.all()
    serializer_class = ProgrammeSerializer
    permission_classes = [permissions.IsAuthenticated]

class MilestoneListCreateView(generics.ListCreateAPIView):
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Milestone.objects.filter(programme_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(programme_id=self.kwargs['pk'])

class MilestoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]