from django.db import models
from django.conf import settings
from django.utils import timezone


class SystemAudit(models.Model):
    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        VIEW = 'VIEW', 'View'
        DOWNLOAD = 'DOWNLOAD', 'Download'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        OTHER = 'OTHER', 'Other'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    path = models.CharField(max_length=1000)
    method = models.CharField(max_length=10)
    action = models.CharField(max_length=20, choices=Action.choices, default=Action.OTHER)
    ip_address = models.CharField(max_length=200, blank=True)
    user_agent = models.CharField(max_length=1000, blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    extra_data = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        u = self.user.email if self.user else 'anonymous'
        return f"{self.timestamp.isoformat()} {u} {self.action} {self.path}"
