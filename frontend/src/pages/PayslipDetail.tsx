import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPayslipDetail } from '../lib/api';
import { formatINR, getStatusBadgeClass } from '../lib/formatters';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';

export default function PayslipDetail() {
  const { id } = useParams();

  const { data: slip, isLoading, error } = useQuery({
    queryKey: ['payslip-detail', id],
    queryFn: () => getPayslipDetail(id || ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !slip) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500">Failed to load salary slip.</p>
        <Link to="/payroll/payslips" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Payslips
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <Link to="/payroll/payslips" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Payslips
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      {/* Salary Slip Document Container */}
      <div className="p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6 text-foreground print:border-none print:shadow-none print:p-0">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-border gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                P
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">PeoplePay360 Technologies Pvt. Ltd.</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Prestige Tech Park, Outer Ring Road, Kadubeesanahalli, Bengaluru, Karnataka 560103
            </p>
            <p className="text-xs text-muted-foreground">CIN: U72200KA2026PTC089123 • GSTIN: 29AABCP1234F1Z8</p>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Salary Slip</span>
            <div className="text-base font-mono font-bold text-primary">{slip.payslip_number}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{slip.period}</div>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(slip.status)}`}>
              {slip.status}
            </span>
          </div>
        </div>

        {/* Employee Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-background border border-border text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Employee Name</span>
            <span className="font-semibold text-foreground">{slip.employee?.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Employee Code</span>
            <span className="font-mono font-semibold text-foreground">{slip.employee?.code}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Department</span>
            <span className="font-semibold text-foreground">{slip.employee?.department}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Work Location</span>
            <span className="font-semibold text-foreground">{slip.employee?.location || 'Bangalore'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Contract Reference</span>
            <span className="font-mono text-foreground">{slip.contract_ref}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Pay Period</span>
            <span className="text-foreground">{slip.date_from} to {slip.date_to}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Payment Mode</span>
            <span className="text-foreground">Bank Direct Transfer (NEFT/RTGS)</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Currency</span>
            <span className="font-bold text-foreground">INR (₹)</span>
          </div>
        </div>

        {/* 2-Column Earnings & Deductions Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings (Left) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Earnings (Allowances)</h4>
              <span className="text-xs font-bold text-muted-foreground">Amount (INR)</span>
            </div>
            <div className="space-y-2 text-xs">
              {slip.earnings?.map((e: any) => (
                <div key={e.id} className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-foreground font-medium">{e.rule_name}</span>
                  <span className="font-mono text-foreground font-semibold">{formatINR(e.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-border font-bold text-sm">
              <span className="text-foreground">Gross Earnings</span>
              <span className="text-emerald-500 font-mono">{formatINR(slip.gross_wage)}</span>
            </div>
          </div>

          {/* Deductions (Right) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Statutory Deductions</h4>
              <span className="text-xs font-bold text-muted-foreground">Amount (INR)</span>
            </div>
            <div className="space-y-2 text-xs">
              {slip.deductions?.map((d: any) => (
                <div key={d.id} className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-foreground font-medium">{d.rule_name}</span>
                  <span className="font-mono text-rose-500 font-semibold">{formatINR(d.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-border font-bold text-sm">
              <span className="text-foreground">Total Deductions</span>
              <span className="text-rose-500 font-mono">-{formatINR(slip.total_deductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Highlight Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Take-Home Net Salary</span>
            <div className="text-3xl font-extrabold text-foreground">{formatINR(slip.net_wage)}</div>
            <p className="text-xs text-muted-foreground">Credited directly to employee primary salary account.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <ShieldCheck size={16} /> Indian Statutory Compliant
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-border text-center text-[11px] text-muted-foreground space-y-1">
          <p>This is a computer-generated salary slip and requires no physical signature.</p>
          <p>For questions or tax exemptions, contact PeoplePay360 Payroll Helpdesk at payroll@peoplepay360.internal</p>
        </div>
      </div>
    </div>
  );
}
