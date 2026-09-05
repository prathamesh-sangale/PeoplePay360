import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTimeOffRequests, getTimeOffAllocations, getTimeOffTypes, updateTimeOffStatus } from '../lib/api';
import { getStatusBadgeClass } from '../lib/formatters';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function TimeOff() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'requests' | 'allocations'>('requests');

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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTimeOffStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Time Off & Leaves</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Indian statutory leave policies (Casual Leave, Privilege Leave, Sick Leave, Maternity 26 weeks).
          </p>
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

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'requests' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Leave Requests ({requests?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'allocations' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Staff Allocations ({allocations?.length || 0})
        </button>
      </div>

      {/* Requests Table */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {requests?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {r.employee?.name}
                        <div className="text-xs text-muted-foreground">{r.employee?.code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-xs text-primary">{r.leave_type?.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {r.start_date} to {r.end_date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{r.number_of_days} days</td>
                      <td className="py-3.5 px-4 text-xs text-foreground/80 max-w-xs truncate">{r.reason || '--'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => statusMutation.mutate({ id: r.id, status: 'APPROVED' })}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                            <button
                              onClick={() => statusMutation.mutate({ id: r.id, status: 'REJECTED' })}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Processed</span>
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
        <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Allocated</th>
                  <th className="py-3 px-4">Used</th>
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
