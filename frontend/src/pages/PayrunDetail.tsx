import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPayrunDetail } from '../lib/api';
import { formatINR, getStatusBadgeClass } from '../lib/formatters';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function PayrunDetail() {
  const { id } = useParams();

  const { data: payrun, isLoading, error } = useQuery({
    queryKey: ['payrun-detail', id],
    queryFn: () => getPayrunDetail(id || ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !payrun) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500">Failed to load payrun details.</p>
        <Link to="/payroll/payruns" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Payruns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link to="/payroll/payruns" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={14} /> Back to Payruns
        </Link>
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{payrun.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(payrun.status)}`}>
                {payrun.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Period: {payrun.date_start} to {payrun.date_end}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right bg-background p-4 rounded-xl border border-border">
            <div>
              <span className="text-[11px] text-muted-foreground block">Total Gross</span>
              <span className="text-sm font-semibold text-foreground">{formatINR(payrun.total_gross)}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Total Deductions</span>
              <span className="text-sm font-semibold text-rose-500">{formatINR(payrun.total_deduction)}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Total Net Payout</span>
              <span className="text-base font-bold text-emerald-500">{formatINR(payrun.total_net)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
        <h3 className="text-base font-semibold text-foreground mb-4">Itemized Staff Payslips ({payrun.payslips?.length || 0})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Payslip #</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Basic Pay</th>
                <th className="py-3 px-4">Gross Wage</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payrun.payslips?.map((ps: any) => (
                <tr key={ps.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                    {ps.payslip_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    {ps.employee_name}
                    <div className="text-xs text-muted-foreground">{ps.employee_code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{ps.department}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{formatINR(ps.basic_wage)}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-foreground font-semibold">{formatINR(ps.gross_wage)}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-rose-500 font-semibold">-{formatINR(ps.total_deductions)}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-500">{formatINR(ps.net_wage)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/payroll/payslips/${ps.id}`}
                      className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      Slip <ChevronRight size={13} />
                    </Link>
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
