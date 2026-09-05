import { useQuery } from '@tanstack/react-query';
import { getPayruns } from '../lib/api';
import { formatINR, getStatusBadgeClass } from '../lib/formatters';
import { Link } from 'react-router-dom';
import { Calendar, FileText, ChevronRight } from 'lucide-react';

export default function Payruns() {
  const { data: payruns, isLoading } = useQuery({
    queryKey: ['payruns'],
    queryFn: getPayruns,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Monthly Payruns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Execute batch payroll calculations, generate payslips, and process Indian statutory deductions.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Payrun Cards */}
      <div className="space-y-4">
        {payruns?.map((p: any) => (
          <div
            key={p.id}
            className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar size={14}/> Period: {p.period}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><FileText size={14}/> {p.payslips_count} Payslips generated</span>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="grid grid-cols-3 gap-4 text-right bg-background p-4 rounded-xl border border-border">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Gross Pay</span>
                  <span className="text-sm font-semibold text-foreground">{formatINR(p.total_gross)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Deductions (EPF/PT/TDS)</span>
                  <span className="text-sm font-semibold text-rose-500">{formatINR(p.total_deduction)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Net Payout</span>
                  <span className="text-base font-bold text-emerald-500">{formatINR(p.total_net)}</span>
                </div>
              </div>

              {/* Action */}
              <div>
                <Link
                  to={`/payroll/payruns/${p.id}`}
                  className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-xl transition-all flex items-center gap-1 justify-center"
                >
                  View Payslips <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
