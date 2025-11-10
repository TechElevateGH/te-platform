"""
Permission utilities for role-based access control.
"""

from fastapi import HTTPException, status


def get_user_role(user) -> int:
    """
    Safely get user role as integer.
    Handles both enum and int types.
    """
    if hasattr(user.role, "value"):
        return user.role.value
    return int(user.role)


def is_guest(user) -> bool:
    """Check if user is a guest (role = 0)"""
    return get_user_role(user) == 0


def is_member(user) -> bool:
    """Check if user is a member (role = 1)"""
    return get_user_role(user) == 1


def is_lead(user) -> bool:
    """Check if user is a lead (role = 2)"""
    return get_user_role(user) == 2


def is_admin(user) -> bool:
    """Check if user is an admin (role = 3)"""
    return get_user_role(user) == 3


def is_lead_or_admin(user) -> bool:
    """Check if user has elevated privileges (Lead or Admin)"""
    return get_user_role(user) >= 2


def require_member(user):
    """Require at least Member level access"""
    if get_user_role(user) < 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Member access required"
        )


def require_lead(user):
    """Require at least Lead level access"""
    if get_user_role(user) < 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Lead access required"
        )


def require_admin(user):
    """Require Admin level access"""
    if get_user_role(user) < 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )


def get_role_name(role_value: int) -> str:
    """Get human-readable role name"""
    role_names = {0: "Guest", 1: "Member", 2: "Lead", 3: "Admin"}
    return role_names.get(role_value, "Unknown")
