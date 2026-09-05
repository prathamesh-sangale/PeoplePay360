import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  LayoutDashboard,
  Clock,
  Layers,
  ShieldCheck,
  Bell,
  BarChart3,
  Settings,
  History,
  UserCheck,
  Building,
  Landmark,
  Tags,
  BadgePercent,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';

export default function Sidebar() {
  const location = useLocation();
  const { currentRole, currentPersona } = useRole();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
      isActive(path)
        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
    }`;

  const isHR = currentRole === 'HR';
  const isAdmin = currentRole === 'ADMIN';
  const isPayroll = currentRole === 'PAYROLL';
  const isEmployee = currentRole === 'EMPLOYEE';

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md shadow-primary/20">
            ₹
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight leading-none">PeoplePay360</h1>
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              {isHR ? 'HR Portal' : isPayroll ? 'Payroll Dept' : isAdmin ? 'Admin Console' : 'Employee Portal'}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {/* Main Dashboard */}
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
            Navigation
          </span>
          <div className="space-y-0.5">
            <Link to="/dashboard" className={linkClass('/dashboard')}>
              <LayoutDashboard size={16} />
              {isHR ? 'HR Dashboard' : isPayroll ? 'Payroll Dashboard' : isAdmin ? 'Executive Dashboard' : 'My Dashboard'}
            </Link>
          </div>
        </div>

        {/* HR & Workforce Management (Visible to HR & Admin) */}
        {(isHR || isAdmin) && (
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
              Human Resources
            </span>
            <div className="space-y-0.5">
              <Link to="/employees" className={linkClass('/employees')}>
                <Users size={16} /> Employees
              </Link>
              <Link to="/departments" className={linkClass('/departments')}>
                <Building size={16} /> Departments
              </Link>
              <Link to="/jobs" className={linkClass('/jobs')}>
                <BadgePercent size={16} /> Jobs & Roles
              </Link>
              <Link to="/employee-types" className={linkClass('/employee-types')}>
                <Tags size={16} /> Employee Types
              </Link>
              <Link to="/contracts" className={linkClass('/contracts')}>
                <Briefcase size={16} /> Contracts
              </Link>
              <Link to="/attendance" className={linkClass('/attendance')}>
                <Clock size={16} /> Attendance
              </Link>
              <Link to="/time-off" className={linkClass('/time-off')}>
                <Calendar size={16} /> Time Off & Leaves
              </Link>
              <Link to="/schedules" className={linkClass('/schedules')}>
                <Layers size={16} /> Working Schedules
              </Link>
              <Link to="/bank-details" className={linkClass('/bank-details')}>
                <Landmark size={16} /> Bank Details
              </Link>
            </div>
          </div>
        )}

        {/* Dedicated Payroll Operations (Visible to Payroll & Admin ONLY, HIDDEN from HR) */}
        {(isPayroll || isAdmin) && (
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
              Indian Payroll
            </span>
            <div className="space-y-0.5">
              <Link to="/payroll/payruns" className={linkClass('/payroll/payruns')}>
                <DollarSign size={16} /> Monthly Payruns
              </Link>
              <Link to="/payroll/payslips" className={linkClass('/payroll/payslips')}>
                <FileText size={16} /> Salary Payslips
              </Link>
              <Link to="/payroll/salary-structures" className={linkClass('/payroll/salary-structures')}>
                <Layers size={16} /> Salary Structures
              </Link>
              <Link to="/payroll/salary-rules" className={linkClass('/payroll/salary-rules')}>
                <ShieldCheck size={16} /> Statutory Rules
              </Link>
            </div>
          </div>
        )}

        {/* Employee Self-Service (Visible to Employee Persona) */}
        {isEmployee && (
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
              Self Service
            </span>
            <div className="space-y-0.5">
              <Link to={`/employees/${currentPersona.employee_id || 1}`} className={linkClass(`/employees/${currentPersona.employee_id || 1}`)}>
                <UserCheck size={16} /> My Profile
              </Link>
              <Link to="/attendance" className={linkClass('/attendance')}>
                <Clock size={16} /> My Attendance
              </Link>
              <Link to="/time-off" className={linkClass('/time-off')}>
                <Calendar size={16} /> My Leaves
              </Link>
              <Link to="/payroll/payslips" className={linkClass('/payroll/payslips')}>
                <FileText size={16} /> My Payslips
              </Link>
            </div>
          </div>
        )}

        {/* Compliance & System Administration */}
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
            System & Alerts
          </span>
          <div className="space-y-0.5">
            {(isPayroll || isAdmin) && (
              <Link to="/reports" className={linkClass('/reports')}>
                <BarChart3 size={16} /> Reports & ECR
              </Link>
            )}
            <Link to="/notifications" className={linkClass('/notifications')}>
              <Bell size={16} /> Notifications
            </Link>
            {/* System Administration strictly for ADMIN */}
            {isAdmin && (
              <>
                <Link to="/admin/users" className={linkClass('/admin/users')}>
                  <UserCheck size={16} /> Users
                </Link>
                <Link to="/admin/roles" className={linkClass('/admin/roles')}>
                  <ShieldCheck size={16} /> Roles Matrix
                </Link>
                <Link to="/admin/audit-logs" className={linkClass('/admin/audit-logs')}>
                  <History size={16} /> Audit Logs
                </Link>
                <Link to="/admin/settings" className={linkClass('/admin/settings')}>
                  <Settings size={16} /> Settings
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role Profile Footer */}
      <div className="p-3 border-t border-border bg-accent/10">
        <div className="p-2 rounded-xl bg-background border border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {currentPersona.avatar_initials}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-foreground truncate">{currentPersona.full_name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{currentPersona.role}</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
        </div>
      </div>
    </aside>
  );
}
