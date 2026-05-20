from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.permissions import IsAnyRole
from programmes.models import Programme
from documents.models import Document
from notifications.models import Notification


class DashboardSummaryView(APIView):
    """Return aggregate dashboard KPIs for the authenticated user."""
    permission_classes = [IsAnyRole]

    def get(self, request):
        user = request.user

        # Programme stats
        programmes = Programme.objects.all()
        total_programmes = programmes.count()
        accredited = programmes.filter(status='ACCREDITED').count()
        in_review = programmes.filter(status='IN_REVIEW').count()
        pending = programmes.filter(status='PENDING').count()

        # Document stats
        total_documents = Document.objects.count()
        verified_documents = Document.objects.filter(status='VERIFIED').count()
        pending_documents = Document.objects.filter(status='PENDING').count()

        # Notification stats
        unread_notifications = Notification.objects.filter(
            user=user, is_read=False
        ).count()

        # Compute an overall readiness percentage (simple heuristic)
        readiness = 0
        if total_programmes > 0:
            readiness = int((accredited / total_programmes) * 100)

        return Response({
            'total_programmes': total_programmes,
            'accredited': accredited,
            'in_review': in_review,
            'pending': pending,
            'total_documents': total_documents,
            'verified_documents': verified_documents,
            'pending_documents': pending_documents,
            'unread_notifications': unread_notifications,
            'readiness': readiness,
        }, status=status.HTTP_200_OK)
