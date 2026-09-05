from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.notification import Notification

router = APIRouter()

@router.get("")
def list_notifications(db: Session = Depends(get_db)):
    notifications = db.query(Notification).order_by(desc(Notification.created_at)).limit(30).all()
    results = [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]
    unread_count = sum(1 for n in notifications if not n.is_read)
    return {"unread_count": unread_count, "items": results}

@router.patch("/{id}/read")
def mark_notification_read(id: str, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"status": "success"}
