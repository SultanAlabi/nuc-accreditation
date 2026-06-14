from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Document
from notifications.models import Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


@receiver(pre_save, sender=Document)
def _cache_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            instance._old_status = getattr(old, 'status', None)
        except sender.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Document)
def document_verified_notification(sender, instance, created, **kwargs):
    # If status changed from PENDING->VERIFIED, notify owner / uploader
    old = getattr(instance, '_old_status', None)
    new = getattr(instance, 'status', None)
    if old is None:
        return
    if old != new and new == Document.Status.VERIFIED:
        targets = []
        uploader = getattr(instance, 'uploaded_by', None)
        if uploader:
            targets.append(uploader)
        # programme owner
        prog_owner = getattr(getattr(instance, 'programme', None), 'created_by', None)
        if prog_owner and prog_owner not in targets:
            targets.append(prog_owner)

        from accounts.models import User as AccountUser
        hods = AccountUser.objects.filter(role=AccountUser.Role.HOD, department=getattr(instance.programme, 'department', None))
        for h in hods:
            if h not in targets:
                targets.append(h)

        for target in targets:
            notif = Notification.objects.create(
                user=target,
                type=Notification.Type.DOCUMENT_VERIFIED,
                message=f'Document "{getattr(instance, "title", "file")}" was verified.',
            )
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
