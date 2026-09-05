from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from typing import Optional
from datetime import datetime, timezone

router = APIRouter()

def create_system_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
) -> Notification:
    """Helper to safely insert a system event notification."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_type=reference_type,
        reference_id=reference_id,
        is_read=False,
        read_at=None,
    )
    db.add(notif)
    db.flush()
    return notif

@router.get("")
def list_notifications(
    user_id: Optional[int] = None,
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Notification)
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()
    results = [
        {
            "id": str(n.id),
            "user_id": n.user_id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "reference_type": n.reference_type,
            "reference_id": n.reference_id,
            "is_read": n.is_read,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]
    
    # Calculate unread count
    count_query = db.query(Notification).filter(Notification.is_read == False)
    if user_id:
        count_query = count_query.filter(Notification.user_id == user_id)
    unread_count = count_query.count()

    return {"unread_count": unread_count, "items": results}

@router.patch("/{id}/read")
@router.post("/{id}/read")
def mark_notification_read(id: str, db: Session = Depends(get_db)):
    notif_id = int(id) if id.isdigit() else None
    if not notif_id:
        raise HTTPException(status_code=400, detail="Invalid notification ID format")

    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    n.is_read = True
    n.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(n)
    return {"status": "success", "id": str(n.id), "is_read": True}

@router.post("/read-all")
def mark_all_notifications_read(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Notification).filter(Notification.is_read == False)
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    
    now = datetime.now(timezone.utc)
    updated_count = query.update({Notification.is_read: True, Notification.read_at: now}, synchronize_session=False)
    db.commit()
    return {"status": "success", "updated_count": updated_count}

@router.delete("/{id}")
def delete_notification(id: str, db: Session = Depends(get_db)):
    notif_id = int(id) if id.isdigit() else None
    if not notif_id:
        raise HTTPException(status_code=400, detail="Invalid notification ID format")

    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(n)
    db.commit()
    return {"status": "success", "deleted_id": str(notif_id)}
