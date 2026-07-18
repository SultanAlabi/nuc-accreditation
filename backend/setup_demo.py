import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.management import call_command
from accounts.models import User

# Flush database
print("Flushing database...")
call_command('flush', interactive=False)

print("Creating demo users...")

# Super Admin
User.objects.create_superuser(
    username='superadmin',
    email='admin@demo.com',
    password='password123',
    first_name='Super',
    last_name='Admin',
    role='APU'
)

# HOD
User.objects.create_user(
    username='hod_demo',
    email='hod@demo.com',
    password='password123',
    first_name='Demo',
    last_name='HOD',
    role='HOD',
    department='Computer Science',
    university='Demo University'
)

# APU Officer
User.objects.create_user(
    username='apu_demo',
    email='apu@demo.com',
    password='password123',
    first_name='Demo',
    last_name='APU Officer',
    role='APU',
    university='Demo University'
)

# NUC Official
User.objects.create_user(
    username='nuc_demo',
    email='nuc@demo.com',
    password='password123',
    first_name='Demo',
    last_name='NUC Official',
    role='NUC_VISITOR',
    university='NUC Headquarters'
)

print("Demo users created successfully.")
