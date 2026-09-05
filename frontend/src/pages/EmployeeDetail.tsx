import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeDetail } from '../lib/api';
import { formatINR, formatINRPerAnnum, getStatusBadgeClass } from '../lib/formatters';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function EmployeeDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'attendance' | 'leaves' | 'payslips'>('overview');

  const { data: emp, isLoading, error } = useQuery({
    queryKey: ['employee-detail', id],
    queryFn: () => getEmployeeDetail(id || ''),
    enabled: !!id,
  });

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
          Leave Balances ({emp.leave_allocations?.length || 0})
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
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={18} className="text-primary" /> Employment Details
            </h3>
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
                <span className="text-muted-foreground">Employee Type</span>
                <span className="font-medium text-foreground">{emp.employee_type?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Reporting Manager</span>
                <span className="font-medium text-foreground">{emp.manager?.full_name || 'Executive Level'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Date of Joining</span>
                <span className="font-medium text-foreground">{emp.date_of_joining || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Personal & Statutory Info */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" /> Statutory & Compliance
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">EPF / PF Registration</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1"><CheckCircle2 size={14}/> 12% Enrolled</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Professional Tax (PT)</span>
                <span className="font-medium text-foreground">₹200/mo (Applicable State)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Income Tax TDS</span>
                <span className="font-medium text-foreground">Section 192 Standard</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Work Location Hub</span>
                <span className="font-medium text-foreground">{emp.work_location}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="space-y-6">
          {/* Active Contract */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-base font-semibold text-foreground">Active INR Contract</h3>
            {emp.contracts?.map((c: any) => (
              <div key={c.id} className="p-4 rounded-xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-foreground">{c.contract_reference}</div>
                  <div className="text-xs text-muted-foreground">Period: {c.start_date} to {c.end_date || 'Indefinite'}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-emerald-500">{formatINR(c.wage)} / month</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bank Accounts */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> Indian Bank Accounts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emp.bank_accounts?.map((b: any) => (
                <div key={b.id} className="p-4 rounded-xl bg-background border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{b.bank_name}</span>
                    {b.is_primary && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Primary Salary A/C
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Account: <span className="font-mono text-foreground font-medium">{b.account_number}</span></div>
                  <div className="text-xs text-muted-foreground">IFSC Code: <span className="font-mono text-foreground font-medium">{b.ifsc_code}</span></div>
                  <div className="text-xs text-muted-foreground">Beneficiary: <span className="text-foreground">{b.account_holder_name}</span></div>
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

      {activeTab === 'leaves' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="text-base font-semibold text-foreground">Leave Balances (FY 2026-27)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {emp.leave_allocations?.map((l: any) => (
              <div key={l.id} className="p-4 rounded-xl bg-background border border-border space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">{l.type_name}</span>
                <div className="text-2xl font-bold text-foreground">{l.remaining_days} <span className="text-xs text-muted-foreground font-normal">days left</span></div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(l.remaining_days / (l.allocated_days || 1)) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Used: {l.used_days}d</span>
                  <span>Total: {l.allocated_days}d</span>
                </div>
              </div>
            ))}
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
    </div>
  );
}
