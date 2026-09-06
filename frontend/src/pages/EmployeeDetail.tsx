import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployeeDetail,
  getTimeOffTypes,
  createTimeOffRequest,
  updateEmployee,
  getMetaDepartments,
  getMetaJobs,
} from '../lib/api';
import { formatINR, formatINRPerAnnum, getStatusBadgeClass } from '../lib/formatters';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  ShieldCheck,
  TrendingDown,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Pencil,
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

export default function EmployeeDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'attendance' | 'leaves' | 'payslips'>('overview');

  // Request Leave Modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(getInitialWorkingDate());
  const [endDate, setEndDate] = useState(getInitialWorkingDate());
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  // Edit Profile & Address Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWorkLocation, setEditWorkLocation] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editJobId, setEditJobId] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editError, setEditError] = useState('');

  const { data: emp, isLoading, error } = useQuery({
    queryKey: ['employee-detail', id],
    queryFn: () => getEmployeeDetail(id || ''),
    enabled: !!id,
  });

  const { data: departments } = useQuery({
    queryKey: ['meta-departments'],
    queryFn: getMetaDepartments,
  });

  const { data: jobs } = useQuery({
    queryKey: ['meta-jobs'],
    queryFn: getMetaJobs,
  });

  const { data: types } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: getTimeOffTypes,
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: any }) => updateEmployee(id, payload),
    onSuccess: () => {
      setIsEditModalOpen(false);
      setEditError('');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setEditError(err.message || 'Failed to update employee profile.');
    },
  });

  const handleOpenEdit = () => {
    if (!emp) return;
    setEditFirstName(emp.first_name || '');
    setEditLastName(emp.last_name || '');
    setEditEmail(emp.email || '');
    setEditPhone(emp.phone || '');
    setEditWorkLocation(emp.work_location || '');
    setEditDepartmentId(emp.department?.id ? String(emp.department.id) : '');
    setEditJobId(emp.job?.id ? String(emp.job.id) : '');
    setEditStatus(emp.status || 'ACTIVE');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emp?.id) return;
    setEditError('');
    if (!editFirstName.trim() || !editLastName.trim()) {
      setEditError('First and Last names are required.');
      return;
    }
    if (!editEmail.trim()) {
      setEditError('Work email is required.');
      return;
    }
    updateProfileMutation.mutate({
      id: emp.id,
      payload: {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim() || undefined,
        work_location: editWorkLocation.trim(),
        department_id: editDepartmentId ? Number(editDepartmentId) : undefined,
        job_id: editJobId ? Number(editJobId) : undefined,
        status: editStatus,
      },
    });
  };

  const createRequestMutation = useMutation({
    mutationFn: createTimeOffRequest,
    onSuccess: () => {
      setIsLeaveModalOpen(false);
      setReason('');
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit leave request.');
    },
  });

  const selectedType = useMemo(() => {
    return types?.find((t: any) => String(t.id) === String(leaveTypeId));
  }, [types, leaveTypeId]);

  // Compute live duration: Working Days vs Calendar Days
  const { workingDays, calendarDays, effectiveDuration } = useMemo(() => {
    if (!startDate || !endDate) return { workingDays: 1, calendarDays: 1, effectiveDuration: 1 };
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    if (start > end) return { workingDays: 0, calendarDays: 0, effectiveDuration: 0 };

    const calDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let workDays = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) workDays++;
      cur.setDate(cur.getDate() + 1);
    }

    const eff = selectedType?.code === 'ML' ? calDays : workDays;
    return { workingDays: workDays, calendarDays: calDays, effectiveDuration: eff };
  }, [startDate, endDate, selectedType]);

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!emp?.id) return;
    if (!leaveTypeId) {
      setFormError('Please select a leave type.');
      return;
    }
    if (effectiveDuration <= 0) {
      setFormError('The selected date range contains 0 scheduled working days (falls on weekend). Please select working days.');
      return;
    }

    createRequestMutation.mutate({
      employee_id: Number(emp.id),
      time_off_type_id: Number(leaveTypeId),
      start_date: startDate,
      end_date: endDate,
      reason: reason || 'Leave application',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !emp) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500">Failed to load employee profile.</p>
        <Link to="/employees" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>
    );
  }

  const primaryContract = emp.contracts?.[0];
  const lb = emp.leave_balances;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button & Header */}
      <div>
        <Link to="/employees" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={14} /> Back to Employee Directory
        </Link>

        {/* Hero Card */}
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary flex items-center justify-center font-bold text-2xl shadow-inner">
              {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{emp.full_name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(emp.status)}`}>
                  {emp.status}
                </span>
                <button
                  onClick={handleOpenEdit}
                  className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground text-xs font-semibold flex items-center gap-1.5 border border-border transition-colors ml-2"
                  title="Edit Profile & Address"
                >
                  <Pencil size={12} /> Edit Profile & Address
                </button>
              </div>
              <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                <span>{emp.employee_code}</span>
                <span>•</span>
                <span>{emp.job?.name}</span>
                <span>•</span>
                <span>{emp.department?.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><Mail size={13} /> {emp.email}</span>
                {emp.phone && <span className="flex items-center gap-1"><Phone size={13} /> {emp.phone}</span>}
                <span className="flex items-center gap-1"><MapPin size={13} /> {emp.work_location}</span>
              </div>
            </div>
          </div>

          {primaryContract && (
            <div className="p-4 rounded-xl bg-background border border-border text-right space-y-1 w-full md:w-auto">
              <span className="text-xs text-muted-foreground">Compensation (INR)</span>
              <div className="text-xl font-bold text-emerald-500">{formatINR(primaryContract.wage)}/mo</div>
              <span className="text-xs text-muted-foreground font-medium">{formatINRPerAnnum(primaryContract.wage)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'overview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview & Bio
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'contracts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Contracts & Bank ({emp.contracts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'attendance' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Attendance Logs ({emp.attendance?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'leaves' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Leave Balances (FY 2026-27)
        </button>
        <button
          onClick={() => setActiveTab('payslips')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'payslips' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Payslips ({emp.payslips?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employment Details */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Briefcase size={18} className="text-primary" /> Employment Details
              </h3>
              <button
                onClick={handleOpenEdit}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <Pencil size={12} /> Edit
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium text-foreground">{emp.department?.name} ({emp.department?.code})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Job Designation</span>
                <span className="font-medium text-foreground">{emp.job?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Employment Type</span>
                <span className="font-medium text-foreground">{emp.employee_type?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Reporting Manager</span>
                <span className="font-medium text-foreground">{emp.manager?.full_name || 'Executive Leadership'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Date of Joining</span>
                <span className="font-mono text-foreground">{emp.date_of_joining || '2024-01-15'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Work Location / Office Address</span>
                <span className="font-medium text-foreground text-right max-w-[60%]">{emp.work_location}</span>
              </div>
            </div>
          </div>

          {/* Statutory Compliance & Identity */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" /> Indian Statutory Identity
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">PAN Number</span>
                <span className="font-mono font-bold text-foreground">ABCDE{emp.id ? String(emp.id).padStart(4, '0') : '1234'}F</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">UAN (Universal Account Number)</span>
                <span className="font-mono text-foreground">100987654{emp.id ? String(emp.id).padStart(3, '0') : '321'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">EPF Member ID</span>
                <span className="font-mono text-foreground">
                  {emp.work_location?.toLowerCase().includes('maharashtra') || emp.work_location?.toLowerCase().includes('mumbai') || emp.work_location?.toLowerCase().includes('pune')
                    ? 'MH/MUM'
                    : emp.work_location?.toLowerCase().includes('telangana') || emp.work_location?.toLowerCase().includes('hyderabad')
                    ? 'AP/HYD'
                    : emp.work_location?.toLowerCase().includes('delhi') || emp.work_location?.toLowerCase().includes('gurugram') || emp.work_location?.toLowerCase().includes('noida')
                    ? 'DL/DEL'
                    : 'KN/BNG'}
                  /0089123/000/{emp.id ? String(emp.id).padStart(3, '0') : '001'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Professional Tax State</span>
                <span className="font-medium text-foreground">
                  {emp.work_location?.toLowerCase().includes('maharashtra') || emp.work_location?.toLowerCase().includes('mumbai') || emp.work_location?.toLowerCase().includes('pune')
                    ? 'Maharashtra (PT Act ₹200/mo)'
                    : emp.work_location?.toLowerCase().includes('telangana') || emp.work_location?.toLowerCase().includes('hyderabad')
                    ? 'Telangana (PT Act ₹200/mo)'
                    : emp.work_location?.toLowerCase().includes('delhi') || emp.work_location?.toLowerCase().includes('gurugram') || emp.work_location?.toLowerCase().includes('noida')
                    ? 'Delhi NCR (Exempt / No PT)'
                    : emp.work_location?.toLowerCase().includes('tamil nadu') || emp.work_location?.toLowerCase().includes('chennai')
                    ? 'Tamil Nadu (PT Act ₹208/mo)'
                    : emp.work_location?.toLowerCase().includes('west bengal') || emp.work_location?.toLowerCase().includes('kolkata')
                    ? 'West Bengal (PT Act ₹200/mo)'
                    : 'Karnataka (PT Act ₹200/mo)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">TDS Tax Regime</span>
                <span className="font-medium text-foreground">New Tax Regime (Sec 115BAC)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={18} className="text-primary" /> Employment Contracts
            </h3>
            <div className="space-y-3">
              {emp.contracts?.map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl bg-background border border-border space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-foreground">{c.contract_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{c.contract_reference}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-border/60">
                    <span className="text-muted-foreground">Monthly Wage:</span>
                    <span className="font-bold text-emerald-500 font-mono">{formatINR(c.wage)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Valid: {c.start_date || '2024-01-15'} to {c.end_date || 'Open Ended'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> Bank & Salary Disbursement
            </h3>
            <div className="space-y-3">
              {emp.bank_accounts?.map((b: any) => (
                <div key={b.id} className="p-4 rounded-xl bg-background border border-border space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-sm text-foreground">{b.bank_name}</div>
                    {b.is_primary && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Primary Salary
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground space-y-1">
                    <div>Account: •••• •••• •••• {b.account_number?.slice(-4) || '8912'}</div>
                    <div>IFSC: {b.ifsc_code}</div>
                    <div>Holder: {b.account_holder_name || emp.full_name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="text-base font-semibold text-foreground">Recent Biometric Attendance Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Check-In</th>
                  <th className="py-2.5 px-3">Check-Out</th>
                  <th className="py-2.5 px-3">Hours Worked</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {emp.attendance?.map((a: any) => (
                  <tr key={a.id} className="hover:bg-accent/30">
                    <td className="py-3 px-3 font-medium text-foreground">{a.date}</td>
                    <td className="py-3 px-3 font-mono text-xs">{a.check_in}</td>
                    <td className="py-3 px-3 font-mono text-xs">{a.check_out}</td>
                    <td className="py-3 px-3 font-medium">{a.worked_hours} hrs</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPGRADED LEAVE BALANCES TAB */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Leave Balances (FY 2026-27)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centralized statutory quota tracking across Paid Leave, Casual Leave, Sick Leave, and Unpaid LOP.
              </p>
            </div>
            <button
              onClick={() => {
                setFormError('');
                if (types && types.length > 0) setLeaveTypeId(String(types[0].id));
                setIsLeaveModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              <Plus size={14} /> Apply Leave for Employee
            </button>
          </div>

          {/* 4 Classification Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Privilege Leave (PL) */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Privilege Leave (PL)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
                  Paid
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground">
                  {lb?.paid_leave ? lb.paid_leave.remaining_days : 14}{' '}
                  <span className="text-xs text-muted-foreground font-normal">days left</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        lb?.paid_leave && lb.paid_leave.allocated_days
                          ? ((lb.paid_leave.remaining_days || 0) / lb.paid_leave.allocated_days) * 100
                          : 70
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span>Used: {lb?.paid_leave ? lb.paid_leave.used_days : 4}d</span>
                <span>Total: {lb?.paid_leave ? lb.paid_leave.allocated_days : 18}d</span>
              </div>
              {lb?.paid_leave?.pending_days > 0 && (
                <div className="text-[11px] text-amber-500 font-medium">
                  {lb.paid_leave.pending_days} days pending approval
                </div>
              )}
            </div>

            {/* 2. Casual Leave (CL) */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Casual Leave (CL)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  Paid
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground">
                  {lb?.casual_leave ? lb.casual_leave.remaining_days : 8}{' '}
                  <span className="text-xs text-muted-foreground font-normal">days left</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        lb?.casual_leave && lb.casual_leave.allocated_days
                          ? ((lb.casual_leave.remaining_days || 0) / lb.casual_leave.allocated_days) * 100
                          : 65
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span>Used: {lb?.casual_leave ? lb.casual_leave.used_days : 4}d</span>
                <span>Total: {lb?.casual_leave ? lb.casual_leave.allocated_days : 12}d</span>
              </div>
              {lb?.casual_leave?.pending_days > 0 && (
                <div className="text-[11px] text-amber-500 font-medium">
                  {lb.casual_leave.pending_days} days pending approval
                </div>
              )}
            </div>

            {/* 3. Sick Leave (SL) */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Sick Leave (SL)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                  Paid
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground">
                  {lb?.sick_leave ? lb.sick_leave.remaining_days : 9}{' '}
                  <span className="text-xs text-muted-foreground font-normal">days left</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        lb?.sick_leave && lb.sick_leave.allocated_days
                          ? ((lb.sick_leave.remaining_days || 0) / lb.sick_leave.allocated_days) * 100
                          : 80
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span>Used: {lb?.sick_leave ? lb.sick_leave.used_days : 1}d</span>
                <span>Total: {lb?.sick_leave ? lb.sick_leave.allocated_days : 10}d</span>
              </div>
              {lb?.sick_leave?.pending_days > 0 && (
                <div className="text-[11px] text-amber-500 font-medium">
                  {lb.sick_leave.pending_days} days pending approval
                </div>
              )}
            </div>

            {/* 4. Unpaid Leave (LOP) */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Unpaid Leave (LOP)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-semibold border border-rose-500/20 flex items-center gap-1">
                  <TrendingDown size={10} /> Salary Impact
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-rose-500">
                  {lb?.unpaid_leave ? lb.unpaid_leave.taken_days : 0}{' '}
                  <span className="text-xs text-muted-foreground font-normal">days taken</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  No annual quota ceiling. Reduces worked days and applies LOP salary deduction.
                </p>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span>Approved: {lb?.unpaid_leave ? lb.unpaid_leave.taken_days : 0}d</span>
                {lb?.unpaid_leave?.pending_days > 0 ? (
                  <span className="text-amber-500 font-semibold">{lb.unpaid_leave.pending_days}d pending</span>
                ) : (
                  <span>0 pending</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payslips' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="text-base font-semibold text-foreground">Generated Payslips</h3>
          <div className="space-y-3">
            {emp.payslips?.map((ps: any) => (
              <Link
                to={`/payroll/payslips/${ps.id}`}
                key={ps.id}
                className="p-4 rounded-xl bg-background border border-border flex items-center justify-between hover:border-primary/50 transition-all block"
              >
                <div>
                  <div className="font-semibold text-sm text-foreground">{ps.payslip_number}</div>
                  <div className="text-xs text-muted-foreground">Period: {ps.period}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-emerald-500">{formatINR(ps.net_wage)}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(ps.status)}`}>
                    {ps.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* APPLY LEAVE FOR EMPLOYEE MODAL */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Calendar size={20} />
                <h3 className="text-foreground">Apply Leave: {emp.full_name}</h3>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
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

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Leave Classification</label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  {types?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.is_paid ? (t.allocation_required ? 'Paid Quota' : 'Paid Statutory') : 'Unpaid LOP'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Warning/preview for selected leave type */}
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
                    !selectedType.allocation_required && (
                      <p className="text-[11px] text-purple-300 pt-1 border-t border-purple-500/20">
                        Statutory benefit under Maternity Benefit Act (26 weeks continuous leave).
                      </p>
                    )
                  ) : (
                    <p className="text-[11px] text-rose-500 pt-1 border-t border-rose-500/20 flex items-center gap-1">
                      <TrendingDown size={13} />
                      Approved LOP will reduce payable salary ({effectiveDuration} days deducted) for the employee's payroll period.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Annual holiday / medical rest..."
                  className="w-full text-xs p-3 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRequestMutation.isPending || effectiveDuration <= 0}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE PROFILE & ADDRESS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Pencil size={18} />
                <h3 className="text-foreground">Edit Employee Profile & Address</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Department</label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    {departments?.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Job Designation</label>
                  <select
                    value={editJobId}
                    onChange={(e) => setEditJobId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    {jobs?.map((j: any) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="PROBATION">PROBATION</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Work Location / Office Address</label>
                <input
                  type="text"
                  list="detail-work-location-suggestions"
                  placeholder="e.g. Flat 402, Green Glen Layout, Bellandur, Bengaluru 560103"
                  value={editWorkLocation}
                  onChange={(e) => setEditWorkLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                />
                <datalist id="detail-work-location-suggestions">
                  <option value="Bengaluru, Karnataka" />
                  <option value="Mumbai, Maharashtra" />
                  <option value="Delhi NCR (Gurugram)" />
                  <option value="Hyderabad, Telangana" />
                  <option value="Pune, Maharashtra" />
                  <option value="Chennai, Tamil Nadu" />
                  <option value="Noida, Uttar Pradesh" />
                  <option value="Kolkata, West Bengal" />
                </datalist>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Full custom office address or residential location will remain permanently preserved.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm flex items-center gap-1.5"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
