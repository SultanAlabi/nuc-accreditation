from django.test import TestCase
from accounts.models import User
from programmes.models import Programme, Milestone
from documents.models import Document
from notifications.models import Notification
from django.core.management import call_command
from datetime import date, timedelta


class NotificationSignalTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='u1', email='u1@example.com', password='pw', first_name='A', last_name='B', role='HOD')
        self.programme = Programme.objects.create(name='P1', department='D', faculty='F', status='PENDING', created_by=self.user)

    def test_programme_status_change_creates_notification(self):
        Notification.objects.all().delete()
        # change status
        self.programme.status = Programme.Status.IN_REVIEW
        self.programme.save()
        self.assertTrue(Notification.objects.filter(user=self.user, type=Notification.Type.STATUS_CHANGE).exists())
        # create another HOD in same department and ensure they get notified
        hod2 = User.objects.create_user(username='hod2', email='hod2@example.com', password='pw', first_name='C', last_name='D', role='HOD', department=self.programme.department)
        # change status again
        self.programme.status = Programme.Status.ACCREDITED
        self.programme.save()
        self.assertTrue(Notification.objects.filter(user=hod2, type=Notification.Type.STATUS_CHANGE).exists())

    def test_document_verified_creates_notification(self):
        # create a document attached to programme
        doc = Document.objects.create(programme=self.programme, title='Doc1', file='dummy', uploaded_by=self.user)
        Notification.objects.all().delete()
        # simulate verification flip
        doc.status = Document.Status.VERIFIED
        doc.save()
        self.assertTrue(Notification.objects.filter(user=self.user, type=Notification.Type.DOCUMENT_VERIFIED).exists())

    def test_send_milestone_reminders_command(self):
        Notification.objects.all().delete()
        # create a milestone due in 2 days
        due = date.today() + timedelta(days=2)
        Milestone.objects.create(programme=self.programme, title='M1', due_date=due)
        call_command('send_milestone_reminders', '--days', '3')
        self.assertTrue(Notification.objects.filter(user=self.user, type=Notification.Type.MILESTONE_DUE).exists())
