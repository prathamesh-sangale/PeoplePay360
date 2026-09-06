import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPayruns,
  computePayrun,
  validatePayrun,
  disbursePayrun,
  createPayrun,
  quickBatchComputePayrun,
} from '../lib/api';
import { formatINR, getStatusBadgeClass } from '../lib/formatters';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileText,
  ChevronRight,
  Zap,
  Plus,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  IndianRupee,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function Payruns() {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [computingId, setComputingId] = useState<string | number | null>(null);
  const [validatingId, setValidatingId] = useState<string | number | null>(null);
  const [disbursingId, setDisbursingId] = useState<string | number | null>(null);

  // Form State for New Batch Payrun
  const [batchName, setBatchName] = useState('October 2026 Regular Monthly Payrun');
  const [periodStart, setPeriodStart] = useState('2026-10-01');
  const [periodEnd, setPeriodEnd] = useState('2026-10-31');
  const [batchNotes, setBatchNotes] = useState('Monthly corporate disbursal via HDFC CMS batch.');
  const [autoCompute, setAutoCompute] = useState(true);
  const [formError, setFormError] = useState('');

  const { data: payruns, isLoading } = useQuery({
    queryKey: ['payruns'],
    queryFn: getPayruns,
  });

  // Compute Mutation
  const computeMutation = useMutation({
    mutationFn: (id: string | number) => computePayrun(id),
    onSuccess: (data: any) => {
      setComputingId(null);
      setToastMessage(data.message || 'Batch payrun calculated successfully!');
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun-detail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setComputingId(null);
      setToastMessage(`Error computing payrun: ${err.message || 'Calculation failed'}`);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  // Quick Batch Compute Mutation
  const quickBatchMutation = useMutation({
    mutationFn: quickBatchComputePayrun,
    onSuccess: (data: any) => {
      setToastMessage(data.message || 'Quick batch payrun calculated successfully!');
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setToastMessage(`Error: ${err.message || 'Quick batch compute failed'}`);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  // Validate Mutation
  const validateMutation = useMutation({
    mutationFn: (id: string | number) => validatePayrun(id),
    onSuccess: (data: any) => {
      setValidatingId(null);
      setToastMessage(data.message || 'Payrun validated and approved for payment.');
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun-detail'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setValidatingId(null);
      setToastMessage(`Error: ${err.message || 'Validation failed'}`);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  // Disburse Mutation
  const disburseMutation = useMutation({
    mutationFn: (id: string | number) => disbursePayrun(id),
    onSuccess: (data: any) => {
      setDisbursingId(null);
      setToastMessage(data.message || 'Payrun marked as disbursed (PAID).');
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun-detail'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setDisbursingId(null);
      setToastMessage(`Error: ${err.message || 'Disbursal update failed'}`);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  // Create Payrun Mutation
  const createMutation = useMutation({
    mutationFn: createPayrun,
    onSuccess: (data: any) => {
      setIsNewModalOpen(false);
      setFormError('');
      setToastMessage(data.message || 'New payrun batch created and computed successfully!');
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create payrun batch.');
    },
  });

  const handleCompute = (id: string | number) => {
    setComputingId(id);
    computeMutation.mutate(id);
  };

  const handleValidate = (id: string | number) => {
    setValidatingId(id);
    validateMutation.mutate(id);
  };

  const handleDisburse = (id: string | number) => {
    setDisbursingId(id);
    disburseMutation.mutate(id);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!batchName.trim()) {
      setFormError('Please enter a payrun batch name.');
      return;
    }
    createMutation.mutate({
      name: batchName.trim(),
      period_start: periodStart,
      period_end: periodEnd,
      notes: batchNotes.trim() || undefined,
      auto_compute: autoCompute,
    });
  };

  // Aggregated totals across all active payruns
  const totalVolumeGross = payruns?.reduce((acc: number, p: any) => acc + (p.total_gross || 0), 0) || 0;
  const totalVolumeNet = payruns?.reduce((acc: number, p: any) => acc + (p.total_net || 0), 0) || 0;
  const totalVolumeDeductions = payruns?.reduce((acc: number, p: any) => acc + (p.total_deduction || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <IndianRupee size={13} />
              Payroll Department Batch Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Monthly Payruns & Batch Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Execute batch payroll calculations, generate itemized payslips, and process Indian statutory deductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => quickBatchMutation.mutate()}
            disabled={quickBatchMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70"
          >
            {quickBatchMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            <span>{quickBatchMutation.isPending ? 'Computing...' : 'Compute Batch Payrun'}</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={14} /> New Payrun Batch
          </button>
        </div>
      </div>

      {/* Global Toast Feedback Banner */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-background border border-primary/40 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5 text-foreground font-semibold">
            <Sparkles size={16} className="text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 4 Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Batches</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">{payruns?.length || 0}</div>
          <span className="text-xs text-muted-foreground mt-1 block">Configured pay cycles</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cumulative Gross</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-foreground">{formatINR(totalVolumeGross)}</div>
          <span className="text-xs text-muted-foreground mt-1 block">Total gross compensation volume</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Statutory Deductions</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-rose-500">{formatINR(totalVolumeDeductions)}</div>
          <span className="text-xs text-muted-foreground mt-1 block">EPF, Professional Tax & TDS</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Disbursable</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-500">{formatINR(totalVolumeNet)}</div>
          <span className="text-xs text-muted-foreground mt-1 block">Net bank transfer dispatches</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Payrun Cards List */}
      <div className="space-y-4">
        {payruns?.map((p: any) => {
          const isDraft = p.status === 'DRAFT';
          const isComputed = p.status === 'COMPUTED';
          const isValidated = p.status === 'VALIDATED';
          const isPaid = p.status === 'PAID';
          const isComputingThis = computingId === p.id;
          const isValidatingThis = validatingId === p.id;
          const isDisbursingThis = disbursingId === p.id;

          return (
            <div
              key={p.id}
              className={`p-6 rounded-3xl bg-card border transition-all duration-200 shadow-sm ${
                isDraft
                  ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/[0.03] to-transparent'
                  : isComputed
                  ? 'border-blue-500/40 bg-gradient-to-r from-blue-500/[0.03] to-transparent'
                  : isPaid
                  ? 'border-emerald-500/30'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Metadata */}
                <div className="space-y-2 min-w-[280px]">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-primary" /> Period: {p.period}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText size={14} className="text-primary" /> {p.payslips_count} Payslips generated
                    </span>
                  </div>
                </div>

                {/* Financial Totals Grid */}
                <div className="grid grid-cols-3 gap-4 text-right bg-background p-4 rounded-2xl border border-border shrink-0">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Gross Pay</span>
                    <span className="text-sm font-semibold text-foreground">{formatINR(p.total_gross)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Deductions</span>
                    <span className="text-sm font-semibold text-rose-500">{formatINR(p.total_deduction)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Net Payout</span>
                    <span className="text-base font-extrabold text-emerald-500">{formatINR(p.total_net)}</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5 justify-end">
                  {/* 1. Compute / Recompute Button */}
                  {(isDraft || isComputed) && (
                    <button
                      onClick={() => handleCompute(p.id)}
                      disabled={isComputingThis}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-70"
                      title="Calculate earnings, statutory deductions and attendance LOP"
                    >
                      {isComputingThis ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Zap size={13} />
                      )}
                      <span>{isComputingThis ? 'Computing...' : isDraft ? 'Compute Batch' : 'Recompute'}</span>
                    </button>
                  )}

                  {/* 2. Validate & Approve Button */}
                  {isComputed && (
                    <button
                      onClick={() => handleValidate(p.id)}
                      disabled={isValidatingThis}
                      className="px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-70"
                    >
                      {isValidatingThis ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      <span>Validate Payrun</span>
                    </button>
                  )}

                  {/* 3. Disburse Button */}
                  {isValidated && (
                    <button
                      onClick={() => handleDisburse(p.id)}
                      disabled={isDisbursingThis}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-70"
                    >
                      {isDisbursingThis ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <IndianRupee size={13} />
                      )}
                      <span>Mark Disbursed (PAID)</span>
                    </button>
                  )}

                  {/* 4. View Payslips Link */}
                  <Link
                    to={`/payroll/payruns/${p.id}`}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs rounded-xl border border-border transition-all flex items-center gap-1 justify-center"
                  >
                    View Payslips <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW PAYRUN BATCH MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Plus size={20} />
                <h3 className="text-foreground">Create New Payrun Batch</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
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

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Payrun Batch Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. October 2026 Regular Monthly Payrun"
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Notes / Disbursal Memo</label>
                <textarea
                  rows={2}
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="Optional notes or batch reference details..."
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              <div className="p-3 bg-accent/20 rounded-2xl border border-border flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto_compute_check"
                  checked={autoCompute}
                  onChange={(e) => setAutoCompute(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="auto_compute_check" className="text-xs text-foreground cursor-pointer font-medium">
                  <strong>Automatically compute batch payslips</strong>
                  <span className="block text-[11px] text-muted-foreground">
                    Runs payroll engine and applies attendance LOP reconciliation immediately.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-70"
                >
                  {createMutation.isPending ? 'Generating Batch...' : 'Create & Compute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

