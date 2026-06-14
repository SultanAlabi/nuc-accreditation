from django.contrib import admin
from .models import Programme, Milestone, ProgrammeReportAudit

admin.site.register(Programme)
admin.site.register(Milestone)
admin.site.register(ProgrammeReportAudit)