import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDashboardStats,
  getHRDashboardStats,
  getEmployeeDashboardStats,
  getPayrollDashboardStats,
  approveTimeOffRequest,
  rejectTimeOffRequest,
} from '../lib/api';
import { formatINR, formatINRPerAnnum, getStatusBadgeClass } from '../lib/formatters';
import { useRole } from '../context/RoleContext';
import {
  Users,
  IndianRupee,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Briefcase,
  Building,
  Plus,
  Check,
  X,
  FileText,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AttendanceToggle from '../components/AttendanceToggle';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const { currentRole, currentPersona } = useRole();
  const queryClient = useQueryClient();

  // Admin / General Stats
  const {
    data: adminData,
    isLoading: isAdminLoading,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  // Dedicated Live HR Stats
  const {
    data: hrData,
    isLoading: isHRLoading,
  } = useQuery({
    queryKey: ['dashboard-hr-stats'],
    queryFn: getHRDashboardStats,
    enabled: currentRole === 'HR' || currentRole === 'ADMIN',
  });

  // Dedicated Live Employee Stats
  const {
    data: employeeData,
  } = useQuery({
    queryKey: ['dashboard-employee-stats'],
    queryFn: getEmployeeDashboardStats,
    enabled: currentRole === 'EMPLOYEE',
  });

  // Dedicated Live Payroll Stats
  const {
    data: payrollData,
  } = useQuery({
    queryKey: ['dashboard-payroll-stats'],
    queryFn: getPayrollDashboardStats,
    enabled: currentRole === 'PAYROLL',
  });

  // Leave Quick Actions
  const approveLeaveMutation = useMutation({
    mutationFn: (id: number) => approveTimeOffRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectTimeOffRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const isHR = currentRole === 'HR';
  const isAdmin = currentRole === 'ADMIN';
  const isPayroll = currentRole === 'PAYROLL';

  if (isAdminLoading && isHRLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-medium">Loading PeoplePay360 Portal...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // HR PORTAL DASHBOARD VIEW
  // ==========================================
  if (isHR && hrData) {
    const { workforce, attendance, leaves, contracts, department_distribution, recent_pending_leaves, recent_new_hires, warnings: hrWarnings } = hrData;

    const deptChartData = department_distribution.map((d: any) => ({
      name: d.code,
      fullName: d.name,
      employees: d.employee_count,
    }));

    const leavePieData = [
      { name: 'Privilege Leave (PL)', value: leaves.pl_remaining || 15, color: '#3B82F6' },
      { name: 'Casual Leave (CL)', value: leaves.cl_remaining || 12, color: '#10B981' },
      { name: 'Sick Leave (SL)', value: leaves.sl_remaining || 12, color: '#F59E0B' },
    ];

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent p-6 rounded-3xl border border-blue-500/20">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Users size={13} />
                Human Resources Portal
              </span>
              <span className="text-xs text-muted-foreground">Logged in as {currentPersona.full_name} ({currentPersona.display_title})</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              HR Workforce Intelligence
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Real-time employee headcount, attendance punctuality, leave requests, and contract renewal monitoring.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/employees"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-all"
            >
              <Plus size={14} /> Add Employee
            </Link>
            <Link
              to="/contracts"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-card hover:bg-accent text-foreground border border-border font-semibold rounded-xl text-xs transition-all"
            >
              <Briefcase size={14} /> Contracts
            </Link>
            <Link
              to="/attendance"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-card hover:bg-accent text-foreground border border-border font-semibold rounded-xl text-xs transition-all"
            >
              <Clock size={14} /> Attendance
            </Link>
            <Link
              to="/time-off"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-card hover:bg-accent text-foreground border border-border font-semibold rounded-xl text-xs transition-all"
            >
              <Calendar size={14} /> Leaves
            </Link>
          </div>
        </div>

        {/* 1. Core HR Metrics KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Workforce */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Headcount</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-foreground">{workforce.total_employees}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{workforce.active_employees} active staff</span>
              <span>{workforce.departments_count} depts</span>
            </div>
          </div>

          {/* Attendance Today */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Present Today</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-emerald-500">{attendance.present_today}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{attendance.late_today} late arrivals</span>
              <span className="font-bold text-emerald-500">{attendance.attendance_rate}% rate</span>
            </div>
          </div>

          {/* Pending Leaves */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Leave Requests</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Calendar size={18} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-amber-500">{leaves.pending_requests}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{leaves.approved_requests} approved</span>
              <span>{leaves.on_leave_today} on leave today</span>
            </div>
          </div>

          {/* Contracts Monitoring */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Contracts</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-indigo-500">{contracts.active_contracts}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              {contracts.expiring_soon > 0 ? (
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <AlertTriangle size={12} /> {contracts.expiring_soon} expiring soon
                </span>
              ) : (
                <span className="text-emerald-500 font-medium">All contracts healthy</span>
              )}
              <span>{contracts.expired_contracts} expired</span>
            </div>
          </div>
        </div>

        {/* 2. Charts Section: Department Distribution & Leave Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Headcount Distribution */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Building size={18} className="text-primary" /> Headcount by Department
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Active workforce distribution across enterprise units</p>
              </div>
              <Link to="/departments" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '1rem', fontSize: '12px' }}
                    labelFormatter={(val) => deptChartData.find((d: any) => d.name === val)?.fullName || val}
                  />
                  <Bar dataKey="employees" name="Employees" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leave Quotas & Allocation Summary */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar size={18} className="text-emerald-500" /> Leave Balances Quota
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Unified statutory policy pools (FY 2026-27)</p>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leavePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {leavePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Privilege Leave (PL)
                </span>
                <span className="font-bold text-foreground font-mono">{leaves.pl_remaining} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Casual Leave (CL)
                </span>
                <span className="font-bold text-foreground font-mono">{leaves.cl_remaining} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Sick Leave (SL)
                </span>
                <span className="font-bold text-foreground font-mono">{leaves.sl_remaining} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Actionable Tables: Pending Leaves & Recent Joinings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Leave Requests for Quick Action */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Clock size={18} className="text-amber-500" /> Pending Leave Approvals
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Review and approve employee time off requests</p>
              </div>
              <Link to="/time-off" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                All Requests ({leaves.pending_requests}) <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-2.5">
              {recent_pending_leaves && recent_pending_leaves.length > 0 ? (
                recent_pending_leaves.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-background border border-border/80 flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{r.employee_name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                          {r.leave_code}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {r.start_date} → {r.end_date} ({r.days} {r.days === 1 ? 'day' : 'days'})
                      </div>
                      {r.reason && <div className="text-[10px] text-muted-foreground/80 italic mt-0.5 truncate max-w-xs">{r.reason}</div>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => approveLeaveMutation.mutate(Number(r.id))}
                        disabled={approveLeaveMutation.isPending}
                        title="Approve Request"
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => rejectLeaveMutation.mutate({ id: Number(r.id), reason: 'Manager review' })}
                        disabled={rejectLeaveMutation.isPending}
                        title="Refuse Request"
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground bg-background rounded-2xl border border-dashed border-border">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                  No pending leave requests. All employee leaves reviewed!
                </div>
              )}
            </div>
          </div>

          {/* Recent Joinings & Workforce Additions */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users size={18} className="text-blue-500" /> Recent Employee Onboardings
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Newly joined workforce members across departments</p>
              </div>
              <Link to="/employees" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                View Directory <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-2.5">
              {recent_new_hires && recent_new_hires.length > 0 ? (
                recent_new_hires.map((e: any) => (
                  <Link
                    key={e.id}
                    to={`/employees/${e.id}`}
                    className="p-3.5 rounded-2xl bg-background border border-border/80 flex items-center justify-between gap-3 hover:border-primary/40 hover:bg-accent/20 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {e.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                          {e.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {e.job_title} • {e.department}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-muted-foreground block">{e.date_of_joining || 'Active'}</span>
                      <span className="text-[9px] px-2 py-0.2 rounded-full font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {e.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No recent onboardings.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. HR Compliance & Employee Lifecycle Warnings */}
        {hrWarnings && hrWarnings.length > 0 && (
          <div className="p-6 rounded-3xl bg-card border border-amber-500/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">HR Workforce & Employee Warnings</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hrWarnings.length} active employee compliance items requiring HR review & action
                  </p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {hrWarnings.length} Action Items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hrWarnings.map((w: any) => (
                <div
                  key={w.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                    w.severity === 'DANGER'
                      ? 'bg-rose-500/5 border-rose-500/20 text-foreground'
                      : 'bg-amber-500/5 border-amber-500/20 text-foreground'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        w.severity === 'DANGER' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'
                      }`}>
                        {w.category || 'HR Alert'}
                      </span>
                      <span className="text-xs font-bold text-foreground truncate">{w.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{w.message}</p>
                  </div>

                  {w.action_link && (
                    <Link
                      to={w.action_link}
                      className="px-3 py-1.5 rounded-xl bg-card hover:bg-accent text-foreground border border-border text-xs font-bold shrink-0 shadow-xs transition"
                    >
                      {w.action_label || 'Review'} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // EMPLOYEE SELF-SERVICE DASHBOARD VIEW
  // ==========================================
  if (currentRole === 'EMPLOYEE' && employeeData) {
    const { employee, leave_balances, latest_payslip, attendance, pending_leaves, warnings: empWarnings } = employeeData;
    const balanceList = Array.isArray(leave_balances)
      ? leave_balances
      : leave_balances
      ? [leave_balances.paid_leave, leave_balances.casual_leave, leave_balances.sick_leave].filter(Boolean)
      : [];

    const totalRemainingDays =
      leave_balances?.summary?.total_paid_remaining ??
      balanceList.reduce((acc: number, b: any) => acc + (b.remaining_days || 0), 0);

    const isNewEmployee = Boolean(
      employee?.is_new ||
      (attendance?.days_present_month === 0 && !latest_payslip)
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent p-6 rounded-3xl border border-amber-500/20">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Users size={13} />
                Employee Self-Service
              </span>
              <span className="text-xs text-muted-foreground">{employee.department} • {employee.job_title}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {isNewEmployee ? `Welcome, ${employee.name}` : `Welcome back, ${employee.name}`}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Your centralized personal dashboard for attendance punches, leave entitlements, and statutory payslips.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/time-off"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-all"
            >
              <Calendar size={15} /> Apply for Leave
            </Link>
            <Link
              to="/attendance"
              className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-accent text-foreground border border-border font-semibold rounded-xl text-xs transition-all"
            >
              <Clock size={15} /> Attendance Hub
            </Link>
          </div>
        </div>

        {/* Personalized Employee Action Alerts (if any) */}
        {empWarnings && empWarnings.length > 0 && (
          <div className="space-y-3">
            {empWarnings.map((w: any) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 animate-in fade-in shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span>{w.title}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-md bg-amber-500/20 text-amber-500 font-bold uppercase tracking-wider">
                        Action Required
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{w.message}</div>
                  </div>
                </div>

                {w.action_link && (
                  <Link
                    to={w.action_link}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shrink-0 hover:bg-amber-600 transition shadow-xs"
                  >
                    {w.action_label || 'Take Action'} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Real-time Duty Working Hours Telemetry (Toggle button removed for Employee Dashboard view) */}
        <AttendanceToggle showToggle={false} />

        {/* 4 Core Employee Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Leave Balance */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Leave Balance</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Calendar size={18} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-foreground">{totalRemainingDays} Days</div>
            <span className="text-xs text-muted-foreground mt-1 block">
              Available across PL, CL, and SL
            </span>
          </div>

          {/* Days Present this Month */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duty This Month</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-emerald-500">{attendance.days_present_month} Days</div>
            <span className="text-xs text-muted-foreground mt-1 block">
              {attendance.total_hours_month} recorded duty hours
            </span>
          </div>

          {/* Latest Net Wage */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Latest Net Salary</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <IndianRupee size={18} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-blue-500">
              {latest_payslip ? formatINR(latest_payslip.net_wage) : '₹0'}
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">
              {latest_payslip ? `${latest_payslip.period} • Disbursed` : 'No recent slip'}
            </span>
          </div>

          {/* Today's Punch Status */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Punch</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-foreground">
              {attendance.today_check_in
                ? attendance.today_check_in
                : attendance.last_duty_in
                ? `${attendance.last_duty_in}`
                : 'Not Punched'}
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">
              {attendance.today_check_out
                ? `Check-out: ${attendance.today_check_out}`
                : attendance.clocked_in_today
                ? 'Currently On Duty'
                : attendance.last_duty_date
                ? `Last: ${attendance.last_duty_date} (${attendance.last_duty_hours}h)`
                : 'Standard Shift Active'}
            </span>
          </div>
        </div>

        {/* 2 Detail Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leave Quota Details */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="text-primary" size={18} /> My Annual Leave Entitlements
              </h3>
              <Link to="/time-off" className="text-xs text-primary font-bold hover:underline">
                View Full Leave Book →
              </Link>
            </div>
            <div className="space-y-3">
              {balanceList?.map((b: any) => (
                <div key={b.code} className="p-4 rounded-2xl bg-accent/20 border border-border/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-foreground">{b.type_name || b.name} ({b.code})</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Allocated: {b.allocated_days ?? 0}d • Taken: {b.used_days ?? b.taken_days ?? 0}d
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-lg" style={{ color: b.color_code || '#3B82F6' }}>
                      {b.remaining_days ?? 0} <span className="text-xs font-normal">days left</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Leaves & Quick Links */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="text-primary" size={18} /> My Recent Requests & Payslips
              </h3>
              <Link to="/payroll/payslips" className="text-xs text-primary font-bold hover:underline">
                View Payslips →
              </Link>
            </div>
            {pending_leaves?.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase">Pending Approvals</div>
                {pending_leaves.map((p: any) => (
                  <div key={p.id} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-foreground">{p.days} Days Requested</span>
                      <div className="text-muted-foreground">{p.start_date} to {p.end_date} • {p.reason}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 font-bold">Pending</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 text-center text-xs text-muted-foreground">
                No pending leave requests. All leave records are approved & up to date.
              </div>
            )}
            {latest_payslip && (
              <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-foreground">Latest Payslip: {latest_payslip.payslip_number}</div>
                  <div className="text-[11px] text-muted-foreground">{latest_payslip.period} • Net: {formatINR(latest_payslip.net_wage)}</div>
                </div>
                <Link
                  to={`/payroll/payslips/${latest_payslip.id}`}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all"
                >
                  View Payslip
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Dedicated Recent Biometric Attendance Logs Section */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="text-emerald-500" size={18} /> My Recent Biometric Attendance Logs
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time punch records synchronized directly from the PostgreSQL biometric database.
              </p>
            </div>
            <Link
              to="/attendance"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              View Full Attendance History ({attendance.total_records || attendance.recent_logs?.length || 0}) →
            </Link>
          </div>

          {attendance.recent_logs && attendance.recent_logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Duty Worked</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {attendance.recent_logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        {log.formatted_date || log.date}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        <span className="font-bold text-foreground">{log.check_in}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        <span className="font-semibold text-foreground">{log.check_out}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-foreground whitespace-nowrap">
                        {log.worked_hours} hrs
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {log.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-muted/20 border border-border/60 text-center text-xs text-muted-foreground">
              No recent attendance logs found. Attendance records will appear once biometric punch sessions are logged.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // PAYROLL OFFICER DASHBOARD VIEW
  // ==========================================
  if (isPayroll && payrollData) {
    const { disbursements, unresolved_warnings_count, warnings: payrollWarnings } = payrollData;

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent p-6 rounded-3xl border border-emerald-500/20">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <IndianRupee size={13} />
                Payroll Department Portal
              </span>
              <span className="text-xs text-muted-foreground">{currentPersona.full_name} • {currentPersona.display_title}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Payroll Processing & Compliance
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              End-to-end payrun batch processing, statutory ECR exports (EPF, PT, TDS), and attendance reconciliation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/payroll/payruns"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-all"
            >
              <IndianRupee size={15} /> Compute Batch Payrun
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-accent text-foreground border border-border font-semibold rounded-xl text-xs transition-all"
            >
              <FileText size={15} /> Statutory Reports
            </Link>
          </div>
        </div>

        {/* 4 Core Payroll Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gross Payroll</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <IndianRupee size={18} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-foreground">{formatINR(disbursements.total_gross_inr)}</div>
            <span className="text-xs text-muted-foreground mt-1 block">Computed salary gross</span>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Disbursement</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-primary">{formatINR(disbursements.total_net_inr)}</div>
            <span className="text-xs text-muted-foreground mt-1 block">Net bank transfer volume</span>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Statutory Deductions</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-purple-500">{formatINR(disbursements.total_deductions_inr)}</div>
            <span className="text-xs text-muted-foreground mt-1 block">EPF + PT + TDS + LOP</span>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payroll Warnings</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-amber-500">{unresolved_warnings_count}</div>
            <span className="text-xs text-muted-foreground mt-1 block">Compliance validations</span>
          </div>
        </div>

        {/* Actionable Payroll & Disbursement Warnings */}
        {payrollWarnings && payrollWarnings.length > 0 && (
          <div className="p-6 rounded-3xl bg-card border border-rose-500/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Payroll Compliance & Bank Disbursement Warnings</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {payrollWarnings.length} direct-deposit blocker, statutory, or reconciliation items requiring resolution
                  </p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {payrollWarnings.length} Issues Detected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {payrollWarnings.map((w: any) => (
                <div
                  key={w.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                    w.severity === 'DANGER'
                      ? 'bg-rose-500/5 border-rose-500/20 text-foreground'
                      : 'bg-amber-500/5 border-amber-500/20 text-foreground'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        w.severity === 'DANGER' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'
                      }`}>
                        {w.category || 'Payroll Warning'}
                      </span>
                      <span className="text-xs font-bold text-foreground truncate">{w.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{w.message}</p>
                  </div>

                  {w.action_link && (
                    <Link
                      to={w.action_link}
                      className="px-3 py-1.5 rounded-xl bg-card hover:bg-accent text-foreground border border-border text-xs font-bold shrink-0 shadow-xs transition"
                    >
                      {w.action_label || 'Resolve'} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // UNIFIED ADMIN DASHBOARD VIEW
  // ==========================================
  if (!adminData) {
    return (
      <div className="p-8 text-center text-rose-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const { metrics, department_distribution, admin_wage } = adminData;

  const chartData = department_distribution.map((d: any) => ({
    name: d.code,
    fullName: d.name,
    employees: d.employee_count,
    monthlyWage: d.total_monthly_wage,
  }));

  const adminWage = admin_wage || {
    name: currentPersona.full_name || 'Aarav Sharma',
    job_title: 'VP of Engineering & System Administrator',
    employee_code: 'EMP-IND-001',
    monthly_wage: metrics.admin_monthly_wage || 300000.0,
    net_wage: metrics.admin_net_wage || 244000.0,
    basic_wage: 150000.0,
    gross_wage: 300000.0,
    annual_ctc: metrics.admin_annual_ctc || 3600000.0,
    contract_status: 'ACTIVE',
    contract_number: 'CONT-IND-EMP-IND-001-2026',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-indigo-500/5 to-transparent p-6 rounded-3xl border border-primary/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {isAdmin ? 'System Administrator Console' : 'Executive Management Console'}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {adminWage.employee_code} • {adminWage.job_title}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {currentPersona.full_name}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Enterprise Indian Payroll, Statutory Compliances (EPF, PT, TDS), and Workforce Management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/contracts"
            className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-accent text-foreground border border-border font-semibold rounded-xl text-xs transition-all shadow-xs"
          >
            <Briefcase size={15} /> My Contract
          </Link>
          <Link
            to="/payroll/payslips"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <FileText size={15} /> My Payslips
          </Link>
          <Link
            to="/employees"
            className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-accent text-foreground border border-border font-semibold rounded-xl text-xs transition-all"
          >
            <Users size={15} /> All Employees
          </Link>
        </div>
      </div>

      {/* 4 Core High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Admin Personal Monthly Wage */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-card to-card border border-indigo-500/30 shadow-sm hover:border-indigo-500/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> Admin Monthly Wage
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-foreground">
            {formatINR(adminWage.monthly_wage)}
            <span className="text-xs font-semibold text-muted-foreground ml-1.5">/mo</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-emerald-500 font-semibold">Net: {formatINR(adminWage.net_wage)}/mo</span>
            <span className="text-muted-foreground">{formatINRPerAnnum(adminWage.monthly_wage)}</span>
          </div>
        </div>

        {/* Card 2: Total Enterprise Monthly Wage Volume */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Wage Volume</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-foreground">
            {formatINR(metrics.total_monthly_wage_volume || metrics.monthly_payroll_inr)}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">
            Annualized: {formatINRPerAnnum(metrics.total_monthly_wage_volume || metrics.monthly_payroll_inr)}
          </span>
        </div>

        {/* Card 3: Total Workforce */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Staff</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-emerald-500">{metrics.total_employees}</div>
          <span className="text-xs text-muted-foreground mt-1 block">
            100% active contracts mapped
          </span>
        </div>

        {/* Card 4: Attendance Rate Today */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance Today</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-blue-500">{metrics.attendance_rate}%</div>
          <span className="text-xs text-muted-foreground mt-1 block">
            {metrics.present_today} on-duty punches recorded
          </span>
        </div>
      </div>

      {/* 2-Column Section: Admin Executive Compensation Summary & Department Wage Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Executive Compensation Breakdown */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="text-indigo-500" size={18} /> Admin Executive Compensation Package
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Governed under Indian Executive & Leadership Structure (<code>IND_EXEC_LEAD</code>)
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {adminWage.contract_status}
            </span>
          </div>

          {/* Salary Breakdown Items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/70">
              <span className="text-[11px] text-muted-foreground block font-medium">Monthly Gross Base</span>
              <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                {formatINR(adminWage.monthly_wage)}
              </span>
              <span className="text-[10px] text-muted-foreground">₹36.00 LPA CTC</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/70">
              <span className="text-[11px] text-muted-foreground block font-medium">Basic Wage (50%)</span>
              <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                {formatINR(adminWage.basic_wage)}
              </span>
              <span className="text-[10px] text-muted-foreground">Statutory base</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] text-emerald-500 block font-semibold">Net Take-Home</span>
              <span className="text-sm font-extrabold text-emerald-500 mt-0.5 block">
                {formatINR(adminWage.net_wage)}
              </span>
              <span className="text-[10px] text-emerald-500/80">Direct bank credit</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-accent/15 border border-border/60 text-xs space-y-2">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Contract Number:</span>
              <span className="font-mono font-bold text-foreground">{adminWage.contract_number}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Statutory Compliance:</span>
              <span className="text-emerald-500 font-semibold">EPF (₹1,800) • PT (₹200) • TDS (₹54,000)</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Annual CTC Package:</span>
              <span className="font-bold text-foreground">{formatINRPerAnnum(adminWage.monthly_wage)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/contracts"
              className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs"
            >
              View Full Contract Details →
            </Link>
            <Link
              to="/payroll/payslips"
              className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-card hover:bg-accent border border-border text-foreground transition shadow-xs"
            >
              View Monthly Payslips →
            </Link>
          </div>
        </div>

        {/* Monthly CTC Distribution by Department Chart */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Monthly CTC Distribution by Department</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Aggregated wage volume and headcount across 6 enterprise divisions</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  fontSize={11}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(val: any) => formatINR(val)}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '1rem', fontSize: '12px' }}
                  labelFormatter={(val) => chartData.find((d: any) => d.name === val)?.fullName || val}
                />
                <Bar dataKey="monthlyWage" name="Monthly CTC" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
