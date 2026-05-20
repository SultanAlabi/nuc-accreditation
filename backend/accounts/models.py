from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        HOD = 'HOD', 'Head of Department'
        APU = 'APU', 'APU Officer'
        NUC_VISITOR = 'NUC_VISITOR', 'NUC Visitor'

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=Role.choices)
    phone = models.CharField(max_length=20, blank=True)
    staff_id = models.CharField(max_length=50, blank=True)
    university = models.CharField(max_length=200, blank=True)
    department = models.CharField(max_length=100, blank=True)
    faculty = models.CharField(max_length=100, blank=True)
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'role']

    def __str__(self):
        return f"{self.email} ({self.role})"