from django.db import models
from accounts.models import User

class Notification(models.Model):
    class Type(models.TextChoices):
        MILESTONE_DUE = 'MILESTONE_DUE', 'Milestone Due'
        STATUS_CHANGE = 'STATUS_CHANGE', 'Status Change'
        DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED', 'Document Verified'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    milestone = models.ForeignKey('programmes.Milestone', on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(max_length=30, choices=Type.choices)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.type}"