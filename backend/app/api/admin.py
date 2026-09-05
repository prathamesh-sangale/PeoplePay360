from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.role import Role

router = APIRouter()

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    results = []
    for u in users:
        role = db.query(Role).filter(Role.id == u.role_id).first() if u.role_id else None
        results.append({
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": role.name if role else "User",
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })
    return results

@router.get("/roles")
def list_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "description": r.description,
        }
        for r in roles
    ]
