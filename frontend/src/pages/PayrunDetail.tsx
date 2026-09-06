import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayrunDetail, computePayrun, validatePayrun, disbursePayrun } from '../lib/api';
import { formatINR, getStatusBadgeClass } from '../lib/formatters';
import {
  ArrowLeft,
  ChevronRight,
  Zap,
  CheckCircle2,
  IndianRupee,
  Sparkles,
  RefreshCw,
  Users,
  Calendar,
} from 'lucide-react';

export default function PayrunDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: payrun, isLoading, error } = useQuery({
    queryKey: ['payrun-detail', id],
    queryFn: () => getPayrunDetail(id || ''),
    enabled: !!id,
  });

  // Compute Mutation
  const computeMutation = useMutation({
    mutationFn: () => computePayrun(id || ''),
    onSuccess: (data: any) => {
      setToastMessage(data.message || 'Payrun calculation completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['payrun-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setToastMessage(`Error computing: ${err.message || 'Compute failed'}`);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  // Validate Mutation
  const validateMutation = useMutation({
    mutationFn: () => validatePayrun(id || ''),
    onSuccess: (data: any) => {
      setToastMessage(data.message || 'Payrun validated and approved for payment.');
      queryClient.invalidateQueries({ queryKey: ['payrun-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setToastMessage(`Error: ${err.message || 'Validation failed'}`);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  // Disburse Mutation
  const disburseMutation = useMutation({
    mutationFn: () => disbursePayrun(id || ''),
    onSuccess: (data: any) => {
      setToastMessage(data.message || 'Payrun marked as disbursed (PAID).');
      queryClient.invalidateQueries({ queryKey: ['payrun-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setToastMessage(`Error: ${err.message || 'Disbursal failed'}`);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !payrun) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-semibold">Failed to load payrun details.</p>
        <Link to="/payroll/payruns" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Payruns
        </Link>
      </div>
    );
  }

  const isDraft = payrun.status === 'DRAFT';
  const isComputed = payrun.status === 'COMPUTED';
  const isValidated = payrun.status === 'VALIDATED';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button & Top Header Bar */}
      <div>
        <Link
          to="/payroll/payruns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Payruns
        </Link>

        {/* Global Toast Feedback Banner */}
        {toastMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-background border border-primary/40 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2.5 text-foreground font-semibold">
              <Sparkles size={16} className="text-primary shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        <div className="p-6 rounded-3xl bg-card border border-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{payrun.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(payrun.status)}`}>
                {payrun.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Calendar size={13} className="text-primary" /> Period: <strong>{payrun.date_start}</strong> to{' '}
              <strong>{payrun.date_end}</strong> • <Users size={13} className="text-primary" />{' '}
              {payrun.payslips?.length || 0} Staff Payslips
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* Financial Totals */}
            <div className="grid grid-cols-3 gap-4 text-right bg-background p-4 rounded-2xl border border-border w-full sm:w-auto">
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">Total Gross</span>
                <span className="text-sm font-semibold text-foreground">{formatINR(payrun.total_gross)}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">Deductions</span>
                <span className="text-sm font-semibold text-rose-500">{formatINR(payrun.total_deduction)}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">Net Payout</span>
                <span className="text-base font-extrabold text-emerald-500">{formatINR(payrun.total_net)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {(isDraft || isComputed) && (
                <button
                  onClick={() => computeMutation.mutate()}
                  disabled={computeMutation.isPending}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-70"
                >
                  {computeMutation.isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  <span>{computeMutation.isPending ? 'Computing...' : isDraft ? 'Compute Batch' : 'Recompute'}</span>
                </button>
              )}

              {isComputed && (
                <button
                  onClick={() => validateMutation.mutate()}
                  disabled={validateMutation.isPending}
                  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-70"
                >
                  {validateMutation.isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Validate & Approve</span>
                </button>
              )}

              {isValidated && (
                <button
                  onClick={() => disburseMutation.mutate()}
                  disabled={disburseMutation.isPending}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-70"
                >
                  {disburseMutation.isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <IndianRupee size={14} />
                  )}
                  <span>Mark Disbursed (PAID)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="p-6 rounded-3xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">
            Itemized Staff Payslips ({payrun.payslips?.length || 0})
          </h3>
          <span className="text-xs text-muted-foreground font-medium">
            Calculated with Indian statutory rules & attendance LOP deductions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Payslip #</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Basic Pay</th>
                <th className="py-3 px-4">Gross Wage</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payrun.payslips && payrun.payslips.length > 0 ? (
                payrun.payslips.map((ps: any) => (
                  <tr key={ps.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                      {ps.payslip_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {ps.employee_name}
                      <div className="text-xs text-muted-foreground font-mono">{ps.employee_code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground font-medium">{ps.department}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{formatINR(ps.basic_wage)}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-foreground font-semibold">
                      {formatINR(ps.gross_wage)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-rose-500 font-semibold">
                      -{formatINR(ps.total_deductions)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-500">{formatINR(ps.net_wage)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/payroll/payslips/${ps.id}`}
                        className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        Slip <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <p>No payslips generated for this payrun yet.</p>
                      <button
                        onClick={() => computeMutation.mutate()}
                        disabled={computeMutation.isPending}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Zap size={14} /> Compute Batch Payslips Now
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

