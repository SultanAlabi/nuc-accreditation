from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from audit.models import SystemAudit
from programmes.models import Programme, ProgrammeReportAudit


class ProgrammeReportEndpointTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='rtest',
            email='rtest@example.com',
            password='Password123!',
            first_name='R',
            last_name='Test',
            role='HOD',
        )
        self.programme = Programme.objects.create(
            name='Test Programme',
            department='Dept',
            faculty='Science',
            status='PENDING',
            student_count=10,
            staff_count=2,
            created_by=self.user,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_report_json_endpoint_returns_json_and_records_view_audit(self):
        url = f'/api/programmes/{self.programme.pk}/report/'

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn('programme', response.data)
        self.assertEqual(ProgrammeReportAudit.objects.get(programme=self.programme).action, ProgrammeReportAudit.Action.VIEW)

        audit = SystemAudit.objects.get(path=url)
        self.assertEqual(audit.user, self.user)
        self.assertEqual(audit.method, 'GET')
        self.assertEqual(audit.action, SystemAudit.Action.VIEW)
        self.assertEqual(audit.extra_data['query_param_count'], 0)
        self.assertEqual(audit.extra_data['query_params'], [])

    def test_report_pdf_endpoint_format_param_records_download_audit(self):
        url = f'/api/programmes/{self.programme.pk}/report/?format=pdf'
        path = f'/api/programmes/{self.programme.pk}/report/'

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('filename="accreditation_report_Test_Programme.pdf"', response['Content-Disposition'])
        self.assertEqual(ProgrammeReportAudit.objects.get(programme=self.programme).action, ProgrammeReportAudit.Action.DOWNLOAD)

        audit = SystemAudit.objects.get(path=path)
        self.assertEqual(audit.user, self.user)
        self.assertEqual(audit.method, 'GET')
        self.assertEqual(audit.action, SystemAudit.Action.DOWNLOAD)
        self.assertEqual(audit.extra_data['query_param_count'], 1)
        self.assertEqual(audit.extra_data['query_params'], ['format'])

    def test_report_pdf_filename_is_sanitized(self):
        self.programme.name = 'Unsafe / Report?: Name.pdf'
        self.programme.save(update_fields=['name'])

        response = self.client.get(f'/api/programmes/{self.programme.pk}/report/?format=pdf')

        self.assertEqual(response.status_code, 200)
        self.assertIn(
            'filename="accreditation_report_Unsafe_Report_Name.pdf"',
            response['Content-Disposition'],
        )

    def test_duplicate_report_pdf_route_is_not_registered(self):
        response = self.client.get(f'/api/programmes/{self.programme.pk}/report-pdf/')

        self.assertEqual(response.status_code, 404)

    def test_report_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(f'/api/programmes/{self.programme.pk}/report/')

        self.assertEqual(response.status_code, 401)

    def test_audit_middleware_redacts_sensitive_query_parameters(self):
        SystemAudit.objects.all().delete()
        url = f'/api/programmes/{self.programme.pk}/report/?format=pdf&access_token=secret&debug=true'
        path = f'/api/programmes/{self.programme.pk}/report/'

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        audit = SystemAudit.objects.get(path=path)
        self.assertEqual(audit.extra_data['query_params'], ['debug', 'format'])
        self.assertEqual(audit.extra_data['redacted_query_params'], ['access_token'])
        self.assertNotIn('secret', str(audit.extra_data))
