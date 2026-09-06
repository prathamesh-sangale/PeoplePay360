import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine, SessionLocal

def list_all_tables():
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("=" * 60)
    print("  PeoplePay360 PostgreSQL Database [peoplepay360]")
    print("=" * 60)
    db = SessionLocal()
    for idx, t in enumerate(sorted(tables), start=1):
        count = db.execute(text(f"SELECT count(*) FROM {t}")).scalar()
        print(f"  {idx:2d}. {t:<30} : {count:>5} rows")
    db.close()
    print("=" * 60)

def view_table(table_name: str, limit: int = 10):
    db = SessionLocal()
    try:
        result = db.execute(text(f"SELECT * FROM {table_name} LIMIT {limit}"))
        columns = result.keys()
        rows = result.fetchall()
        print(f"\n--- Top {len(rows)} records from '{table_name}' ---")
        print(" | ".join(columns))
        print("-" * 80)
        for r in rows:
            print(" | ".join(str(val) for val in r))
        print(f"Total shown: {len(rows)} rows\n")
    except Exception as e:
        print(f"Error querying table '{table_name}': {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        view_table(sys.argv[1])
    else:
        list_all_tables()
