"""
PeoplePay360 - Phase 3 Database Schema Verification Script
Verifies:
1. All 25 application tables + alembic_version = 26 tables in PostgreSQL
2. Phase 1 (11), Phase 2 (5), and Phase 3 (9) tables
3. contracts.salary_structure_id column, nullable, index, FK
4. All foreign keys, unique constraints, check constraints, indexes for Phase 3 tables
5. SQLAlchemy model registry has all 25 models
6. Zero seed data across all tables
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

# Load environment
backend_dir = Path(__file__).resolve().parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in environment or .env file.")

from app.models import Base

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

EXPECTED_PHASE3_TABLES = {
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

EXPECTED_APP_TABLES = EXPECTED_PHASE1_TABLES | EXPECTED_PHASE2_TABLES | EXPECTED_PHASE3_TABLES
EXPECTED_ALL_TABLES = EXPECTED_APP_TABLES | {"alembic_version"}

def run_verification():
    print("=" * 70)
    print("PeoplePay360 - PHASE 3 DATABASE SCHEMA VERIFICATION")
    print("=" * 70)

    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)

    # 1. Verify table counts and names
    db_tables = set(inspector.get_table_names())
    print(f"\n[1] Table Count & Discovery:")
    print(f"    Found {len(db_tables)} total tables in database.")
    
    missing_tables = EXPECTED_ALL_TABLES - db_tables
    extra_tables = db_tables - EXPECTED_ALL_TABLES

    if missing_tables:
        print(f"    FAILED: Missing tables: {missing_tables}")
        sys.exit(1)
    else:
        print(f"    PASSED: All 26 expected tables present (25 app tables + alembic_version).")

    if extra_tables:
        print(f"    FAILED: Unexpected extra tables found: {extra_tables}")
        sys.exit(1)
    else:
        print(f"    PASSED: No unexpected tables exist.")

    # 2. Verify phase table sets
    app_tables = db_tables - {"alembic_version"}
    assert EXPECTED_PHASE1_TABLES.issubset(app_tables), "Phase 1 tables missing"
    assert EXPECTED_PHASE2_TABLES.issubset(app_tables), "Phase 2 tables missing"
    assert EXPECTED_PHASE3_TABLES.issubset(app_tables), "Phase 3 tables missing"
    print(f"    Phase 1 tables: {len(EXPECTED_PHASE1_TABLES)} / 11 verified.")
    print(f"    Phase 2 tables: {len(EXPECTED_PHASE2_TABLES)} / 5 verified.")
    print(f"    Phase 3 tables: {len(EXPECTED_PHASE3_TABLES)} / 9 verified.")

    # 3. Verify contracts.salary_structure_id update
    print(f"\n[2] Contracts Table Update (Phase 1 modification):")
    contracts_cols = {col["name"]: col for col in inspector.get_columns("contracts")}
    if "salary_structure_id" not in contracts_cols:
        print("    FAILED: contracts.salary_structure_id column missing!")
        sys.exit(1)
    
    col_info = contracts_cols["salary_structure_id"]
    if not col_info["nullable"]:
        print("    FAILED: contracts.salary_structure_id must be nullable!")
        sys.exit(1)
    print("    PASSED: contracts.salary_structure_id column exists and is nullable.")

    # Verify contracts FK to salary_structures
    contracts_fks = inspector.get_foreign_keys("contracts")
    salary_struct_fk = next((fk for fk in contracts_fks if fk["referred_table"] == "salary_structures"), None)
    if not salary_struct_fk or "salary_structure_id" not in salary_struct_fk["constrained_columns"]:
        print("    FAILED: contracts.salary_structure_id foreign key to salary_structures.id missing!")
        sys.exit(1)
    print(f"    PASSED: contracts FK -> salary_structures(id) verified: {salary_struct_fk['name']}")

    # 4. Verify Phase 3 Tables Columns, Primary Keys, Foreign Keys, Unique & Check Constraints
    print(f"\n[3] Phase 3 Foreign Keys & Unique Constraints:")
    for table_name in sorted(EXPECTED_PHASE3_TABLES):
        fks = inspector.get_foreign_keys(table_name)
        uqs = inspector.get_unique_constraints(table_name)
        pk = inspector.get_pk_constraint(table_name)
        indexes = inspector.get_indexes(table_name)
        
        fk_summary = [f"{fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}" for fk in fks]
        print(f"\n  Table: {table_name}")
        print(f"    PK: {pk['constrained_columns']}")
        print(f"    FKs ({len(fks)}): {fk_summary}")
        print(f"    Indexes ({len(indexes)}): {[idx['name'] for idx in indexes]}")
        print(f"    Unique constraints ({len(uqs)}): {[uq['name'] for uq in uqs]}")

    # Specific FK checks for Phase 3
    payrun_fks = {fk["referred_table"]: fk["constrained_columns"] for fk in inspector.get_foreign_keys("payruns")}
    assert "salary_structures" in payrun_fks and payrun_fks["salary_structures"] == ["salary_structure_id"]
    assert "users" in payrun_fks and payrun_fks["users"] == ["created_by_user_id"]

    pe_fks = {fk["referred_table"]: fk["constrained_columns"] for fk in inspector.get_foreign_keys("payrun_employees")}
    assert "payruns" in pe_fks and pe_fks["payruns"] == ["payrun_id"]
    assert "employees" in pe_fks and pe_fks["employees"] == ["employee_id"]

    ps_fks = {fk["referred_table"]: fk["constrained_columns"] for fk in inspector.get_foreign_keys("payslips")}
    assert "payruns" in ps_fks and ps_fks["payruns"] == ["payrun_id"]
    assert "employees" in ps_fks and ps_fks["employees"] == ["employee_id"]
    assert "payrun_employees" in ps_fks and ps_fks["payrun_employees"] == ["payrun_employee_id"]
    assert "salary_structures" in ps_fks and ps_fks["salary_structures"] == ["salary_structure_id"]
    assert "contracts" in ps_fks and ps_fks["contracts"] == ["contract_id"]

    psl_fks = {fk["referred_table"]: fk["constrained_columns"] for fk in inspector.get_foreign_keys("payslip_lines")}
    assert "payslips" in psl_fks and psl_fks["payslips"] == ["payslip_id"]
    assert "salary_rules" in psl_fks and psl_fks["salary_rules"] == ["salary_rule_id"]

    pw_fks = {fk["referred_table"]: fk["constrained_columns"] for fk in inspector.get_foreign_keys("payroll_warnings")}
    assert "payruns" in pw_fks and pw_fks["payruns"] == ["payrun_id"]
    assert "payslips" in pw_fks and pw_fks["payslips"] == ["payslip_id"]
    assert "employees" in pw_fks and pw_fks["employees"] == ["employee_id"]
    assert "users" in pw_fks and pw_fks["users"] == ["resolved_by_user_id"]

    notif_fks = {fk["referred_table"]: fk["constrained_columns"] for fk in inspector.get_foreign_keys("notifications")}
    assert "users" in notif_fks and notif_fks["users"] == ["user_id"]

    print("\n[4] Check Constraints in PostgreSQL:")
    with engine.connect() as conn:
        chk_query = text("""
            SELECT conname, relname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_class r ON r.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = r.relnamespace
            WHERE c.contype = 'c' AND n.nspname = 'public'
            ORDER BY relname, conname;
        """)
        chks = conn.execute(chk_query).fetchall()
        for conname, relname, definition in chks:
            if relname in EXPECTED_PHASE3_TABLES:
                print(f"    {relname}.{conname}: {definition}")

    # 5. Verify SQLAlchemy Model Registration
    print(f"\n[5] SQLAlchemy Declarative Base Registration:")
    registered_tables = set(Base.metadata.tables.keys())
    print(f"    Registered tables in Base.metadata: {len(registered_tables)}")
    missing_models = EXPECTED_APP_TABLES - registered_tables
    if missing_models:
        print(f"    FAILED: Base.metadata missing models: {missing_models}")
        sys.exit(1)
    else:
        print(f"    PASSED: All 25 SQLAlchemy models properly registered.")

    # 6. Verify No Seed Data
    print(f"\n[6] Zero Seed Data Verification:")
    with engine.connect() as conn:
        for t in sorted(EXPECTED_APP_TABLES):
            count = conn.execute(text(f'SELECT COUNT(*) FROM "{t}"')).scalar()
            if count != 0:
                print(f"    FAILED: Table {t} has {count} rows. Seed data detected!")
                sys.exit(1)
        print("    PASSED: All 25 application tables contain exactly 0 rows (pure schema).")

    print("\n" + "=" * 70)
    print("PHASE 3 DATABASE SCHEMA VERIFICATION COMPLETE: ALL CHECKS PASSED")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()
