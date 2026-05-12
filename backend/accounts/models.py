from django.contrib.auth.models import AbstractUser
from django.db import models
class User(AbstractUser):
    class Role(models.TextChoices):
        HOD = 'HOD', 'Head of Department'
        APU = 'APU', 'APU Officer'
        NUC_VISITOR = 'NUC_VISITOR', 'NUC Visitor'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']

    def __str__(self):
        return f"{self.email} ({self.role})"

