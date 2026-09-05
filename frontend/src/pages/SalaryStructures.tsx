import { useQuery } from '@tanstack/react-query';
import { getSalaryStructures } from '../lib/api';

import { Link } from 'react-router-dom';

export default function SalaryStructures() {
  const { data: structures, isLoading } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: getSalaryStructures,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Salary Structures</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Indian compensation architectures and rule sets for Executives, Engineers, and Contractors.
          </p>
        </div>
        <Link
          to="/payroll/salary-rules"
          className="px-4 py-2 bg-card hover:bg-accent text-foreground border border-border text-xs font-semibold rounded-xl transition-all"
        >
          View Calculation Rules
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {structures?.map((s: any) => (
          <div key={s.id} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">{s.code}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">{s.name}</h3>
              <p className="text-xs text-muted-foreground">{s.description || 'Indian Standard Structure'}</p>

              <div className="pt-3 border-t border-border space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Assigned Rules ({s.rules?.length || 0})</span>
                <div className="space-y-1.5">
                  {s.rules?.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border border-border">
                      <span className="font-medium text-foreground">{r.name}</span>
                      <span className="font-mono text-muted-foreground">{r.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
