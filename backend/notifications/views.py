from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsAnyRole
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAnyRole]

    def get_queryset(self):
        qs = Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

        # Support filtering by read status and notification type
        read = self.request.query_params.get('read')
        if read is not None:
            qs = qs.filter(is_read=(read.lower() == 'true'))

        notification_type = self.request.query_params.get('notification_type')
        if notification_type:
            qs = qs.filter(type=notification_type)

        return qs


class MarkReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAnyRole]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(is_read=True)


class MarkAllReadView(APIView):
    """Mark all notifications as read for the authenticated user."""
    permission_classes = [IsAnyRole]

    def post(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response(
            {"message": f"{count} notifications marked as read."},
            status=status.HTTP_200_OK
        )


class NotificationDeleteView(generics.DestroyAPIView):
    """Dismiss/delete a single notification."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAnyRole]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)