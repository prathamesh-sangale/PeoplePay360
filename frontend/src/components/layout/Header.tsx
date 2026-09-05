import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Check, ExternalLink, ShieldAlert, Calendar, DollarSign, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/api';
import { Link } from 'react-router-dom';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 15000, // Live poll every 15s
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifData?.unread_count || 0;
  const items = notifData?.items || [];

  const getNotifIcon = (type: string) => {
    if (type?.includes('PAYRUN') || type?.includes('PAYSLIP')) {
      return <DollarSign size={14} className="text-emerald-500" />;
    }
    if (type?.includes('LEAVE') || type?.includes('TIME_OFF')) {
      return <Calendar size={14} className="text-blue-500" />;
    }
    if (type?.includes('WARNING') || type?.includes('COMPLIANCE')) {
      return <ShieldAlert size={14} className="text-amber-500" />;
    }
    return <UserCheck size={14} className="text-primary" />;
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border relative z-40">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground font-medium">
          PeoplePay360 <span className="text-foreground/40">/</span> Enterprise Indian HR & Payroll
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Global search (Employees, Payslips)..."
            className="h-9 w-64 rounded-xl border border-input bg-background px-9 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-foreground"
          />
        </div>

        {/* Interactive Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2.5 rounded-full hover:bg-accent/50 transition-colors text-foreground focus:outline-none"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-card animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popup */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="p-4 border-b border-border flex items-center justify-between bg-accent/20">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => readAllMutation.mutate()}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                {items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No notifications at this time.
                  </div>
                ) : (
                  items.slice(0, 6).map((n: any) => (
                    <div
                      key={n.id}
                      className={`p-3.5 transition-colors flex items-start gap-3 ${
                        n.is_read ? 'hover:bg-accent/30 opacity-75' : 'bg-primary/5 hover:bg-primary/10'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-background border border-border mt-0.5 shrink-0">
                        {getNotifIcon(n.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs font-semibold truncate ${n.is_read ? 'text-foreground' : 'text-primary'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {n.created_at ? new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => readMutation.mutate(n.id)}
                          title="Mark read"
                          className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-accent transition-colors shrink-0"
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-border bg-accent/10 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  View all alerts & history <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-accent/50 transition-colors border border-border bg-background">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
            AS
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-bold text-foreground block leading-tight">Aarav Sharma</span>
            <span className="text-[10px] text-muted-foreground block leading-tight">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
