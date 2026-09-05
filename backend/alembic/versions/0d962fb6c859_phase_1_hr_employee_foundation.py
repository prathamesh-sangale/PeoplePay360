"""phase 1 hr employee foundation

Revision ID: 0d962fb6c859
Revises: 
Create Date: 2026-09-05 15:20:38.560619

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d962fb6c859'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. roles
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 2. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )

    # 3. departments (created initially without manager_id FK to avoid circular dependency)
    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('manager_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.UniqueConstraint('name')
    )

    # 4. jobs
    op.create_table(
        'jobs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.UniqueConstraint('name')
    )

    # 5. employee_types
    op.create_table(
        'employee_types',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.UniqueConstraint('name')
    )

    # 6. employees
    op.create_table(
        'employees',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('employee_code', sa.String(length=50), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('date_of_joining', sa.Date(), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('employee_type_id', sa.Integer(), nullable=False),
        sa.Column('manager_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['employee_type_id'], ['employee_types.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['manager_id'], ['employees.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('employee_code'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_employees_department_id'), 'employees', ['department_id'], unique=False)
    op.create_index(op.f('ix_employees_employee_type_id'), 'employees', ['employee_type_id'], unique=False)
    op.create_index(op.f('ix_employees_job_id'), 'employees', ['job_id'], unique=False)
    op.create_index(op.f('ix_employees_manager_id'), 'employees', ['manager_id'], unique=False)

    # Circular FK: departments.manager_id -> employees.id
    op.create_foreign_key(
        'fk_departments_manager_id',
        'departments',
        'employees',
        ['manager_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # 7. working_schedules
    op.create_table(
        'working_schedules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('schedule_type', sa.String(length=30), nullable=False),
        sa.Column('weekly_hours', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('weekly_hours >= 0', name='chk_working_schedules_weekly_hours_non_negative'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.UniqueConstraint('name')
    )

    # 8. working_schedule_days
    op.create_table(
        'working_schedule_days',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('working_schedule_id', sa.Integer(), nullable=False),
        sa.Column('day_of_week', sa.SmallInteger(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=True),
        sa.Column('end_time', sa.Time(), nullable=True),
        sa.Column('break_minutes', sa.Integer(), nullable=False),
        sa.Column('is_working_day', sa.Boolean(), nullable=False),
        sa.CheckConstraint('break_minutes >= 0', name='chk_working_schedule_days_break_non_negative'),
        sa.CheckConstraint('day_of_week BETWEEN 0 AND 6', name='chk_working_schedule_days_day_range'),
        sa.ForeignKeyConstraint(['working_schedule_id'], ['working_schedules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('working_schedule_id', 'day_of_week', name='uq_working_schedule_day')
    )

    # 9. contracts
    op.create_table(
        'contracts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('working_schedule_id', sa.Integer(), nullable=True),
        sa.Column('contract_number', sa.String(length=100), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('wage', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('employment_terms', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('end_date IS NULL OR end_date >= start_date', name='chk_contracts_end_date_after_start'),
        sa.CheckConstraint('wage >= 0', name='chk_contracts_wage_non_negative'),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['working_schedule_id'], ['working_schedules.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('contract_number')
    )
    op.create_index(op.f('ix_contracts_employee_id'), 'contracts', ['employee_id'], unique=False)
    op.create_index(op.f('ix_contracts_end_date'), 'contracts', ['end_date'], unique=False)
    op.create_index(op.f('ix_contracts_start_date'), 'contracts', ['start_date'], unique=False)
    op.create_index(op.f('ix_contracts_status'), 'contracts', ['status'], unique=False)

    # 10. employee_schedule_assignments
    op.create_table(
        'employee_schedule_assignments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('working_schedule_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('end_date IS NULL OR end_date >= start_date', name='chk_schedule_assign_end_date_after_start'),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['working_schedule_id'], ['working_schedules.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_employee_schedule_assignments_employee_id'), 'employee_schedule_assignments', ['employee_id'], unique=False)
    op.create_index(op.f('ix_employee_schedule_assignments_start_date'), 'employee_schedule_assignments', ['start_date'], unique=False)

    # 11. employee_bank_accounts
    op.create_table(
        'employee_bank_accounts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('account_holder_name', sa.String(length=150), nullable=False),
        sa.Column('account_number', sa.String(length=50), nullable=False),
        sa.Column('bank_name', sa.String(length=150), nullable=False),
        sa.Column('ifsc_code', sa.String(length=20), nullable=False),
        sa.Column('branch_name', sa.String(length=150), nullable=True),
        sa.Column('account_type', sa.String(length=30), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_employee_bank_accounts_employee_id'), 'employee_bank_accounts', ['employee_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_employee_bank_accounts_employee_id'), table_name='employee_bank_accounts')
    op.drop_table('employee_bank_accounts')

    op.drop_index(op.f('ix_employee_schedule_assignments_start_date'), table_name='employee_schedule_assignments')
    op.drop_index(op.f('ix_employee_schedule_assignments_employee_id'), table_name='employee_schedule_assignments')
    op.drop_table('employee_schedule_assignments')

    op.drop_index(op.f('ix_contracts_status'), table_name='contracts')
    op.drop_index(op.f('ix_contracts_start_date'), table_name='contracts')
    op.drop_index(op.f('ix_contracts_end_date'), table_name='contracts')
    op.drop_index(op.f('ix_contracts_employee_id'), table_name='contracts')
    op.drop_table('contracts')

    op.drop_table('working_schedule_days')
    op.drop_table('working_schedules')

    # Drop circular FK before dropping employees / departments
    op.drop_constraint('fk_departments_manager_id', 'departments', type_='foreignkey')

    op.drop_index(op.f('ix_employees_manager_id'), table_name='employees')
    op.drop_index(op.f('ix_employees_job_id'), table_name='employees')
    op.drop_index(op.f('ix_employees_employee_type_id'), table_name='employees')
    op.drop_index(op.f('ix_employees_department_id'), table_name='employees')
    op.drop_table('employees')

    op.drop_table('employee_types')
    op.drop_table('jobs')
    op.drop_table('departments')
    op.drop_table('users')
    op.drop_table('roles')
