from django.db import models
from accounts.models import User


class TeamMember(models.Model):
    class Role(models.TextChoices):
        LEAD = 'LEAD', 'Team Lead'
        MEMBER = 'MEMBER', 'Member'
        REVIEWER = 'REVIEWER', 'Reviewer'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    department = models.CharField(max_length=100, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.email} ({self.role})"


class TeamInvite(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        DECLINED = 'DECLINED', 'Declined'

    email = models.EmailField()
    role = models.CharField(max_length=20, choices=TeamMember.Role.choices, default=TeamMember.Role.MEMBER)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invites')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Invite to {self.email} ({self.status})"
