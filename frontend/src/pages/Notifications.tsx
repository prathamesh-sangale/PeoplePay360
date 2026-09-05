import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../lib/api';
import { Bell, Check, Trash2, CheckCheck, DollarSign, Calendar, ShieldAlert, UserCheck } from 'lucide-react';

export default function Notifications() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const readMutation = useMutation({
    mutationFn: (id: string | number) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const items = data?.items || [];
  const filtered = items.filter((n: any) => {
    if (unreadOnly && n.is_read) return false;
    if (filterType === 'PAYROLL') return n.notification_type?.includes('PAYRUN') || n.notification_type?.includes('PAYSLIP');
    if (filterType === 'TIMEOFF') return n.notification_type?.includes('LEAVE') || n.notification_type?.includes('TIME_OFF');
    if (filterType === 'COMPLIANCE') return n.notification_type?.includes('WARNING') || n.notification_type?.includes('COMPLIANCE');
    return true;
  });

  const getNotifIcon = (type: string) => {
    if (type?.includes('PAYRUN') || type?.includes('PAYSLIP')) {
      return <DollarSign size={18} className="text-emerald-500" />;
    }
    if (type?.includes('LEAVE') || type?.includes('TIME_OFF')) {
      return <Calendar size={18} className="text-blue-500" />;
    }
    if (type?.includes('WARNING') || type?.includes('COMPLIANCE')) {
      return <ShieldAlert size={18} className="text-amber-500" />;
    }
    return <UserCheck size={18} className="text-primary" />;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications & Alerts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            System notifications, payroll cycle reminders, and compliance warnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.unread_count ? (
            <button
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-xl border border-primary/20 transition-all flex items-center gap-1.5"
            >
              <CheckCheck size={14} /> Mark All Read ({data.unread_count})
            </button>
          ) : (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 font-semibold text-xs rounded-full border border-emerald-500/20">
              All Caught Up
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'PAYROLL', label: 'Payroll & Payruns' },
            { id: 'TIMEOFF', label: 'Time Off & Leaves' },
            { id: 'COMPLIANCE', label: 'Compliance & Warnings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                filterType === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
          />
          Unread Only
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 && !isLoading && (
          <div className="p-12 text-center rounded-2xl bg-card border border-border space-y-2">
            <Bell size={32} className="mx-auto text-muted-foreground opacity-40" />
            <h4 className="text-sm font-semibold text-foreground">No notifications found</h4>
            <p className="text-xs text-muted-foreground">You have no notifications matching the selected filter criteria.</p>
          </div>
        )}

        {filtered.map((n: any) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
              n.is_read ? 'bg-card border-border' : 'bg-primary/5 border-primary/30 shadow-sm'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-background border border-border mt-0.5 shrink-0 shadow-sm">
              {getNotifIcon(n.notification_type)}
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-sm font-semibold ${n.is_read ? 'text-foreground' : 'text-primary font-bold'}`}>
                  {n.title}
                </h4>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {n.created_at ? new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 self-center">
              {!n.is_read && (
                <button
                  onClick={() => readMutation.mutate(n.id)}
                  disabled={readMutation.isPending}
                  className="px-2.5 py-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 rounded-lg font-semibold transition-colors flex items-center gap-1"
                >
                  <Check size={12} /> Mark Read
                </button>
              )}
              <button
                onClick={() => deleteMutation.mutate(n.id)}
                disabled={deleteMutation.isPending}
                title="Delete notification"
                className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
