from django.contrib import admin
from .models import SystemAudit


@admin.register(SystemAudit)
class SystemAuditAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'method', 'path', 'ip_address')
    list_filter = ('action', 'method', 'timestamp')
    search_fields = ('user__email', 'path', 'ip_address', 'user_agent')
