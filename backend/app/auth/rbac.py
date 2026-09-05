from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from typing import Optional, List
import jwt
import os
from datetime import datetime, timezone, timedelta

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "peoplepay360-super-secret-jwt-key-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = 24

# Canonical Role Normalization Map
ROLE_NORMALIZATION_MAP = {
    "ADMIN": "ADMIN",
    "SUPER_ADMIN": "ADMIN",
    "HR": "HR",
    "HR_MANAGER": "HR",
    "PAYROLL": "PAYROLL",
    "PAYROLL_OFFICER": "PAYROLL",
    "PAYROLL_USER": "PAYROLL",
    "PAYROLL_MANAGER": "PAYROLL",
    "EMPLOYEE": "EMPLOYEE",
}

security_bearer = HTTPBearer(auto_error=False)


def normalize_role_name(raw_name: Optional[str]) -> str:
    """Normalizes any legacy or canonical role string into one of the 4 locked roles: ADMIN, HR, PAYROLL, EMPLOYEE."""
    if not raw_name:
        return "EMPLOYEE"
    clean = raw_name.strip().upper()
    return ROLE_NORMALIZATION_MAP.get(clean, clean)


def create_access_token(user_id: int, username: str, email: str, role_name: str) -> str:
    """Generates a signed JWT access token for a user."""
    norm_role = normalize_role_name(role_name)
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "username": username,
        "email": email,
        "role": norm_role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and verifies a JWT access token."""
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolves the authenticated user from:
    1. Bearer JWT Token
    2. Header persona context (X-User-Role, X-User-Id, X-User-Email)
    3. Default Admin fallback for local dev / unauthenticated requests
    """
    user: Optional[User] = None

    # 1. Try JWT Bearer Token
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload and "sub" in payload:
            try:
                user = db.query(User).filter(User.id == int(payload["sub"])).first()
            except (ValueError, TypeError):
                pass

    # 2. Try Header Persona (for interactive role switching / testing)
    if not user and x_user_id and x_user_id.isdigit():
        user = db.query(User).filter(User.id == int(x_user_id)).first()

    if not user and x_user_email:
        user = db.query(User).filter(User.email.ilike(x_user_email.strip())).first()

    if not user and x_user_role:
        norm_requested = normalize_role_name(x_user_role)
        # Find user with matching role or legacy alias
        for u in db.query(User).all():
            r = db.query(Role).filter(Role.id == u.role_id).first() if u.role_id else None
            if r and normalize_role_name(r.name) == norm_requested:
                user = u
                break

    # 3. Fallback to first user in database (Admin)
    if not user:
        user = db.query(User).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. No active user found.",
        )

    # Attach computed normalized role
    role_obj = db.query(Role).filter(Role.id == user.role_id).first() if user.role_id else None
    user.normalized_role = normalize_role_name(role_obj.name if role_obj else "ADMIN")
    return user


def require_role(*allowed_roles: str):
    """
    FastAPI dependency factory enforcing RBAC on endpoints.
    Allows ADMIN by default or any of the specified canonical roles (e.g. "HR", "PAYROLL", "EMPLOYEE").
    """
    normalized_allowed = {normalize_role_name(r) for r in allowed_roles}
    normalized_allowed.add("ADMIN")  # ADMIN always has super-privilege access

    def role_checker(current_user: User = Depends(get_current_user)):
        user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user_role}' is not authorized. Required: {list(normalized_allowed)}",
            )
        return current_user

    return role_checker
