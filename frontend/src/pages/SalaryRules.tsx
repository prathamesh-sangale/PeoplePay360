import { useQuery } from '@tanstack/react-query';
import { getSalaryRules } from '../lib/api';
import { CheckCircle2 } from 'lucide-react';

export default function SalaryRules() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ['salary-rules'],
    queryFn: getSalaryRules,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Indian Statutory Salary Rules</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configured rule engine for calculating Basic, HRA, EPF (12%), Professional Tax, TDS (Section 192), and Net Pay.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Seq</th>
                <th className="py-3 px-4">Rule Code</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Rate / Percentage</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rules?.map((r: any) => (
                <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{r.sequence}</td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-primary">{r.code}</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">{r.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground">
                      {r.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-emerald-500 font-semibold">
                    {r.percentage ? `${r.percentage}%` : 'Formula / Sched'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 w-fit">
                      <CheckCircle2 size={12}/> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
