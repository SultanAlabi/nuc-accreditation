from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Programme
from notifications.models import Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


@receiver(pre_save, sender=Programme)
def _cache_old_status(sender, instance, **kwargs):
    # store old status on the instance for comparison in post_save
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            instance._old_status = old.status
        except sender.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Programme)
def programme_status_change_notification(sender, instance, created, **kwargs):
    # Notify when status changed (not on create)
    if created:
        return

    old = getattr(instance, '_old_status', None)
    new = instance.status
    if old is None:
        return

    if old != new:
        # targets: programme.created_by plus HODs in the same department
        targets = []
        created_by = getattr(instance, 'created_by', None)
        if created_by:
            targets.append(created_by)
        # find other HODs in same department
        from accounts.models import User as AccountUser
        hods = AccountUser.objects.filter(role=AccountUser.Role.HOD, department=instance.department)
        for h in hods:
            if h not in targets:
                targets.append(h)

        for target in targets:
            notif = Notification.objects.create(
                user=target,
                type=Notification.Type.STATUS_CHANGE,
                message=f'Programme "{instance.name}" status changed to {new}.',
            )
            # push to user's websocket group (best-effort)
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'user-{target.id}',
                    {
                        'type': 'notification_message',
                        'data': {
                            'id': notif.id,
                            'type': notif.type,
                            'message': notif.message,
                            'created_at': notif.created_at.isoformat(),
                        }
                    }
                )
            except Exception:
                pass
