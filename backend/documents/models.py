from django.db import models
from accounts.models import User
from programmes.models import Programme

class Document(models.Model):
    class Category(models.TextChoices):
        CURRICULUM = 'CURRICULUM', 'Curriculum'
        STAFF_LIST = 'STAFF_LIST', 'Staff List'
        FACILITY = 'FACILITY', 'Facility Report'
        FINANCIAL = 'FINANCIAL', 'Financial Report'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    programme = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=Category.choices)
    file = models.FileField(upload_to='documents/')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.title} - {self.programme.name}"