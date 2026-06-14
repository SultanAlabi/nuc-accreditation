import logging
import re
from urllib.parse import quote

from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsHOD, IsAPU, IsNUCVisitor, IsHODOrAPU, IsAnyRole
from notifications.models import Notification

from .models import Programme, Milestone, ProgrammeReportAudit
from .pdf_generator import generate_pdf_report
from .report_service import generate_readiness_report
from .serializers import ProgrammeSerializer, MilestoneSerializer
from .services import check_ratio, NUC_STANDARDS

logger = logging.getLogger(__name__)

class ProgrammeListCreateView(generics.ListCreateAPIView):
    serializer_class = ProgrammeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'faculty', 'department']

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


class RatioCalculatorView(APIView):
    """Calculate staff-to-student ratio manually"""
    permission_classes = [IsAnyRole]

    def post(self, request):
        student_count = request.data.get('student_count')
        staff_count = request.data.get('staff_count')
        faculty_type = request.data.get('faculty_type', 'SCIENCE')

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

        result = check_ratio(student_count, staff_count, faculty_type)
        return Response(result, status=status.HTTP_200_OK)


class NUCStandardsView(APIView):
    """Return all NUC minimum standards"""
    permission_classes = [IsAnyRole]

    def get(self, request):
        standards = [
            {
                'faculty_type': key,
                'label': value['label'],
                'max_ratio': value['ratio'],
                'description': f"Maximum 1 staff to {value['ratio']} students"
            }
            for key, value in NUC_STANDARDS.items()
        ]
        return Response(standards, status=status.HTTP_200_OK)


