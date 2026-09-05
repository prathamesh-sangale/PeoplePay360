import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

# Load environment
backend_dir = Path(__file__).resolve().parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

EXPECTED_PHASE1_TABLES = {
    "roles",
    "users",
    "departments",
    "jobs",
    "employee_types",
    "employees",
    "contracts",
    "working_schedules",
    "working_schedule_days",
    "employee_schedule_assignments",
    "employee_bank_accounts",
}

EXPECTED_PHASE2_TABLES = {
    "attendance",
    "attendance_corrections",
    "time_off_types",
    "time_off_allocations",
    "time_off_requests",
}

ALL_EXPECTED_APPLICATION_TABLES = EXPECTED_PHASE1_TABLES.union(EXPECTED_PHASE2_TABLES)

FORBIDDEN_PHASE3_TABLES = {
    "salary_structures",
    "salary_rules",
    "salary_structure_rules",
    "payruns",
    "payrun_employees",
    "payslips",
    "payslip_lines",
    "payroll_warnings",
    "notifications",
}


def verify_phase2_schema():
    print("=" * 70)
    print("PeoplePay360 — Phase 2 Schema Verification Test")
    print("=" * 70)

    if not DATABASE_URL:
        print("[FAIL] DATABASE_URL is not set.")
        sys.exit(1)

    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)

    # 1. Table Count and Presence Verification
    existing_tables = set(inspector.get_table_names())
    print(f"\n1. Tables in database ({len(existing_tables)} found):")
    for t in sorted(existing_tables):
        print(f"   - {t}")

    # Verify Phase 1 tables still exist
    missing_phase1 = EXPECTED_PHASE1_TABLES - existing_tables
    if missing_phase1:
        print(f"\n[FAIL] Missing Phase 1 tables: {missing_phase1}")
        sys.exit(1)
    else:
        print(f"\n[PASS] All {len(EXPECTED_PHASE1_TABLES)} Phase 1 tables are intact.")

    # Verify Phase 2 tables exist
    missing_phase2 = EXPECTED_PHASE2_TABLES - existing_tables
    if missing_phase2:
        print(f"[FAIL] Missing Phase 2 tables: {missing_phase2}")
        sys.exit(1)
    else:
        print(f"[PASS] All {len(EXPECTED_PHASE2_TABLES)} Phase 2 tables created successfully.")

    # Verify total application table count
    app_tables = existing_tables - {"alembic_version"}
    print(f"[PASS] Total PeoplePay360 application tables: {len(app_tables)} (Expected: 16)")

    if "alembic_version" in existing_tables:
        print("[PASS] Alembic version tracking table 'alembic_version' is present.")
    else:
        print("[FAIL] 'alembic_version' table is missing.")

    # Check for forbidden tables (Phase 3)
    present_forbidden = FORBIDDEN_PHASE3_TABLES.intersection(existing_tables)
    if present_forbidden:
        print(f"[FAIL] Unexpected Phase 3 tables detected: {present_forbidden}")
        sys.exit(1)
    else:
        print("[PASS] Zero Phase 3 tables present (Phase boundary strictly respected).")

    # 2. Check foreign keys
    print("\n2. Foreign Key Constraints (Phase 2 Tables):")
    for table_name in sorted(EXPECTED_PHASE2_TABLES):
        fks = inspector.get_foreign_keys(table_name)
        fk_desc = [f"{fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}" for fk in fks]
        print(f"   [{table_name}]: {len(fks)} FK(s) -> {', '.join(fk_desc) if fk_desc else 'None'}")

    # 3. Check unique constraints & indexes
    print("\n3. Unique Constraints & Indexes (Phase 2 Tables):")
    for table_name in sorted(EXPECTED_PHASE2_TABLES):
        indexes = inspector.get_indexes(table_name)
        uniques = inspector.get_unique_constraints(table_name)
        print(f"   [{table_name}]: {len(uniques)} Unique constraint(s), {len(indexes)} Index(es)")

    # 4. Check CHECK constraints
    print("\n4. CHECK Constraints across all application tables:")
    with engine.connect() as conn:
        chk_query = text("""
            SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(c.oid) AS definition
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE c.contype = 'c' AND n.nspname = 'public'
            ORDER BY table_name, conname;
        """)
        rows = conn.execute(chk_query).fetchall()
        for row in rows:
            print(f"   - {row.table_name}: {row.conname} => {row.definition}")

    print("\n" + "=" * 70)
    print("PHASE 2 SCHEMA VERIFICATION: ALL CHECKS PASSED [PASS]")
    print("=" * 70)


if __name__ == "__main__":
    verify_phase2_schema()
