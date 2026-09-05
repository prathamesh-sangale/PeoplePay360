import { useQuery } from '@tanstack/react-query';
import { getSchedules } from '../lib/api';


export default function Schedules() {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Working Schedules</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Weekly shift rotations and standard working hours per week.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {schedules?.map((s: any) => (
          <div key={s.id} className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-primary">{s.code}</span>
                <h3 className="text-base font-bold text-foreground mt-0.5">{s.name}</h3>
              </div>
              <div className="p-2 rounded-xl bg-primary/10 text-primary font-bold text-xs">
                {s.weekly_hours}h / wk
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Daily Rotas</span>
              <div className="space-y-1.5">
                {s.days?.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border border-border">
                    <span className="font-medium text-foreground">{d.day_name}</span>
                    {d.is_working_day ? (
                      <span className="font-mono text-emerald-500 font-semibold">{d.start_time} - {d.end_time}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Weekly Off</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
