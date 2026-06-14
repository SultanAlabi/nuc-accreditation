from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemAudit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('path', models.CharField(max_length=1000)),
                ('method', models.CharField(max_length=10)),
                ('action', models.CharField(choices=[('CREATE', 'Create'), ('UPDATE', 'Update'), ('DELETE', 'Delete'), ('VIEW', 'View'), ('DOWNLOAD', 'Download'), ('LOGIN', 'Login'), ('LOGOUT', 'Logout'), ('OTHER', 'Other')], default='OTHER', max_length=20)),
                ('ip_address', models.CharField(blank=True, max_length=200)),
                ('user_agent', models.CharField(blank=True, max_length=1000)),
                ('timestamp', models.DateTimeField(db_index=True)),
                ('extra_data', models.JSONField(blank=True, null=True)),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
    ]
