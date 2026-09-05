import { useQuery } from '@tanstack/react-query';
import { getSchedules } from '../lib/api';
import { formatTime12Hour } from '../lib/formatters';
import { Clock, Coffee, CheckCircle2 } from 'lucide-react';

export default function Schedules() {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Working Schedules & Shifts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-world Indian corporate shift rosters, 12-hour AM/PM timetables, break periods, and weekly hours.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules?.map((s: any) => {
          const workingDays = s.days?.filter((d: any) => d.is_working_day) || [];
          const firstDay = workingDays[0];

          return (
            <div
              key={s.id}
              className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-sm hover:border-primary/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                    {s.code}
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs border border-emerald-500/20">
                    <Clock size={13} /> {s.weekly_hours}h / wk
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">{s.name}</h3>
                  {firstDay && (
                    <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span>Core Timing:</span>
                      <span className="font-semibold text-foreground">
                        {formatTime12Hour(firstDay.start_time)} – {formatTime12Hour(firstDay.end_time)}
                      </span>
                    </p>
                  )}
                </div>

                {/* Day-by-Day Roster */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
                    <span>Day of Week</span>
                    <span>Timing (12-Hr)</span>
                  </div>
                  <div className="space-y-1.5">
                    {s.days?.map((d: any) => (
                      <div
                        key={d.id}
                        className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-colors ${
                          d.is_working_day
                            ? 'bg-background border-border text-foreground'
                            : 'bg-muted/30 border-dashed border-border/60 text-muted-foreground'
                        }`}
                      >
                        <span className="font-medium">{d.day_name}</span>
                        {d.is_working_day ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-emerald-500">
                              {formatTime12Hour(d.start_time)} – {formatTime12Hour(d.end_time)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium italic text-muted-foreground">
                            Weekly Off
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Coffee size={13} /> 60m Lunch Break
                </span>
                <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                  <CheckCircle2 size={13} /> Active Shift
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
