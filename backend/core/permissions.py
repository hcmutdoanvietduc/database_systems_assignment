from rest_framework import permissions

class IsManager(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là Manager hoặc Superuser
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return hasattr(request.user, 'profile') and request.user.profile.role == 'Manager'

class IsStaff(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là Staff hoặc Manager
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return hasattr(request.user, 'profile') and request.user.profile.role in ['Staff', 'Manager']
