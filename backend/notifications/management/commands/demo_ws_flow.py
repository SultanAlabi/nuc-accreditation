import asyncio
import json
import sys

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Demo script: open WS with JWT, trigger a Programme status change, and print WS messages. Run with the dev server running.'

    def add_arguments(self, parser):
        parser.add_argument('--host', default='127.0.0.1', help='Host where runserver is running')
        parser.add_argument('--port', default='8000', help='Port where runserver is running')

    def handle(self, *args, **options):
        try:
            import websockets
        except Exception:
            self.stdout.write(self.style.ERROR('Missing dependency: install websockets (pip install websockets)'))
            return

        # Lazy import Django models to ensure settings are configured
        from accounts.models import User
        from programmes.models import Programme
        from rest_framework_simplejwt.tokens import RefreshToken

        host = options['host']
        port = options['port']

        # Create/get test user
        user, created = User.objects.get_or_create(
            email='ws_demo_user@example.com',
            defaults={
                'username': 'wsdemouser',
                'first_name': 'WS',
                'last_name': 'Demo',
                'role': 'HOD',
            }
        )
        if created:
            user.set_password('Password123!')
            user.save()

        # Create/get programme
        prog, _ = Programme.objects.get_or_create(
            name='WS Demo Programme',
            defaults={
                'department': 'DemoDept',
                'faculty': 'DemoFaculty',
                'status': Programme.Status.PENDING,
                'created_by': user,
                'student_count': 0,
                'staff_count': 0,
            }
        )

        # Create JWT token
        refresh = RefreshToken.for_user(user)
        token = str(refresh.access_token)

        uri = f"ws://{host}:{port}/ws/notifications/?token={token}"

        async def run_flow():
            self.stdout.write(self.style.SUCCESS(f'Connecting to {uri}'))
            try:
                async with websockets.connect(uri) as ws:
                    self.stdout.write(self.style.SUCCESS('WebSocket connected. Waiting 0.5s...'))
                    await asyncio.sleep(0.5)

                    # trigger status change
                    self.stdout.write('Triggering programme status change...')
                    prog.status = Programme.Status.IN_REVIEW
                    prog.save()

                    # wait for a message
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=5)
                        try:
                            payload = json.loads(msg)
                        except Exception:
                            payload = msg
                        self.stdout.write(self.style.SUCCESS(f'Received WS message:\n{json.dumps(payload, indent=2)}'))
                    except asyncio.TimeoutError:
                        self.stdout.write(self.style.WARNING('No WS message received within timeout'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'WebSocket connection failed: {e}'))

        asyncio.run(run_flow())
