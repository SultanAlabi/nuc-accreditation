import logging
from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)

class IsHOD(BasePermission):
    """Only Head of Department"""
    def has_permission(self, request, view):
        is_auth = request.user.is_authenticated
        role = getattr(request.user, 'role', None) if is_auth else None
        passed = is_auth and role == 'HOD'
        if not passed:
            logger.warning(
                "IsHOD permission denied: user=%s, authenticated=%s, role=%s, path=%s, method=%s",
                getattr(request.user, 'email', getattr(request.user, 'username', 'anonymous')),
                is_auth,
                role,
                request.path,
                request.method,
            )
        return passed

class IsAPU(BasePermission):
    """Only APU Officer"""
    def has_permission(self, request, view):
        is_auth = request.user.is_authenticated
        role = getattr(request.user, 'role', None) if is_auth else None
        passed = is_auth and role == 'APU'
        if not passed:
            logger.warning(
                "IsAPU permission denied: user=%s, authenticated=%s, role=%s, path=%s, method=%s",
                getattr(request.user, 'email', getattr(request.user, 'username', 'anonymous')),
                is_auth,
                role,
                request.path,
                request.method,
            )
        return passed

class IsNUCVisitor(BasePermission):
    """Only NUC Visitor"""
    def has_permission(self, request, view):
        is_auth = request.user.is_authenticated
        role = getattr(request.user, 'role', None) if is_auth else None
        passed = is_auth and role == 'NUC_VISITOR'
        if not passed:
            logger.warning(
                "IsNUCVisitor permission denied: user=%s, authenticated=%s, role=%s, path=%s, method=%s",
                getattr(request.user, 'email', getattr(request.user, 'username', 'anonymous')),
                is_auth,
                role,
                request.path,
                request.method,
            )
        return passed

class IsHODOrAPU(BasePermission):
    """HOD or APU Officer"""
    def has_permission(self, request, view):
        is_auth = request.user.is_authenticated
        role = getattr(request.user, 'role', None) if is_auth else None
        passed = is_auth and role in ['HOD', 'APU']
        if not passed:
            logger.warning(
                "IsHODOrAPU permission denied: user=%s, authenticated=%s, role=%s, path=%s, method=%s",
                getattr(request.user, 'email', getattr(request.user, 'username', 'anonymous')),
                is_auth,
                role,
                request.path,
                request.method,
            )
        return passed

class IsAnyRole(BasePermission):
    """Any authenticated user regardless of role"""
    def has_permission(self, request, view):
        is_auth = request.user.is_authenticated
        if not is_auth:
            logger.warning(
                "IsAnyRole permission denied: user=%s, path=%s, method=%s",
                getattr(request.user, 'email', getattr(request.user, 'username', 'anonymous')),
                request.path,
                request.method,
            )
        return is_auth