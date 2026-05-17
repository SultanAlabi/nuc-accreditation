from rest_framework.permissions import BasePermission

class IsHOD(BasePermission):
    """Only Head of Department"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'HOD'

class IsAPU(BasePermission):
    """Only APU Officer"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'APU'

class IsNUCVisitor(BasePermission):
    """Only NUC Visitor"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'NUC_VISITOR'

class IsHODOrAPU(BasePermission):
    """HOD or APU Officer"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['HOD', 'APU']

class IsAnyRole(BasePermission):
    """Any authenticated user regardless of role"""
    def has_permission(self, request, view):
        return request.user.is_authenticated