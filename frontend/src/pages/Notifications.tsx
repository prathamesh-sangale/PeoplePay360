import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead } from '../lib/api';
import { Bell } from 'lucide-react';

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const readMutation = useMutation({
    mutationFn: (id: string | number) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications & Alerts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            System notifications, payroll cycle reminders, and compliance warnings.
          </p>
        </div>
        {data?.unread_count ? (
          <span className="px-3 py-1 bg-primary/10 text-primary font-semibold text-xs rounded-full border border-primary/20">
            {data.unread_count} Unread
          </span>
        ) : null}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="space-y-3">
        {data?.items?.map((n: any) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
              n.is_read ? 'bg-card border-border' : 'bg-primary/5 border-primary/30 shadow-sm'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5">
              <Bell size={18} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{n.title}</h4>
                <span className="text-[11px] text-muted-foreground">{n.created_at?.slice(0, 10)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{n.message}</p>
            </div>
            {!n.is_read && (
              <button
                onClick={() => readMutation.mutate(n.id)}
                className="text-xs text-primary hover:underline font-medium self-center"
              >
                Mark Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
