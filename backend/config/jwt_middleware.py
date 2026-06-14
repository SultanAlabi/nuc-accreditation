from urllib.parse import parse_qs
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async


@database_sync_to_async
def get_user(user_id):
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


class JwtAuthMiddleware:
    """Middleware that populates scope['user'] from a JWT passed as ?token=..."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Parse token from query string
        query_string = scope.get('query_string', b'').decode()
        qs = parse_qs(query_string)
        token = None
        if 'token' in qs:
            token = qs['token'][0]

        # Fallback: check headers for Authorization
        if not token and 'headers' in scope:
            for name, value in scope['headers']:
                if name == b'authorization':
                    try:
                        auth = value.decode()
                        if auth.startswith('Bearer '):
                            token = auth.split(' ', 1)[1]
                    except Exception:
                        pass

        if token:
            try:
                # Import TokenBackend lazily to avoid importing modules that access
                # Django models during ASGI import time (pre-apps-ready).
                from rest_framework_simplejwt.backends import TokenBackend

                algo = 'HS256'
                try:
                    algo = settings.SIMPLE_JWT.get('ALGORITHM', algo)
                except Exception:
                    pass
                backend = TokenBackend(algorithm=algo, signing_key=settings.SECRET_KEY)
                data = backend.decode(token, verify=True)
                user_id = data.get('user_id')
                user = await get_user(user_id)
                if user:
                    scope['user'] = user
                else:
                    # Import lazily to avoid touching Django models at import time
                    from django.contrib.auth.models import AnonymousUser as _AnonymousUser
                    scope['user'] = _AnonymousUser()
            except Exception:
                from django.contrib.auth.models import AnonymousUser as _AnonymousUser
                scope['user'] = _AnonymousUser()
        # If no token, leave for other auth middleware to populate (session auth)
        return await self.inner(scope, receive, send)


def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)
