from django.apps import AppConfig


class ProgrammesConfig(AppConfig):
    name = 'programmes'

    def ready(self):
        # import signal handlers
        try:
            import programmes.signals  # noqa: F401
        except Exception:
            pass
