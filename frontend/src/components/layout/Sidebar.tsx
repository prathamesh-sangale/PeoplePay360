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
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
      isActive(path)
        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
    }`;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full select-none">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md shadow-primary/20">
            ₹
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight leading-none">PeoplePay360</h1>
            <span className="text-[10px] text-muted-foreground font-medium">Indian HR & Payroll</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
            Main
          </span>
          <div className="space-y-0.5">
            <Link to="/dashboard" className={linkClass('/dashboard')}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
            Workforce
          </span>
          <div className="space-y-0.5">
            <Link to="/employees" className={linkClass('/employees')}>
              <Users size={16} /> Employees
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
              <Layers size={16} /> Schedules
            </Link>
          </div>
        </div>

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

        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
            Compliance & System
          </span>
          <div className="space-y-0.5">
            <Link to="/reports" className={linkClass('/reports')}>
              <BarChart3 size={16} /> Reports & ECR
            </Link>
            <Link to="/notifications" className={linkClass('/notifications')}>
              <Bell size={16} /> Notifications
            </Link>
            <Link to="/admin/users" className={linkClass('/admin/users')}>
              <UserCheck size={16} /> Users
            </Link>
            <Link to="/admin/roles" className={linkClass('/admin/roles')}>
              <ShieldCheck size={16} /> Roles
            </Link>
            <Link to="/admin/audit-logs" className={linkClass('/admin/audit-logs')}>
              <History size={16} /> Audit Logs
            </Link>
            <Link to="/admin/settings" className={linkClass('/admin/settings')}>
              <Settings size={16} /> Settings
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
