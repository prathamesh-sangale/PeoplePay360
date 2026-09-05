import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../lib/api';
import { formatINR, formatINRPerAnnum, getStatusBadgeClass } from '../lib/formatters';
import {
  Users,
  IndianRupee,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  ChevronRight,
  CheckCircle2,
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

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-medium">Loading PeoplePay360 Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-500 mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-semibold mb-1">Failed to load dashboard data</h3>
        <p className="text-sm text-muted-foreground mb-4">Please make sure the FastAPI backend is running.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, department_distribution, recent_payruns, recent_payslips, recent_warnings } = data;

  const chartData = department_distribution.map((d: any) => ({
    name: d.code,
    fullName: d.name,
    employees: d.employee_count,
    monthlyWage: d.total_monthly_wage,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Indian Payroll System Live (FY 2026-27)
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome to PeoplePay360
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise Indian Payroll, Statutory Compliances (EPF, PT, TDS), and Workforce Management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/payroll/payruns"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <IndianRupee size={16} /> Run Payroll
          </Link>
          <Link
            to="/employees"
            className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-accent text-foreground border border-border font-medium rounded-xl text-sm transition-all"
          >
            <Users size={16} /> Directory
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Workforce</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{metrics.total_employees}</span>
            <span className="text-xs font-medium text-emerald-500 flex items-center">
              <TrendingUp size={12} className="mr-0.5" /> 100% active
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Across {department_distribution.length} Indian City Hubs
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Payroll (INR)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{formatINR(metrics.monthly_payroll_inr, true)}</span>
            <span className="text-xs text-muted-foreground">/ month</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Annualized: {formatINRPerAnnum(metrics.monthly_payroll_inr)}
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance Rate</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{metrics.attendance_rate}%</span>
            <span className="text-xs font-medium text-emerald-500">Normal</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {metrics.punches_today} Biometric punches logged
          </div>
        </div>

        {/* Active Payruns */}
        <div className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payruns & Compliance</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <FileCheck2 size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{metrics.payruns_count} Cycles</span>
            <span className="text-xs font-medium text-purple-500">EPF/PT Ready</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {metrics.pending_leaves} Pending Leave Approvals
          </div>
        </div>
      </div>

      {/* Visual Charts & Department Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Spend Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Monthly Payroll by Department (INR)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Direct compensation allocation across functional teams</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="font-semibold text-foreground">{item.fullName} ({item.name})</p>
                          <p className="text-emerald-500 font-medium">Spend: {formatINR(item.monthlyWage)}</p>
                          <p className="text-muted-foreground">Headcount: {item.employees} staff</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="monthlyWage" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount Distribution Donut */}
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Headcount Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution across Indian hubs</p>
          </div>
          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="employees"
                >
                  {chartData.map((_item: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {chartData.map((d: any, idx: number) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-muted-foreground truncate">{d.name}:</span>
                <span className="font-medium text-foreground">{d.employees}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Section: Recent Payruns & Payslips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payrun Batches */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Recent Payruns</h3>
              <p className="text-xs text-muted-foreground">Monthly batch processing status</p>
            </div>
            <Link to="/payroll/payruns" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recent_payruns.map((pr: any) => (
              <div
                key={pr.id}
                className="p-4 rounded-xl bg-background border border-border/80 flex items-center justify-between hover:border-primary/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{pr.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(pr.status)}`}>
                      {pr.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>{pr.period}</span>
                    <span>•</span>
                    <span>{pr.payslips_count} Payslips</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">
                    {pr.total_net > 0 ? formatINR(pr.total_net) : 'Draft Cycle'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {pr.total_gross > 0 ? `Gross: ${formatINR(pr.total_gross, true)}` : 'Pending calculation'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Generated Payslips */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Latest Payslips</h3>
              <p className="text-xs text-muted-foreground">Generated INR salary slips</p>
            </div>
            <Link to="/payroll/payslips" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recent_payslips.map((ps: any) => (
              <Link
                to={`/payroll/payslips/${ps.id}`}
                key={ps.id}
                className="p-3.5 rounded-xl bg-background border border-border/80 flex items-center justify-between hover:border-primary/40 hover:bg-accent/30 transition-all block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {ps.employee_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{ps.employee_name}</div>
                    <div className="text-xs text-muted-foreground">{ps.employee_code} • {ps.payslip_number}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-emerald-500">{formatINR(ps.net_wage)}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(ps.status)}`}>
                    {ps.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance & Payroll Warnings */}
      {recent_warnings.length > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              <h3 className="text-base font-semibold text-foreground">Payroll Compliance & Action Items</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recent_warnings.map((w: any) => (
              <div
                key={w.id}
                className="p-4 rounded-xl bg-background border border-amber-500/20 flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{w.type}</span>
                    {w.is_resolved ? (
                      <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Resolved</span>
                    ) : (
                      <span className="text-xs text-amber-500 font-medium">Pending Review</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/90">{w.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
