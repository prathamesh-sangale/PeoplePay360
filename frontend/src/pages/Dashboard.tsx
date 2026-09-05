import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats, getHRDashboardStats, approveTimeOffRequest, rejectTimeOffRequest } from '../lib/api';
import { formatINR, formatINRPerAnnum } from '../lib/formatters';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
    const { workforce, attendance, leaves, contracts, department_distribution, recent_pending_leaves, recent_new_hires } = hrData;

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
      </div>
    );
  }

  // ==========================================
  // UNIFIED ADMIN / PAYROLL / GENERAL DASHBOARD VIEW
  // ==========================================
  if (!adminData) {
    return (
      <div className="p-8 text-center text-rose-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const { metrics, department_distribution } = adminData;

  const chartData = department_distribution.map((d: any) => ({
    name: d.code,
    fullName: d.name,
    employees: d.employee_count,
    monthlyWage: d.total_monthly_wage,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/20">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {isAdmin ? 'System Administrator Console' : isPayroll ? 'Payroll Department Workspace' : 'Employee Self-Service'}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome, {currentPersona.full_name}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Enterprise Indian Payroll, Statutory Compliances (EPF, PT, TDS), and Workforce Management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(isAdmin || isPayroll) && (
            <Link
              to="/payroll/payruns"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <IndianRupee size={15} /> Run Payroll
            </Link>
          )}
          <Link
            to="/employees"
            className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-accent text-foreground border border-border font-semibold rounded-xl text-xs transition-all"
          >
            <Users size={15} /> Employees Directory
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Wage Volume */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Wage Volume</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-foreground">
            {formatINR(metrics.total_monthly_wage_volume)}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">
            Annualized: {formatINRPerAnnum(metrics.total_monthly_wage_volume)}
          </span>
        </div>

        {/* Total Workforce */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Staff</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-emerald-500">{metrics.total_employees}</div>
          <span className="text-xs text-muted-foreground mt-1 block">
            100% contracts active & mapped
          </span>
        </div>

        {/* Attendance Today */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance Rate</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-blue-500">{metrics.attendance_rate}%</div>
          <span className="text-xs text-muted-foreground mt-1 block">
            {metrics.present_today} on-duty punches today
          </span>
        </div>

        {/* Statutory Compliance Warnings */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payroll Warnings</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-amber-500">{metrics.unresolved_warnings}</div>
          <span className="text-xs text-muted-foreground mt-1 block">
            {metrics.unresolved_warnings === 0 ? 'Compliances verified' : 'Needs attention'}
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Monthly CTC Distribution by Department</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Aggregated wage volume and headcount across divisions</p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
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
  );
}