class ProgrammeRatioView(APIView):
    """Calculate ratio for an existing programme"""
    permission_classes = [IsAnyRole]

    def get(self, request, pk):
        # (debug logging moved to ProgrammeReportView.get)
        try:
            programme = Programme.objects.get(pk=pk)
        except Programme.DoesNotExist:
            return Response(
                {"error": "Programme not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        faculty_type = request.query_params.get('faculty_type', 'SCIENCE')
        result = check_ratio(
            programme.student_count,
            programme.staff_count,
            faculty_type
        )
        result['programme'] = programme.name
        result['department'] = programme.department
        return Response(result, status=status.HTTP_200_OK)


class SubmitProgrammeView(APIView):
    """HOD submits programme to APU for review"""
    permission_classes = [IsHOD]

    def post(self, request, pk):
        try:
            programme = Programme.objects.get(pk=pk, created_by=request.user)
        except Programme.DoesNotExist:
            return Response(
                {"error": "Programme not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if programme.status != 'PENDING':
            return Response(
                {"error": "Only PENDING programmes can be submitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        programme.status = 'IN_REVIEW'
        programme.save()

        # Notify all APU officers
        apu_officers = User.objects.filter(role='APU')
        for officer in apu_officers:
            Notification.objects.create(
                user=officer,
                type='STATUS_CHANGE',
                message=f"Programme '{programme.name}' submitted for review by {request.user.first_name} {request.user.last_name}."
            )

        return Response({
            "message": "Programme submitted for APU review.",
            "status": "IN_REVIEW"
        })


class ForwardToNUCView(APIView):
    """APU Officer forwards programme to NUC"""
    permission_classes = [IsAPU]

    def post(self, request, pk):
        try:
            programme = Programme.objects.get(pk=pk)
        except Programme.DoesNotExist:
            return Response(
                {"error": "Programme not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if programme.status != 'IN_REVIEW':
            return Response(
                {"error": "Only IN_REVIEW programmes can be forwarded to NUC."},
                status=status.HTTP_400_BAD_REQUEST
            )

        programme.status = 'FORWARDED_TO_NUC'
        programme.save()

        # Notify NUC Visitors
        nuc_visitors = User.objects.filter(role='NUC_VISITOR')
        for visitor in nuc_visitors:
            Notification.objects.create(
                user=visitor,
                type='STATUS_CHANGE',
                message=f"Programme '{programme.name}' has been forwarded for NUC accreditation review."
            )

        # Notify HOD
        if programme.created_by:
            Notification.objects.create(
                user=programme.created_by,
                type='STATUS_CHANGE',
                message=f"Your programme '{programme.name}' has been forwarded to NUC for review."
            )

        return Response({
            "message": "Programme forwarded to NUC.",
            "status": "FORWARDED_TO_NUC"
        })

class NUCDecisionView(APIView):
    """NUC Visitor makes final accreditation decision"""
    permission_classes = [IsNUCVisitor]

    def post(self, request, pk):
        try:
            programme = Programme.objects.get(pk=pk)
        except Programme.DoesNotExist:
            return Response(
                {"error": "Programme not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if programme.status != 'FORWARDED_TO_NUC':
            return Response(
                {"error": "Only FORWARDED_TO_NUC programmes can receive a decision."},
                status=status.HTTP_400_BAD_REQUEST
            )

        decision = request.data.get('decision')
        comments = request.data.get('comments', '')

        if decision not in ['ACCREDITED', 'DENIED']:
            return Response(
                {"error": "Decision must be ACCREDITED or DENIED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        programme.status = decision
        programme.save()

        # Notify HOD
        if programme.created_by:
            Notification.objects.create(
                user=programme.created_by,
                type='STATUS_CHANGE',
                message=f"Your programme '{programme.name}' has been {decision} by NUC. {comments}"
            )

        # Notify APU officers
        apu_officers = User.objects.filter(role='APU')
        for officer in apu_officers:
            Notification.objects.create(
                user=officer,
                type='STATUS_CHANGE',
                message=f"Programme '{programme.name}' has been {decision} by NUC."
            )

        return Response({
            "message": f"Programme {decision}.",
            "status": decision,
            "comments": comments
        })
 
class ProgrammeReportView(APIView):
    """Generate accreditation readiness report for a programme"""
    permission_classes = [IsAnyRole]
    # Prevent DRF from interpreting the `format` query param (e.g. ?format=pdf)
    # as a renderer selection which raises Http404 when no renderer exists.
    format_kwarg = None

    def perform_content_negotiation(self, request, force=False):
        # Bypass DRF renderer/content negotiation only for PDF responses.
        # JSON responses still need DRF to set accepted_renderer.
        if request.query_params.get('format', '').lower() == 'pdf':
            return (None, None)
        return super().perform_content_negotiation(request, force)

    def get(self, request, pk):
        programme = self._get_programme_or_404(pk)
        if programme is None:
            return programme

        report_data = generate_readiness_report(programme)
        fmt = request.query_params.get('format', 'json').lower()

        if fmt == 'pdf':
            return self._pdf_response(programme, report_data)

        self._create_report_audit(programme, ProgrammeReportAudit.Action.VIEW, request)
        return Response(report_data, status=status.HTTP_200_OK)

    def _get_programme_or_404(self, pk):
        try:
            return Programme.objects.get(pk=pk)
        except Programme.DoesNotExist:
            return Response(
                {"error": "Programme not found."},
                status=status.HTTP_404_NOT_FOUND
            )

    def _pdf_response(self, programme, report_data):
        buffer = generate_pdf_report(report_data)
        self._create_report_audit(programme, ProgrammeReportAudit.Action.DOWNLOAD, self.request)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = self._report_filename(programme)
        response['Content-Disposition'] = self._content_disposition(filename)
        return response

    def _create_report_audit(self, programme, action, request=None):
        try:
            ProgrammeReportAudit.objects.create(
                programme=programme,
                user=self._authenticated_user(request),
                action=action,
                ip_address=getattr(request, 'META', {}).get('REMOTE_ADDR', '') if request is not None else '',
                user_agent=getattr(request, 'META', {}).get('HTTP_USER_AGENT', '') if request is not None else '',
            )
        except Exception:
            logger.exception('Failed to create programme report audit')

    def _authenticated_user(self, request):
        if request is None:
            return None
        user = getattr(request, 'user', None)
        if user and getattr(user, 'is_authenticated', False):
            return user
        return None

    def _report_filename(self, programme):
        safe_name = re.sub(r'[^A-Za-z0-9._-]+', '_', programme.name.strip())
        if safe_name.lower().endswith('.pdf'):
            safe_name = safe_name[:-4]
        safe_name = re.sub(r'_+', '_', safe_name).strip('._-') or 'accreditation_report'
        return f"accreditation_report_{safe_name}.pdf"

    def _content_disposition(self, filename):
        quoted_filename = quote(filename)
        return f'attachment; filename="{filename}"; filename*=UTF-8\'\'{quoted_filename}'

