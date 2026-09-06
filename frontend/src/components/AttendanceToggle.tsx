import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodayAttendance, toggleAttendancePunch } from '../lib/api';
import { Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { getStatusBadgeClass } from '../lib/formatters';

interface AttendanceToggleProps {
  className?: string;
  compact?: boolean;
  showToggle?: boolean;
}

export default function AttendanceToggle({ className = '', compact = false, showToggle = true }: AttendanceToggleProps) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fetch today's live server-side attendance state
  const { data: today, isLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: getTodayAttendance,
    refetchInterval: 15000, // Sync every 15s
  });

  // Local live ticking timer while is_working is true
  const [liveSeconds, setLiveSeconds] = useState<number>(0);

  useEffect(() => {
    if (!today?.is_working || !today?.check_in) {
      setLiveSeconds(0);
      return;
    }

    const checkInTime = new Date(today.check_in).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - checkInTime) / 1000));
      setLiveSeconds(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [today?.is_working, today?.check_in]);

  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  const toggleMutation = useMutation({
    mutationFn: toggleAttendancePunch,
    onSuccess: (data: any) => {
      setFeedback(data.message || (data.is_working ? 'Clocked in!' : 'Clocked out!'));
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-roster'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-employee-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setFeedback(`Error: ${err.message || 'Failed to toggle attendance.'}`);
      setTimeout(() => setFeedback(null), 6000);
    },
  });

  const handleToggle = () => {
    if (toggleMutation.isPending) return;
    toggleMutation.mutate();
  };

  const isWorking = Boolean(today?.is_working);
  const hasCompletedShift = !isWorking && Boolean(today?.check_in && today?.check_out);

  if (isLoading) {
    return (
      <div className={`p-6 rounded-3xl bg-card border border-border shadow-xs animate-pulse flex items-center justify-between ${className}`}>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-muted rounded"></div>
          <div className="h-6 w-36 bg-muted rounded"></div>
        </div>
        <div className="h-10 w-24 bg-muted rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isWorking
          ? 'bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20'
          : hasCompletedShift
          ? 'bg-gradient-to-br from-primary/10 via-card to-background border-primary/20 shadow-xs'
          : 'bg-gradient-to-br from-muted/30 via-card to-background border-border shadow-xs'
      } ${compact ? 'p-5' : 'p-6 sm:p-7'} ${className}`}
    >
      {/* Background Ambience Glow for Active Work */}
      {isWorking && (
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
        {/* Left Side: Telemetry & State Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className={isWorking ? 'text-emerald-500' : 'text-muted-foreground'} />
              Attendance
            </span>

            {/* Status Indicator */}
            {isWorking ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Working
              </span>
            ) : hasCompletedShift ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <CheckCircle2 size={12} />
                Shift Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                Not Working
              </span>
            )}

            {today?.status && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${getStatusBadgeClass(today.status)}`}>
                {today.status}
              </span>
            )}
          </div>

          {/* Core Status Heading */}
          {isWorking ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight text-emerald-500">
                  {formatTimer(liveSeconds)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">real-time duty hours</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Started: <strong className="text-foreground">{today.check_in_time}</strong> • Scheduled Shift:{' '}
                {today.shift_start} - {today.shift_end}
              </p>
            </div>
          ) : hasCompletedShift ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight text-primary">
                  {today.formatted_worked_time || `${today.worked_hours}h`}
                </span>
                <span className="text-xs text-muted-foreground font-medium">completed duty hours</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                In: <strong className="text-foreground">{today.check_in_time}</strong> • Out:{' '}
                <strong className="text-foreground">{today.check_out_time}</strong> • Scheduled Shift:{' '}
                {today.shift_start} - {today.shift_end}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight text-muted-foreground">
                  00h 00m 00s
                </span>
                <span className="text-xs text-muted-foreground font-medium">real-time duty hours</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scheduled Shift: {today?.shift_start || '09:00 AM'} - {today?.shift_end || '06:00 PM'} • Standard 8.0h Shift
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Toggle Switch Button OR Real-Time Telemetry Badge */}
        {showToggle ? (
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <button
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
              className={`relative flex items-center justify-between gap-3 px-5 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-md ${
                isWorking
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/25 ring-2 ring-emerald-400/50 active:scale-95'
                  : 'bg-card border-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/40 active:scale-95'
              }`}
            >
              {/* Sliding Pill Indicator */}
              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                    isWorking ? 'bg-white text-emerald-600' : 'bg-muted-foreground/30'
                  }`}
                >
                  {isWorking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>}
                </span>
                <span className="font-extrabold text-sm">{isWorking ? 'ON' : 'OFF'}</span>
              </div>

              <div className="text-[11px] font-semibold opacity-90 pl-2 border-l border-current/20">
                {toggleMutation.isPending ? 'Processing...' : isWorking ? 'Clock Out' : 'Clock In'}
              </div>
            </button>

            <span className="text-[10px] text-muted-foreground text-center sm:text-right">
              {isWorking ? 'Click to complete your shift' : 'Click to punch in with server time'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-card border border-border text-right flex flex-col items-end justify-center shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isWorking ? 'bg-emerald-500 animate-ping' : hasCompletedShift ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                {isWorking ? 'Live Tracking' : hasCompletedShift ? 'Shift Logged' : 'Duty Telemetry'}
              </span>
              <span className="text-xs font-semibold text-foreground mt-0.5">
                {isWorking ? 'Ticking in Real-Time' : hasCompletedShift ? 'Shift Completed' : 'Server Auto-Sync'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div className="mt-4 p-3 rounded-2xl bg-background/95 border border-border text-xs flex items-center gap-2 text-foreground animate-in fade-in slide-in-from-top-1 duration-200">
          <Sparkles size={14} className="text-primary shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
