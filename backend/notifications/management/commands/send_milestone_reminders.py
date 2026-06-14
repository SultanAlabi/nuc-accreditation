from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from programmes.models import Milestone
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Create notifications for milestones due within N days (default 3)'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=3, help='Days ahead to check')

    def handle(self, *args, **options):
        days = options['days']
        today = timezone.now().date()
        target = today + timedelta(days=days)
        qs = Milestone.objects.filter(status=Milestone.Status.PENDING, due_date__lte=target, due_date__gte=today)
        created = 0
        for m in qs.select_related('programme__created_by'):
            user = getattr(m.programme, 'created_by', None)
            if not user:
                continue
            Notification.objects.create(
                user=user,
                type=Notification.Type.MILESTONE_DUE,
                message=f'Milestone "{m.title}" for programme "{m.programme.name}" is due on {m.due_date}.',
            )
            created += 1
        self.stdout.write(self.style.SUCCESS(f'Created {created} milestone notifications'))
