from django.db import models
from accounts.models import User

class Programme(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_REVIEW = 'IN_REVIEW', 'In Review'
        FORWARDED_TO_NUC = 'FORWARDED_TO_NUC', 'Forwarded to NUC'
        ACCREDITED = 'ACCREDITED', 'Accredited'
        DENIED = 'DENIED', 'Denied'

    name = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    faculty = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    student_count = models.IntegerField(default=0)
    staff_count = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class Milestone(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        OVERDUE = 'OVERDUE', 'Overdue'

    programme = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.programme.name} - {self.title}"