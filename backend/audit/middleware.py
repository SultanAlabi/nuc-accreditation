import logging

from django.utils.deprecation import MiddlewareMixin

from .models import SystemAudit


class AuditMiddleware(MiddlewareMixin):
    """Record request metadata after the view has run.

    Query strings can contain tokens or other sensitive values, so the audit
    stores only safe query parameter names, counts, and redacted key names.
    Audit failures are logged and never allowed to break the response.
    """

    SKIP_PATH_PREFIXES = ('/static/', '/media/', '/__debug__/', '/favicon.ico')
    SENSITIVE_QUERY_KEY_TERMS = (
        'password',
        'passwd',
        'pwd',
        'secret',
        'token',
        'jwt',
        'authorization',
        'auth',
        'api_key',
        'apikey',
        'credential',
        'session',
        'signature',
        'sig',
        'client_secret',
    )

    logger = logging.getLogger(__name__)

    def process_request(self, request):
        return None

    def process_response(self, request, response):
        path = getattr(request, 'path', '') or ''
        if any(path.startswith(prefix) for prefix in self.SKIP_PATH_PREFIXES):
            return response

        try:
            SystemAudit.objects.create(
                user=self._authenticated_user(request),
                path=self._truncate(path, 1000),
                method=getattr(request, 'method', '') or '',
                action=self._action_for_request(request),
                ip_address=self._truncate(request.META.get('REMOTE_ADDR', ''), 200),
                user_agent=self._truncate(request.META.get('HTTP_USER_AGENT', ''), 1000),
                extra_data=self._extra_data(request, response),
            )
        except Exception:
            self.logger.exception('Failed to record system audit')

        return response

    def _authenticated_user(self, request):
        try:
            user = getattr(request, 'user', None)
        except Exception:
            self.logger.warning('Unable to read request user for audit', exc_info=True)
            return None

        if user and getattr(user, 'is_authenticated', False):
            return user
        return None

    def _extra_data(self, request, response):
        status_code = getattr(response, 'status_code', None)
        if (getattr(request, 'method', '') or '').upper() == 'GET':
            return self._get_query_metadata(request, status_code)
        return {
            'content_type': self._truncate(request.META.get('CONTENT_TYPE', ''), 255),
            'status_code': status_code,
        }

    def _get_query_metadata(self, request, status_code):
        query = getattr(request, 'GET', None)
        query_keys = []
        redacted_keys = []

        if query is not None:
            for key in query.keys():
                if self._is_sensitive_query_key(key):
                    redacted_keys.append(key)
                else:
                    query_keys.append(key)

        metadata = {
            'query_param_count': len(query) if query is not None else 0,
            'query_params': sorted(set(query_keys)),
            'status_code': status_code,
        }
        if redacted_keys:
            metadata['redacted_query_params'] = sorted(set(redacted_keys))
        return metadata

    def _is_sensitive_query_key(self, key):
        normalized_key = str(key).lower()
        return any(term in normalized_key for term in self.SENSITIVE_QUERY_KEY_TERMS)

    def _action_for_request(self, request):
        if (getattr(request, 'method', '') or '').upper() != 'GET':
            return SystemAudit.Action.OTHER

        query = getattr(request, 'GET', None)
        if query and query.get('format', '').lower() == 'pdf':
            return SystemAudit.Action.DOWNLOAD
        return SystemAudit.Action.VIEW

    def _truncate(self, value, max_length):
        value = str(value or '')
        if len(value) <= max_length:
            return value
        return value[:max_length]
