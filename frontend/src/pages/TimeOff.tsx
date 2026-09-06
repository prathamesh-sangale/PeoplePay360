import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTimeOffRequests,
  getTimeOffAllocations,
  getTimeOffTypes,
  getEmployees,
  createTimeOffRequest,
  createTimeOffAllocation,
  approveTimeOffRequest,
  rejectTimeOffRequest,
} from '../lib/api';
import { getStatusBadgeClass } from '../lib/formatters';
import {
  CheckCircle2,
  XCircle,
  Check,
  AlertCircle,
  Plus,
  Layers,
  Clock,
  ShieldCheck,
  TrendingDown,
  CalendarDays,
} from 'lucide-react';

// Helper to get next working day (skips Sat/Sun)
const getInitialWorkingDate = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays > 0) d.setDate(d.getDate() + offsetDays);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2); // Sat -> Mon
  else if (day === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
  return d.toISOString().split('T')[0];
};

export default function TimeOff() {
  const queryClient = useQueryClient();
  const currentRole = (localStorage.getItem('peoplepay360_active_role') || 'ADMIN').toUpperCase();
  const isEmployeeRole = currentRole === 'EMPLOYEE';

  const [activeTab, setActiveTab] = useState<'requests' | 'allocations'>('requests');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Request Form State
  const [reqEmployeeId, setReqEmployeeId] = useState<string>('');
  const [reqTypeId, setReqTypeId] = useState<string>('');
  const [reqStartDate, setReqStartDate] = useState<string>(getInitialWorkingDate());
  const [reqEndDate, setReqEndDate] = useState<string>(getInitialWorkingDate());
  const [reqReason, setReqReason] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Allocation Form State
  const [allocEmpId, setAllocEmpId] = useState<string>('');
  const [allocTypeId, setAllocTypeId] = useState<string>('');
  const [allocAmount, setAllocAmount] = useState<string>('12');
  const [allocNotes, setAllocNotes] = useState<string>('FY 2026-27 Entitlement');
  const [allocError, setAllocError] = useState<string>('');

  // Queries
  const { data: types } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: getTimeOffTypes,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-directory'],
    queryFn: () => getEmployees(),
  });

  const { data: requests } = useQuery({
    queryKey: ['time-off-requests'],
    queryFn: () => getTimeOffRequests(),
  });

  const { data: allocations } = useQuery({
    queryKey: ['time-off-allocations'],
    queryFn: () => getTimeOffAllocations(),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => approveTimeOffRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectTimeOffRequest(id, reason),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: createTimeOffRequest,
    onSuccess: () => {
      setIsRequestModalOpen(false);
      setReqReason('');
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit leave request.');
    },
  });

  const createAllocMutation = useMutation({
    mutationFn: createTimeOffAllocation,
    onSuccess: () => {
      setIsAllocateModalOpen(false);
      setAllocError('');
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setAllocError(err.message || 'Failed to grant allocation.');
    },
  });

  const handleRejectClick = (id: number) => {
    setRejectingId(id);
    setRejectReason('Operational requirements and active release sprint deliverables.');
  };

  const handleConfirmReject = () => {
    if (rejectingId) {
      rejectMutation.mutate({ id: rejectingId, reason: rejectReason });
    }
  };

  // Selected Type in Modal
  const selectedType = useMemo(() => {
    return types?.find((t: any) => String(t.id) === String(reqTypeId));
  }, [types, reqTypeId]);

  // Compute live duration: Working Days vs Calendar Days
  const { workingDays, calendarDays, effectiveDuration } = useMemo(() => {
    if (!reqStartDate || !reqEndDate) return { workingDays: 1, calendarDays: 1, effectiveDuration: 1 };
    const start = new Date(reqStartDate + 'T00:00:00');
    const end = new Date(reqEndDate + 'T00:00:00');
    if (start > end) return { workingDays: 0, calendarDays: 0, effectiveDuration: 0 };

    const calDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let workDays = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) workDays++; // Mon-Fri
      cur.setDate(cur.getDate() + 1);
    }

    const eff = selectedType?.code === 'ML' ? calDays : workDays;
    return { workingDays: workDays, calendarDays: calDays, effectiveDuration: eff };
  }, [reqStartDate, reqEndDate, selectedType]);

  // Selected employee's allocation for selected type
  const employeeAllocForType = useMemo(() => {
    if (!reqEmployeeId || !selectedType) return null;
    return allocations?.find(
      (a: any) =>
        String(a.employee_id) === String(reqEmployeeId) &&
        (a.leave_code === selectedType.code || a.leave_type === selectedType.name)
    );
  }, [allocations, reqEmployeeId, selectedType]);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!reqEmployeeId) {
      setFormError('Please select an employee.');
      return;
    }
    if (!reqTypeId) {
      setFormError('Please select a leave type.');
      return;
    }
    if (effectiveDuration <= 0) {
      setFormError('The selected date range contains 0 scheduled working days (falls on weekend). Please select working days.');
      return;
    }

    createRequestMutation.mutate({
      employee_id: Number(reqEmployeeId),
      time_off_type_id: Number(reqTypeId),
      start_date: reqStartDate,
      end_date: reqEndDate,
      reason: reqReason || 'Leave application',
    });
  };

  const handleSubmitAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    setAllocError('');
    if (!allocEmpId) {
      setAllocError('Please select an employee.');
      return;
    }
    if (!allocTypeId) {
      setAllocError('Please select a leave type.');
      return;
    }
    const days = parseFloat(allocAmount);
    if (isNaN(days) || days <= 0) {
      setAllocError('Please enter a valid positive number of days.');
      return;
    }

    createAllocMutation.mutate({
      employee_id: Number(allocEmpId),
      time_off_type_id: Number(allocTypeId),
      allocated_amount: days,
      notes: allocNotes,
    });
  };

  // KPI Calculations
  const pendingCount = requests?.filter((r: any) => r.status === 'PENDING').length || 0;
  const approvedCount = requests?.filter((r: any) => r.status === 'APPROVED').length || 0;
  const refusedCount = requests?.filter((r: any) => r.status === 'REFUSED' || r.status === 'REJECTED').length || 0;

  // 4 Core Category Metrics
  const plAllocated = allocations?.filter((a: any) => a.leave_code === 'PL').reduce((acc: number, a: any) => acc + (a.allocated_days || 0), 0) || 0;
  const plTaken = allocations?.filter((a: any) => a.leave_code === 'PL').reduce((acc: number, a: any) => acc + (a.used_days || 0), 0) || 0;
  const plRemaining = Math.max(0, plAllocated - plTaken);
  const plPending = requests?.filter((r: any) => r.leave_type?.code === 'PL' && r.status === 'PENDING').reduce((acc: number, r: any) => acc + (r.requested_amount || 0), 0) || 0;

  const clAllocated = allocations?.filter((a: any) => a.leave_code === 'CL').reduce((acc: number, a: any) => acc + (a.allocated_days || 0), 0) || 0;
  const clTaken = allocations?.filter((a: any) => a.leave_code === 'CL').reduce((acc: number, a: any) => acc + (a.used_days || 0), 0) || 0;
  const clRemaining = Math.max(0, clAllocated - clTaken);
  const clPending = requests?.filter((r: any) => r.leave_type?.code === 'CL' && r.status === 'PENDING').reduce((acc: number, r: any) => acc + (r.requested_amount || 0), 0) || 0;

  const slAllocated = allocations?.filter((a: any) => a.leave_code === 'SL').reduce((acc: number, a: any) => acc + (a.allocated_days || 0), 0) || 0;
  const slTaken = allocations?.filter((a: any) => a.leave_code === 'SL').reduce((acc: number, a: any) => acc + (a.used_days || 0), 0) || 0;
  const slRemaining = Math.max(0, slAllocated - slTaken);
  const slPending = requests?.filter((r: any) => r.leave_type?.code === 'SL' && r.status === 'PENDING').reduce((acc: number, r: any) => acc + (r.requested_amount || 0), 0) || 0;

  const lopApprovedDays = requests?.filter((r: any) => (r.leave_type?.code === 'UNPAID' || r.category === 'UNPAID') && r.status === 'APPROVED').reduce((acc: number, r: any) => acc + (r.requested_amount || 0), 0) || 0;
  const lopPendingDays = requests?.filter((r: any) => (r.leave_type?.code === 'UNPAID' || r.category === 'UNPAID') && r.status === 'PENDING').reduce((acc: number, r: any) => acc + (r.requested_amount || 0), 0) || 0;

  // Filtered & Sorted Requests (Newest requests at top)
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests
      .filter((r: any) => {
        // Status filter
        if (statusFilter === 'PENDING' && r.status !== 'PENDING') return false;
        if (statusFilter === 'APPROVED' && r.status !== 'APPROVED') return false;
        if (statusFilter === 'REFUSED' && r.status !== 'REFUSED' && r.status !== 'REJECTED') return false;

        // Category filter
        if (categoryFilter === 'PL' && r.leave_type?.code !== 'PL') return false;
        if (categoryFilter === 'CL' && r.leave_type?.code !== 'CL') return false;
        if (categoryFilter === 'SL' && r.leave_type?.code !== 'SL') return false;
        if (categoryFilter === 'UNPAID' && r.leave_type?.code !== 'UNPAID' && r.category !== 'UNPAID') return false;

        // Employee filter
        if (employeeFilter !== 'ALL' && String(r.employee?.id) !== employeeFilter) return false;

        return true;
      })
      .sort((a: any, b: any) => Number(b.id) - Number(a.id));
  }, [requests, statusFilter, categoryFilter, employeeFilter]);

  // Sorted Allocations (Newest allocations at top)
  const sortedAllocations = useMemo(() => {
    if (!allocations) return [];
    return [...allocations].sort((a: any, b: any) => Number(b.id) - Number(a.id));
  }, [allocations]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Time Off & Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Synchronized Indian leave classifications: Paid Leave, Casual Leave, Sick Leave, and Unpaid Leave (LOP).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEmployeeRole && (
            <button
              onClick={() => {
                setAllocError('');
                if (employees && employees.length > 0) setAllocEmpId(String(employees[0].id));
                if (types && types.length > 0) {
                  const paidType = types.find((t: any) => t.is_paid && t.allocation_required && t.code !== 'UNPAID') || types[0];
                  setAllocTypeId(String(paidType.id));
                }
                setIsAllocateModalOpen(true);
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 transition-all flex items-center gap-1.5 border border-border"
            >
              <Layers size={15} /> Allocate Leave Quota
            </button>
          )}
          <button
            onClick={() => {
              setFormError('');
              if (employees && employees.length > 0) setReqEmployeeId(String(employees[0].id));
              if (types && types.length > 0) setReqTypeId(String(types[0].id));
              setReqStartDate(getInitialWorkingDate());
              setReqEndDate(getInitialWorkingDate());
              setIsRequestModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Request Time Off
          </button>
        </div>
      </div>

      {/* 4 Core Classification KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Paid / Privilege Leave (PL) */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === 'PL' ? 'ALL' : 'PL')}
          className={`p-5 rounded-2xl bg-card border cursor-pointer transition-all ${
            categoryFilter === 'PL'
              ? 'border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
              : 'border-border hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Privilege Leave (PL)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
              Paid Leave
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">{plRemaining}</span>
              <span className="text-xs text-muted-foreground ml-1">days avail</span>
            </div>
            <span className="text-xs font-medium text-blue-500">{plTaken} taken</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex justify-between border-t border-border/60 pt-2">
            <span>Quota: {plAllocated}d total</span>
            {plPending > 0 ? <span className="text-amber-500 font-semibold">{plPending}d pending</span> : <span>0 pending</span>}
          </div>
        </div>

        {/* 2. Casual Leave (CL) */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === 'CL' ? 'ALL' : 'CL')}
          className={`p-5 rounded-2xl bg-card border cursor-pointer transition-all ${
            categoryFilter === 'CL'
              ? 'border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
              : 'border-border hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Casual Leave (CL)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
              Paid Leave
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">{clRemaining}</span>
              <span className="text-xs text-muted-foreground ml-1">days avail</span>
            </div>
            <span className="text-xs font-medium text-emerald-500">{clTaken} taken</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex justify-between border-t border-border/60 pt-2">
            <span>Quota: {clAllocated}d total</span>
            {clPending > 0 ? <span className="text-amber-500 font-semibold">{clPending}d pending</span> : <span>0 pending</span>}
          </div>
        </div>

        {/* 3. Sick Leave (SL) */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === 'SL' ? 'ALL' : 'SL')}
          className={`p-5 rounded-2xl bg-card border cursor-pointer transition-all ${
            categoryFilter === 'SL'
              ? 'border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
              : 'border-border hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Sick Leave (SL)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
              Paid Leave
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">{slRemaining}</span>
              <span className="text-xs text-muted-foreground ml-1">days avail</span>
            </div>
            <span className="text-xs font-medium text-amber-500">{slTaken} taken</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex justify-between border-t border-border/60 pt-2">
            <span>Quota: {slAllocated}d total</span>
            {slPending > 0 ? <span className="text-amber-500 font-semibold">{slPending}d pending</span> : <span>0 pending</span>}
          </div>
        </div>

        {/* 4. Unpaid Leave / Loss of Pay (LOP) */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === 'UNPAID' ? 'ALL' : 'UNPAID')}
          className={`p-5 rounded-2xl bg-card border cursor-pointer transition-all ${
            categoryFilter === 'UNPAID'
              ? 'border-rose-500 shadow-md shadow-rose-500/10 ring-1 ring-rose-500'
              : 'border-border hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Unpaid Leave (LOP)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-semibold border border-rose-500/20 flex items-center gap-1">
              <TrendingDown size={10} /> Salary Impact
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-rose-500">{lopApprovedDays}</span>
              <span className="text-xs text-muted-foreground ml-1">days taken</span>
            </div>
            <span className="text-xs font-semibold text-rose-500">Loss of Pay</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex justify-between border-t border-border/60 pt-2">
            <span>No annual quota</span>
            {lopPendingDays > 0 ? <span className="text-amber-500 font-semibold">{lopPendingDays}d pending</span> : <span>0 pending</span>}
          </div>
        </div>
      </div>

      {/* Tab Switcher & Multi-Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'requests' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Leave Requests ({requests?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'allocations' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Leave Allocations ({allocations?.length || 0})
          </button>
        </div>

        {/* Filter Toolbar */}
        {activeTab === 'requests' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
              {[
                { id: 'ALL', label: 'All Types' },
                { id: 'PL', label: 'Privilege (PL)' },
                { id: 'CL', label: 'Casual (CL)' },
                { id: 'SL', label: 'Sick (SL)' },
                { id: 'UNPAID', label: 'Unpaid (LOP)' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    categoryFilter === c.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
              {[
                { id: 'ALL', label: 'All Status' },
                { id: 'PENDING', label: `Pending (${pendingCount})` },
                { id: 'APPROVED', label: `Approved (${approvedCount})` },
                { id: 'REFUSED', label: `Refused (${refusedCount})` },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === st.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Employee Filter */}
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="text-xs p-1.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Employees</option>
              {employees?.map((emp: any) => (
                <option key={emp.id} value={String(emp.id)}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Requests Table */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Reason / Refusal Notes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRequests && filteredRequests.length > 0 ? (
                    filteredRequests.map((r: any) => {
                      const isUnpaid = r.leave_type?.code === 'UNPAID' || r.category === 'UNPAID';
                      return (
                        <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {r.employee?.name}
                            <div className="text-xs text-muted-foreground">
                              {r.employee?.code} • {r.employee?.department}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-xs" style={{ color: r.leave_type?.color_code || '#3B82F6' }}>
                              {r.leave_type?.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isUnpaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                <TrendingDown size={10} /> Loss of Pay
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <ShieldCheck size={10} /> Paid Leave
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                            {r.start_date} <span className="text-foreground">to</span> {r.end_date}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {r.number_of_days} {r.number_of_days === 1 ? 'day' : 'days'}
                          </td>
                          <td className="py-3.5 px-4 text-xs max-w-xs">
                            <div className="text-foreground truncate">{r.reason || '--'}</div>
                            {r.refusal_reason && (
                              <div className="text-[11px] text-rose-500 italic mt-0.5">
                                Refusal: {r.refusal_reason}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {r.status === 'PENDING' ? (
                              !isEmployeeRole ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => approveMutation.mutate(Number(r.id))}
                                    disabled={approveMutation.isPending}
                                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-emerald-500/20"
                                  >
                                    <CheckCircle2 size={13} /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectClick(Number(r.id))}
                                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-rose-500/20"
                                  >
                                    <XCircle size={13} /> Refuse
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-amber-500 font-medium flex items-center justify-end gap-1">
                                  <Clock size={13} /> Under Review
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground font-medium flex items-center justify-end gap-1">
                                <Check size={13} className="text-muted-foreground" /> Decided
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                        No leave requests found matching the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Allocations Table */}
      {activeTab === 'allocations' && (
        <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Allocated Quota</th>
                  <th className="py-3 px-4">Used / Taken</th>
                  <th className="py-3 px-4">Available Balance</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedAllocations?.map((a: any) => (
                  <tr key={a.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {a.employee_name}
                      <div className="text-xs text-muted-foreground font-mono">{a.employee_code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-xs" style={{ color: a.color_code || '#3B82F6' }}>
                      {a.leave_type}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {a.category || 'PAID'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">{a.allocated_days} days</td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">{a.used_days} days</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-500 text-sm">
                        {a.remaining_days} days left
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{a.notes || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUEST TIME OFF MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <CalendarDays size={20} />
                <h3 className="text-foreground">Request Time Off</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Employee Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Employee</label>
                <select
                  value={reqEmployeeId}
                  onChange={(e) => setReqEmployeeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                >
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.department?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Leave Classification</label>
                <select
                  value={reqTypeId}
                  onChange={(e) => setReqTypeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  {types?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.is_paid ? (t.allocation_required ? 'Paid Quota' : 'Paid Statutory') : 'Unpaid LOP'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Balance / Warning Preview Card */}
              {selectedType && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    !selectedType.is_paid
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      : selectedType.allocation_required
                      ? 'bg-primary/5 border-primary/20 text-foreground'
                      : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{selectedType.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-current">
                      {selectedType.is_paid
                        ? selectedType.allocation_required
                          ? 'Paid Annual Quota'
                          : 'Statutory Paid Policy'
                        : 'Loss of Pay (LOP)'}
                    </span>
                  </div>

                  {selectedType.is_paid ? (
                    selectedType.allocation_required ? (
                      <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>
                          Available Quota Balance:{' '}
                          <strong className="text-emerald-500">
                            {employeeAllocForType ? employeeAllocForType.remaining_days : 0} days
                          </strong>
                        </span>
                        <span>
                          After Request:{' '}
                          <strong
                            className={
                              employeeAllocForType && employeeAllocForType.remaining_days >= effectiveDuration
                                ? 'text-foreground font-bold'
                                : 'text-rose-500 font-bold'
                            }
                          >
                            {employeeAllocForType
                              ? Math.max(0, employeeAllocForType.remaining_days - effectiveDuration)
                              : 0}{' '}
                            days
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-purple-300 pt-1 border-t border-purple-500/20 flex items-center gap-1">
                        <ShieldCheck size={13} className="text-purple-400" />
                        <span>Statutory Benefit: <strong>26 weeks continuous benefit under Indian Maternity Act (No Quota Allocation Needed)</strong>.</span>
                      </div>
                    )
                  ) : (
                    <p className="text-[11px] text-rose-500 pt-1 border-t border-rose-500/20 flex items-center gap-1">
                      <TrendingDown size={13} />
                      Approved LOP will reduce payable salary ({effectiveDuration} days deducted) in the monthly payroll.
                    </p>
                  )}
                </div>
              )}

              {/* Date Range & Calculated Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={reqStartDate}
                    onChange={(e) => setReqStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">End Date</label>
                  <input
                    type="date"
                    value={reqEndDate}
                    onChange={(e) => setReqEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
              </div>

              {/* Duration Indicator with Weekend awareness */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Clock size={15} className="text-primary" />
                    {selectedType?.code === 'ML'
                      ? 'Calculated Duration (Calendar Days):'
                      : 'Calculated Duration (Working Days):'}
                  </span>
                  <span className="font-bold text-foreground font-mono text-sm">
                    {effectiveDuration} {effectiveDuration === 1 ? 'day' : 'days'}
                  </span>
                </div>
                {selectedType?.code !== 'ML' && workingDays === 0 && calendarDays > 0 && (
                  <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1 pt-1">
                    <AlertCircle size={13} />
                    Selected dates ({calendarDays} calendar {calendarDays === 1 ? 'day' : 'days'}) fall entirely on non-working weekend days. Please select working days.
                  </p>
                )}
                {selectedType?.code !== 'ML' && workingDays > 0 && calendarDays > workingDays && (
                  <p className="text-[11px] text-muted-foreground">
                    Includes {workingDays} working days (excluding {calendarDays - workingDays} weekend days).
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="e.g. Medical checkup / Family commitment..."
                  className="w-full text-xs p-3 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRequestMutation.isPending || effectiveDuration <= 0}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createRequestMutation.isPending ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATE LEAVE MODAL (FOR HR / ADMIN) */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Layers size={20} />
                <h3 className="text-foreground">Allocate Annual Leave Quota</h3>
              </div>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {allocError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {allocError}
              </div>
            )}

            <form onSubmit={handleSubmitAllocation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Employee</label>
                <select
                  value={allocEmpId}
                  onChange={(e) => setAllocEmpId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                >
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.department?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Paid Leave Classification</label>
                <select
                  value={allocTypeId}
                  onChange={(e) => setAllocTypeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  {types
                    ?.filter((t: any) => t.is_paid && t.allocation_required && t.code !== 'UNPAID')
                    .map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Annual Entitlement (Days)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="60"
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes / Policy Reference</label>
                <input
                  type="text"
                  value={allocNotes}
                  onChange={(e) => setAllocNotes(e.target.value)}
                  placeholder="e.g. FY 2026-27 statutory annual leave allocation"
                  className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAllocMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-1"
                >
                  {createAllocMutation.isPending ? 'Granting...' : 'Grant Leave Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION / REFUSAL MODAL */}
      {rejectingId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertCircle size={20} />
              <h3 className="font-bold text-base text-foreground">Refuse Leave Request</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Please enter the reason for declining this leave request. The employee will be notified and any consumed balance restored.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason for Refusal</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Critical release sprint deadline, insufficient shift coverage..."
                className="w-full text-xs p-3 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="px-4 py-2 text-xs font-semibold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-1 shadow-sm"
              >
                <XCircle size={14} /> Confirm Refusal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
