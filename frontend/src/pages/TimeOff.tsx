import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTimeOffRequests,
  getTimeOffAllocations,
  getTimeOffTypes,
  approveTimeOffRequest,
  rejectTimeOffRequest,
} from '../lib/api';
import { getStatusBadgeClass } from '../lib/formatters';
import { CheckCircle2, XCircle, Check, AlertCircle } from 'lucide-react';

export default function TimeOff() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'requests' | 'allocations'>('requests');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const { data: types } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: getTimeOffTypes,
  });

  const { data: requests } = useQuery({
    queryKey: ['time-off-requests'],
    queryFn: () => getTimeOffRequests(),
  });

  const { data: allocations } = useQuery({
    queryKey: ['time-off-allocations'],
    queryFn: () => getTimeOffAllocations(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveTimeOffRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectTimeOffRequest(id, reason),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleRejectClick = (id: number) => {
    setRejectingId(id);
    setRejectReason('Business requirements and active milestone deliverable.');
  };

  const handleConfirmReject = () => {
    if (rejectingId) {
      rejectMutation.mutate({ id: rejectingId, reason: rejectReason });
    }
  };

  const pendingCount = requests?.filter((r: any) => r.status === 'PENDING').length || 0;
  const approvedCount = requests?.filter((r: any) => r.status === 'APPROVED').length || 0;
  const refusedCount = requests?.filter((r: any) => r.status === 'REFUSED' || r.status === 'REJECTED').length || 0;

  const filteredRequests = requests?.filter((r: any) => {
    if (statusFilter === 'PENDING') return r.status === 'PENDING';
    if (statusFilter === 'APPROVED') return r.status === 'APPROVED';
    if (statusFilter === 'REFUSED') return r.status === 'REFUSED' || r.status === 'REJECTED';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Time Off & Leaves</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Indian statutory leave policies (Casual Leave, Privilege Leave, Sick Leave, Optional Holidays).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Requests</span>
          <div className="mt-1 text-2xl font-bold text-foreground">{requests?.length || 0}</div>
          <span className="text-[11px] text-muted-foreground">All time</span>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Pending Review</span>
          <div className="mt-1 text-2xl font-bold text-amber-500">{pendingCount}</div>
          <span className="text-[11px] text-muted-foreground">Requires action</span>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Approved</span>
          <div className="mt-1 text-2xl font-bold text-emerald-500">{approvedCount}</div>
          <span className="text-[11px] text-muted-foreground">Consumed balance</span>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Refused / Declined</span>
          <div className="mt-1 text-2xl font-bold text-rose-500">{refusedCount}</div>
          <span className="text-[11px] text-muted-foreground">Balance restored</span>
        </div>
      </div>

      {/* Leave Types Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {types?.map((t: any) => (
          <div key={t.id} className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.code}</span>
            <div className="text-sm font-semibold text-foreground truncate">{t.name}</div>
            <div className="text-xs text-emerald-500 font-medium">{t.is_paid ? 'Paid Leave' : 'Unpaid'}</div>
          </div>
        ))}
      </div>

      {/* Tab Switcher & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
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
            Staff Allocations ({allocations?.length || 0})
          </button>
        </div>

        {activeTab === 'requests' && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'APPROVED', label: `Approved (${approvedCount})` },
              { id: 'REFUSED', label: `Refused (${refusedCount})` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === st.id
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal / Prompt */}
      {rejectingId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertCircle size={20} />
              <h3 className="font-bold text-base text-foreground">Refuse Leave Request</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Please enter the reason for declining this leave request. The employee will be notified.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason for Refusal</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Critical release sprint deadline, insufficient team coverage..."
                className="w-full text-xs p-3 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
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
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Decision Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRequests?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {r.employee?.name}
                        <div className="text-xs text-muted-foreground">{r.employee?.code} • {r.employee?.department}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-xs text-primary">{r.leave_type?.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {r.start_date} to {r.end_date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{r.number_of_days} days</td>
                      <td className="py-3.5 px-4 text-xs max-w-xs">
                        <div className="text-foreground truncate">{r.reason || '--'}</div>
                        {r.refusal_reason && (
                          <div className="text-[11px] text-rose-500 italic mt-0.5">Refusal: {r.refusal_reason}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'PENDING' ? (
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
                          <span className="text-xs text-muted-foreground font-medium flex items-center justify-end gap-1">
                            <Check size={13} className="text-muted-foreground" /> Decided
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
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
                  <th className="py-3 px-4">Allocated</th>
                  <th className="py-3 px-4">Used / Taken</th>
                  <th className="py-3 px-4">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {allocations?.map((a: any) => (
                  <tr key={a.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {a.employee_name}
                      <div className="text-xs text-muted-foreground">{a.employee_code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-primary">{a.leave_type}</td>
                    <td className="py-3.5 px-4 font-semibold">{a.allocated_days} days</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{a.used_days} days</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-500 text-sm">{a.remaining_days} days left</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
