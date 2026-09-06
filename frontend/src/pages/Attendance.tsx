import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAttendance,
  getAttendanceRoster,
  getTodayAttendance,
  toggleAttendancePunch,
  correctAttendance,
  getMetaDepartments,
} from '../lib/api';
import { getStatusBadgeClass, formatTime12Hour } from '../lib/formatters';
import {
  Search,
  Edit3,
  Clock,
  AlertCircle,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  Filter,
  ListFilter,
  Calendar,
  ShieldCheck,
  UserX,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AttendanceToggle from '../components/AttendanceToggle';

export default function Attendance() {
  const queryClient = useQueryClient();
  const currentRole = (localStorage.getItem('peoplepay360_active_role') || 'ADMIN').toUpperCase();
  const isEmployeeRole = currentRole === 'EMPLOYEE';
  const isHRorAdmin = currentRole === 'HR' || currentRole === 'ADMIN';

  // Live ticking clock for second-level synchronization with employee timers
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tabs & Views (Default to employee personal logs for Employee persona)
  const [activeTab, setActiveTab] = useState<'roster' | 'history'>(isEmployeeRole ? 'history' : 'roster');

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'department' | 'status' | 'check_in' | 'worked_hours'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Correction Form State
  const [correctingRecord, setCorrectingRecord] = useState<any | null>(null);
  const [correctCheckIn, setCorrectCheckIn] = useState('');
  const [correctCheckOut, setCorrectCheckOut] = useState('');
  const [correctReason, setCorrectReason] = useState('');
  const [correctError, setCorrectError] = useState('');

  // Queries
  const { data: departments } = useQuery({
    queryKey: ['meta-departments'],
    queryFn: getMetaDepartments,
  });

  const { data: todayData } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: getTodayAttendance,
  });

  // Fetch full active roster for the selected department (or all departments)
  const { data: roster, isLoading: isRosterLoading } = useQuery({
    queryKey: ['attendance-roster', deptFilter],
    queryFn: () =>
      getAttendanceRoster({
        department_id: deptFilter !== 'ALL' ? Number(deptFilter) : undefined,
      }),
    refetchInterval: 15000,
  });

  const { data: historyRecords, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['attendance-records', statusFilter],
    queryFn: () => getAttendance({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
    enabled: activeTab === 'history' || isEmployeeRole,
  });

  // Toggle Mutation for any employee row
  const [togglingEmpId, setTogglingEmpId] = useState<number | null>(null);

  const toggleMutation = useMutation({
    mutationFn: (empId: number) => toggleAttendancePunch({ employee_id: empId }),
    onSuccess: (data: any) => {
      setTogglingEmpId(null);
      setToastMessage(data.message || (data.is_working ? 'Attendance Clocked IN' : 'Attendance Clocked OUT'));
      queryClient.invalidateQueries({ queryKey: ['attendance-roster'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-employee-stats'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setTogglingEmpId(null);
      setToastMessage(`Error: ${err.message || 'Failed to toggle attendance.'}`);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  const handleRowToggle = (empId: number) => {
    setTogglingEmpId(empId);
    toggleMutation.mutate(empId);
  };

  // Correction Mutation
  const correctMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) => correctAttendance(id, payload),
    onSuccess: () => {
      setCorrectingRecord(null);
      setCorrectError('');
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-roster'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-employee-stats'] });
    },
    onError: (err: any) => {
      setCorrectError(err.message || 'Failed to apply attendance correction.');
    },
  });

  const handleOpenCorrect = (rec: any) => {
    setCorrectingRecord(rec);
    const dateStr = rec.attendance_date || new Date().toISOString().split('T')[0];
    setCorrectCheckIn(rec.check_in_time !== '--:--' ? `${dateStr}T${rec.check_in_time}` : `${dateStr}T09:00:00`);
    setCorrectCheckOut(rec.check_out_time !== '--:--' ? `${dateStr}T${rec.check_out_time}` : `${dateStr}T18:00:00`);
    setCorrectReason('Biometric reader sync adjustment verified with department lead.');
    setCorrectError('');
  };

  const handleCorrectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrectError('');
    if (!correctReason || correctReason.trim().length < 5) {
      setCorrectError('Please enter a mandatory audit reason (minimum 5 characters).');
      return;
    }
    correctMutation.mutate({
      id: correctingRecord.id,
      payload: {
        new_check_in: correctCheckIn ? new Date(correctCheckIn).toISOString() : undefined,
        new_check_out: correctCheckOut ? new Date(correctCheckOut).toISOString() : undefined,
        reason: correctReason.trim(),
      },
    });
  };

  // Telemetry counts computed across the complete workforce roster
  const totalRosterCount = roster?.length || 0;
  const workingNowCount = roster?.filter((r: any) => r.is_working).length || 0;
  const completedCount = roster?.filter((r: any) => !r.is_working && r.status === 'COMPLETED').length || 0;
  const onLeaveCount = roster?.filter((r: any) => r.is_on_leave).length || 0;
  const notWorkingCount = roster?.filter((r: any) => !r.is_working && r.status !== 'COMPLETED' && !r.is_on_leave).length || 0;

  // Synchronized live duty timer helper matching Employee UI second-by-second
  const getLiveWorkedDisplay = (emp: any) => {
    if (emp.is_working && emp.check_in) {
      const checkInMs = new Date(emp.check_in).getTime();
      const elapsedSec = Math.max(0, Math.floor((nowTimestamp - checkInMs) / 1000));
      const h = Math.floor(elapsedSec / 3600);
      const m = Math.floor((elapsedSec % 3600) / 60);
      const s = elapsedSec % 60;
      return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    }
    return emp.formatted_worked_time || '00h 00m';
  };

  // Filter and Sequence Sorting logic

  const sortedRoster = useMemo(() => {
    if (!roster) return [];
    
    // 1. Status Filter
    let items = [...roster];
    if (statusFilter === 'WORKING') {
      items = items.filter((r: any) => r.is_working);
    } else if (statusFilter === 'NOT_WORKING') {
      items = items.filter((r: any) => !r.is_working && r.status !== 'COMPLETED' && !r.is_on_leave);
    } else if (statusFilter === 'COMPLETED') {
      items = items.filter((r: any) => !r.is_working && r.status === 'COMPLETED');
    } else if (statusFilter === 'ON_LEAVE') {
      items = items.filter((r: any) => r.is_on_leave);
    }

    // 2. Search Filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (r: any) =>
          r.full_name?.toLowerCase().includes(q) ||
          r.employee_code?.toLowerCase().includes(q) ||
          r.department_name?.toLowerCase().includes(q) ||
          r.job_title?.toLowerCase().includes(q)
      );
    }

    // 3. Sequence / Attribute Sorting
    return items.sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === 'code') {
        comparison = (a.employee_code || '').localeCompare(b.employee_code || '');
      } else if (sortBy === 'name') {
        comparison = (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortBy === 'department') {
        comparison = (a.department_name || '').localeCompare(b.department_name || '');
      } else if (sortBy === 'status') {
        const rank = (item: any) => (item.is_working ? 0 : item.status === 'COMPLETED' ? 1 : item.is_on_leave ? 2 : 3);
        comparison = rank(a) - rank(b);
      } else if (sortBy === 'check_in') {
        const timeA = a.check_in ? new Date(a.check_in).getTime() : 0;
        const timeB = b.check_in ? new Date(b.check_in).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortBy === 'worked_hours') {
        comparison = (a.worked_hours || 0) - (b.worked_hours || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [roster, statusFilter, search, sortBy, sortDirection]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Clock size={13} />
              {isEmployeeRole ? 'Personal Attendance Hub' : 'Workforce Attendance & Punch Desk'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEmployeeRole ? 'My Biometric Attendance & Timesheet' : 'Attendance Operations & Employee Toggle Roster'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEmployeeRole
              ? 'Real-time duty telemetry, verified biometric check-in/out logs, and monthly compliance records.'
              : 'Real-time shift clock-in/out toggles, live worked hours telemetry, sequence filters, and audit history.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card border border-border shrink-0">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar size={14} /> {isEmployeeRole ? `My Punch Logs (${historyRecords?.length || 0})` : 'Historical Punch Logs'}
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={14} /> {isEmployeeRole ? 'Shift & Team Roster' : 'Full Employee Roster'}
          </button>
        </div>
      </div>

      {/* Real-time Working Hours Telemetry for Employee Persona */}
      {isEmployeeRole && (
        <div className="space-y-4">
          <AttendanceToggle showToggle={false} />

          {/* 4 Employee Personal Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Recorded</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-foreground">{historyRecords?.length || todayData?.month_stats?.total_records || 0} Punches</div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Synced from PostgreSQL database</span>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duty This Month</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-emerald-500">{todayData?.month_stats?.days_present ?? 0} Days</div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Active pay cycle present days</span>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recorded Hours</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-blue-500">{todayData?.month_stats?.total_hours ?? 0} hrs</div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Cumulative duty worked hours</span>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Punctuality Score</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-purple-500">{todayData?.month_stats?.punctuality_rate ?? 100}%</div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">On-time punch compliance</span>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Feedback Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-background border border-primary/40 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Sparkles size={16} className="text-primary" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground text-xs">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ATTENDANCE BAR: SEQUENCE FILTERS & STATUS METRIC PILLS */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        {/* Top Metric Status Quick-Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pb-3 border-b border-border/60">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Filter size={13} />
            Status:
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            <Users size={13} /> All ({totalRosterCount})
          </button>

          <button
            onClick={() => setStatusFilter('WORKING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'WORKING'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Working Now ({workingNowCount})
          </button>

          <button
            onClick={() => setStatusFilter('NOT_WORKING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'NOT_WORKING'
                ? 'bg-muted text-foreground ring-1 ring-border'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            <UserX size={13} /> Not Working ({notWorkingCount})
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'COMPLETED'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30'
            }`}
          >
            <CheckCircle2 size={13} /> Completed ({completedCount})
          </button>

          <button
            onClick={() => setStatusFilter('ON_LEAVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'ON_LEAVE'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30'
            }`}
          >
            <ShieldCheck size={13} /> On Leave ({onLeaveCount})
          </button>
        </div>

        {/* Sequence & Search Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* 1. Live Search Input (4 cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employee, ID sequence, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          {/* 2. Department Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments?.map((d: any) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Sequence / Sort By (3 cols) */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <ListFilter size={13} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
            >
              <option value="code">Sequence / ID (EMP-001...)</option>
              <option value="name">Employee Name (A - Z)</option>
              <option value="department">Department</option>
              <option value="status">Duty Status (Working ON first)</option>
              <option value="check_in">Check-in Time (Earliest)</option>
              <option value="worked_hours">Worked Hours (Highest)</option>
            </select>
          </div>

          {/* 4. Sort Direction Toggle (2 cols) */}
          <div className="lg:col-span-2">
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-background border border-input hover:bg-accent text-foreground flex items-center justify-center gap-1.5 transition-all"
            >
              <ArrowUpDown size={13} />
              <span>{sortDirection === 'asc' ? 'Ascending ↑' : 'Descending ↓'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW TAB 1: FULL EMPLOYEE ATTENDANCE ROSTER WITH TOGGLE BUTTONS */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-card border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-4">Seq / Employee</th>
                    <th className="py-3.5 px-4">Department & Role</th>
                    <th className="py-3.5 px-4">Assigned Shift</th>
                    <th className="py-3.5 px-4">Check-In</th>
                    <th className="py-3.5 px-4">Check-Out</th>
                    <th className="py-3.5 px-4">Duty Worked</th>
                    <th className="py-3.5 px-4">Status</th>
                    {isHRorAdmin && <th className="py-3.5 px-4 text-right">Live Toggle Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isRosterLoading ? (
                    <tr>
                      <td colSpan={isHRorAdmin ? 8 : 7} className="py-12 text-center text-xs text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading employee attendance roster...</span>
                        </div>
                      </td>
                    </tr>
                  ) : sortedRoster && sortedRoster.length > 0 ? (
                    sortedRoster.map((emp: any) => {
                      const isPendingThis = togglingEmpId === emp.employee_id;
                      return (
                        <tr
                          key={emp.employee_id}
                          className={`hover:bg-accent/30 transition-colors ${
                            emp.is_working ? 'bg-emerald-500/[0.03]' : ''
                          }`}
                        >
                          {/* 1. Sequence & Employee */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  emp.is_working
                                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                    : 'bg-primary/10 text-primary border border-primary/20'
                                }`}
                              >
                                {emp.avatar_initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-foreground hover:text-primary transition-colors truncate">
                                  <Link to={`/employees/${emp.employee_id}`}>{emp.full_name}</Link>
                                </div>
                                <span className="font-mono text-[11px] text-muted-foreground block">
                                  {emp.employee_code}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Department & Role */}
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold text-foreground">{emp.department_name}</div>
                            <div className="text-[11px] text-muted-foreground">{emp.job_title}</div>
                          </td>

                          {/* 3. Shift Schedule */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-xs font-mono text-foreground font-medium">
                              {emp.shift_start} - {emp.shift_end}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                              {emp.shift_name}
                            </div>
                          </td>

                          {/* 4. Check In */}
                          <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                            {emp.check_in_time ? (
                              <span className="font-bold text-foreground">{emp.check_in_time}</span>
                            ) : (
                              <span className="text-muted-foreground italic">--:--</span>
                            )}
                          </td>

                          {/* 5. Check Out */}
                          <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                            {emp.is_working ? (
                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Active Shift
                              </span>
                            ) : emp.check_out_time ? (
                              <span className="font-semibold text-foreground">{emp.check_out_time}</span>
                            ) : (
                              <span className="text-muted-foreground italic">--:--</span>
                            )}
                          </td>

                          {/* 6. Duty Worked */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {emp.is_working ? (
                              <span className="font-mono font-bold text-xs text-emerald-500 inline-flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {getLiveWorkedDisplay(emp)}
                              </span>
                            ) : (
                              <span className="font-mono font-semibold text-xs text-foreground">
                                {emp.formatted_worked_time || '00h 00m'}
                              </span>
                            )}
                          </td>

                          {/* 7. Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {emp.is_on_leave ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                🏖 {emp.leave_reason || 'Approved Leave'}
                              </span>
                            ) : emp.is_working ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse">
                                ● Working ({emp.status})
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(
                                  emp.status
                                )}`}
                              >
                                {emp.status === 'NOT_STARTED' ? 'Not Started' : emp.status}
                              </span>
                            )}
                          </td>

                          {/* 8. Interactive Toggle Button (HR and Admin only) */}
                          {isHRorAdmin && (
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {/* Prominent ON / OFF Toggle Button */}
                                <button
                                  onClick={() => handleRowToggle(emp.employee_id)}
                                  disabled={isPendingThis || toggleMutation.isPending}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-xs ${
                                    emp.is_working
                                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 ring-1 ring-emerald-400 active:scale-95'
                                      : 'bg-card border-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent active:scale-95'
                                  }`}
                                  title={emp.is_working ? 'Click to Clock Out' : 'Click to Clock In'}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      emp.is_working ? 'bg-white animate-pulse' : 'bg-muted-foreground/50'
                                    }`}
                                  ></span>
                                  <span>{emp.is_working ? 'ON' : 'OFF'}</span>
                                  <span className="text-[10px] font-normal opacity-80 pl-1 border-l border-current/20">
                                    {isPendingThis ? '...' : emp.is_working ? 'Stop' : 'Start'}
                                  </span>
                                </button>

                                {/* HR Audit Correct Button */}
                                {emp.attendance_id && (
                                  <button
                                    onClick={() => handleOpenCorrect(emp)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition-all"
                                    title="Audit Correction"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={isHRorAdmin ? 8 : 7} className="py-12 text-center text-xs text-muted-foreground">
                        No employees found matching the sequence or status filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW TAB 2: DETAILED HISTORICAL ATTENDANCE LOGS & AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-card border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Check-In (12-Hr)</th>
                    <th className="py-3 px-4">Check-Out (12-Hr)</th>
                    <th className="py-3 px-4">Worked Hours</th>
                    <th className="py-3 px-4">Status</th>
                    {isHRorAdmin && <th className="py-3 px-4 text-right">Audit Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isHistoryLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                        Loading attendance history...
                      </td>
                    </tr>
                  ) : historyRecords && historyRecords.length > 0 ? (
                    historyRecords.map((r: any) => (
                      <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-foreground whitespace-nowrap">{r.attendance_date}</td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <Link to={`/employees/${r.employee_id}`} className="hover:text-primary transition-colors">
                            {r.employee_name}
                          </Link>
                          <div className="text-xs text-muted-foreground font-mono">{r.employee_code}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">{r.department}</td>
                        <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                          {r.status === 'ABSENT' ? (
                            <span className="text-muted-foreground italic">--:--</span>
                          ) : (
                            formatTime12Hour(r.check_in_time)
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                          {r.status === 'ABSENT' || !r.check_out_time || r.check_out_time === '--:--' ? (
                            <span className="text-rose-500 font-semibold text-xs">Missing Checkout</span>
                          ) : (
                            formatTime12Hour(r.check_out_time)
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">{r.worked_hours} hrs</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        {isHRorAdmin && (
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenCorrect(r)}
                              className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition-all border border-border inline-flex items-center gap-1"
                              title="Submit Attendance Correction"
                            >
                              <Edit3 size={12} /> Correct
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isHRorAdmin ? 8 : 7} className="py-8 text-center text-xs text-muted-foreground">
                        No historical attendance records found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HR AUDIT CORRECTION MODAL */}
      {correctingRecord && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-base">
                <Edit3 size={20} />
                <h3 className="text-foreground">Audit Attendance Correction</h3>
              </div>
              <button onClick={() => setCorrectingRecord(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="p-3 bg-accent/20 rounded-2xl border border-border text-xs space-y-1">
              <div className="font-bold text-foreground">
                {correctingRecord.employee_name || correctingRecord.full_name} ({correctingRecord.employee_code})
              </div>
              <div className="text-muted-foreground">
                Date: {correctingRecord.attendance_date || 'Today'} • Original In: {correctingRecord.check_in_time || '--:--'} • Original Out: {correctingRecord.check_out_time || '--:--'}
              </div>
            </div>

            {correctError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {correctError}
              </div>
            )}

            <form onSubmit={handleCorrectSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Corrected Check-In</label>
                  <input
                    type="datetime-local"
                    value={correctCheckIn}
                    onChange={(e) => setCorrectCheckIn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Corrected Check-Out</label>
                  <input
                    type="datetime-local"
                    value={correctCheckOut}
                    onChange={(e) => setCorrectCheckOut(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Mandatory Audit Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  placeholder="Explain why this punch is being adjusted (mandatory for compliance)..."
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectingRecord(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  {correctMutation.isPending ? 'Saving Audit Record...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
