import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Check,
  ExternalLink,
  ShieldAlert,
  Calendar,
  DollarSign,
  UserCheck,
  ChevronDown,
  Shield,
  Briefcase,
  User,
  CheckCircle2,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead, markAllNotificationsRead, loginWithCredentials } from '../../lib/api';
import { useRole, CANONICAL_PERSONAS, type UserPersona } from '../../context/RoleContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const quickSwitchRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentPersona, currentRole, login, switchPersona, logout } = useRole();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 15000,
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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (quickSwitchRef.current && !quickSwitchRef.current.contains(event.target as Node)) {
        setIsQuickSwitchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickSwitch = async (persona: UserPersona) => {
    setIsQuickSwitchOpen(false);
    try {
      const res = await loginWithCredentials({
        email: persona.email,
        password: 'password123',
      });
      if (res && res.access_token) {
        login(res.access_token, res.user);
        queryClient.invalidateQueries();
        navigate('/dashboard');
        return;
      }
    } catch {
      // Fallback to client-side switch
      switchPersona(persona);
      queryClient.invalidateQueries();
      navigate('/dashboard');
    }
  };

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield size={14} className="text-indigo-500" />;
      case 'HR':
        return <Briefcase size={14} className="text-blue-500" />;
      case 'PAYROLL':
        return <DollarSign size={14} className="text-emerald-500" />;
      case 'EMPLOYEE':
        return <User size={14} className="text-amber-500" />;
      default:
        return <UserCheck size={14} className="text-primary" />;
    }
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border relative z-40">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground font-medium hidden sm:inline">
          PeoplePay360 <span className="text-foreground/40">/</span> Enterprise Indian HR & Payroll
        </span>
        {/* Active Portal Badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentPersona.badge_color}`}>
          {getRoleIcon(currentRole)}
          {currentRole === 'HR'
            ? 'HR Portal'
            : currentRole === 'PAYROLL'
            ? 'Payroll Department'
            : currentRole === 'ADMIN'
            ? 'Admin Portal'
            : 'Employee Self-Service'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees, leaves, contracts..."
            className="h-9 w-52 rounded-xl border border-input bg-background px-9 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-foreground"
          />
        </div>

        {/* Fast Role / Persona Quick Switch Dropdown Menu (Hidden in Employee UI) */}
        {currentRole !== 'EMPLOYEE' && (
          <div className="relative" ref={quickSwitchRef}>
            <button
              onClick={() => setIsQuickSwitchOpen(!isQuickSwitchOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Switch Role / Persona instantly"
            >
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <span className="hidden lg:inline text-muted-foreground font-normal">Switch Role:</span>
              <span className="font-extrabold text-foreground truncate max-w-[120px] sm:max-w-[160px]">
                {currentPersona.full_name}
              </span>
              <ChevronDown size={13} className="text-muted-foreground shrink-0" />
            </button>

            {isQuickSwitchOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 p-2">
                <div className="p-3 border-b border-border bg-accent/20 rounded-xl mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400 fill-amber-400" /> Fast Role Switcher
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Instantly switch between Admin, HR, Payroll, and Employee portals
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                    {CANONICAL_PERSONAS.length} Accounts
                  </span>
                </div>

                <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
                  {CANONICAL_PERSONAS.map((p) => {
                    const isActive = currentPersona.email.toLowerCase() === p.email.toLowerCase();
                    return (
                      <button
                        key={`${p.role}-${p.user_id}`}
                        onClick={() => handleQuickSwitch(p)}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                          isActive
                            ? 'bg-primary/15 border border-primary/40 text-foreground shadow-xs'
                            : 'hover:bg-accent/60 text-muted-foreground hover:text-foreground border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-card border border-border shrink-0 shadow-xs">
                            {getRoleIcon(p.role)}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                              {p.full_name}
                              {isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/30">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {p.display_title || p.role} • {p.department}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${p.badge_color}`}>
                          {p.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive Notification Bell */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2.5 rounded-full hover:bg-accent/50 transition-colors text-foreground focus:outline-none"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-card animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popup */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="p-4 border-b border-border flex items-center justify-between bg-accent/20">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-semibold border border-rose-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => readAllMutation.mutate()}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                    All caught up! No notifications.
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
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  View all alerts & history <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Logged In User Profile & Sign Out Menu */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-2xl hover:bg-accent/50 transition-all border border-border bg-card shadow-xs focus:outline-none cursor-pointer"
          >
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-xs">
              {currentPersona.avatar_initials}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-foreground block leading-tight">
                {currentPersona.full_name}
              </span>
              <span className="text-[10px] text-muted-foreground block leading-tight flex items-center gap-1">
                {currentPersona.display_title}
              </span>
            </div>
            <ChevronDown size={14} className="text-muted-foreground ml-1" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 p-2">
              <div className="p-3 border-b border-border bg-accent/20 rounded-xl mb-1.5">
                <div className="text-xs font-bold text-foreground truncate">
                  {currentPersona.full_name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {currentPersona.email}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${currentPersona.badge_color}`}>
                    {currentRole}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {currentPersona.department}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-foreground hover:bg-accent transition flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-primary" /> My Workspace Dashboard
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-2 font-semibold"
                >
                  <LogOut size={14} /> Sign Out / Switch User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
