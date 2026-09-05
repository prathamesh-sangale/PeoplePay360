from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.working_schedule import WorkingSchedule
from app.models.working_schedule_day import WorkingScheduleDay

router = APIRouter()

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

@router.get("")
def list_schedules(db: Session = Depends(get_db)):
    schedules = db.query(WorkingSchedule).all()
    results = []
    for s in schedules:
        days = db.query(WorkingScheduleDay).filter(WorkingScheduleDay.working_schedule_id == s.id).order_by(WorkingScheduleDay.day_of_week).all()
        day_list = [
            {
                "id": str(d.id),
                "day_name": DAY_NAMES[d.day_of_week] if 0 <= d.day_of_week < 7 else f"Day {d.day_of_week}",
                "day_of_week": d.day_of_week,
                "start_time": d.start_time.strftime("%H:%M") if d.start_time else None,
                "end_time": d.end_time.strftime("%H:%M") if d.end_time else None,
                "is_working_day": d.is_working_day,
            }
            for d in days
        ]
        results.append({
            "id": str(s.id),
            "name": s.name,
            "code": s.code,
            "hours_per_week": float(s.weekly_hours) if s.weekly_hours else 40.0,
            "weekly_hours": float(s.weekly_hours) if s.weekly_hours else 40.0,
            "days": day_list,
        })
    return results
