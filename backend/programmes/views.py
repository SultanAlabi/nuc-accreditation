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
    
    
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import check_ratio, NUC_STANDARDS

class RatioCalculatorView(APIView):
    """
    Calculate staff-to-student ratio for a programme
    and check against NUC minimum standards.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        student_count = request.data.get('student_count')
        staff_count = request.data.get('staff_count')
        faculty = request.data.get('faculty', 'SCIENCE')

        # Validate inputs
        if student_count is None or staff_count is None:
            return Response(
                {"error": "student_count and staff_count are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            student_count = int(student_count)
            staff_count = int(staff_count)
        except ValueError:
            return Response(
                {"error": "student_count and staff_count must be integers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if student_count < 0 or staff_count < 0:
            return Response(
                {"error": "Values cannot be negative."},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = check_ratio(student_count, staff_count, faculty)
        return Response(result, status=status.HTTP_200_OK)

class NUCStandardsView(APIView):
    """
    Return all NUC minimum standards for reference.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        standards = [
            {
                'faculty': key,
                'label': value['label'],
                'max_ratio': value['ratio'],
                'description': f"Maximum 1 staff to {value['ratio']} students"
            }
            for key, value in NUC_STANDARDS.items()
        ]
        return Response(standards, status=status.HTTP_200_OK)

class ProgrammeRatioView(APIView):
    """
    Calculate ratio for an existing programme by ID.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            programme = Programme.objects.get(pk=pk)
        except Programme.DoesNotExist:
            return Response(
                {"error": "Programme not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        faculty = request.query_params.get('faculty', 'SCIENCE')
        result = check_ratio(
            programme.student_count,
            programme.staff_count,
            faculty
        )
        result['programme'] = programme.name
        result['department'] = programme.department
        return Response(result, status=status.HTTP_200_OK)