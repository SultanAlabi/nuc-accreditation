import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# ensure Python can find the backend package
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from accounts.models import User

email = os.environ.get('TEST_HOD_EMAIL', 'testhod@example.com')
password = os.environ.get('TEST_HOD_PASSWORD', 'change-me-placeholder')

user, created = User.objects.get_or_create(email=email, defaults={
    'username': 'testhod',
    'first_name': 'Test',
    'last_name': 'Hod',
    'role': 'HOD',
})
if created:
    user.set_password(password)
    user.save()
    print('Created HOD user:', email, 'password:', password)
else:
    print('User already exists:', email)

print('User role:', user.role)
