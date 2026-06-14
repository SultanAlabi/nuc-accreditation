from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    name = 'documents'

    def ready(self):
        try:
            import documents.signals  # noqa: F401
        except Exception:
            pass
