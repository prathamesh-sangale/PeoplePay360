import { Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';

export default function Reports() {

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance & Payroll Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate Indian statutory compliance filings (EPF ECR, Form 16 / TDS 24Q, PT Return, Salary Register).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Monthly EPF Electronic Challan Return (ECR)</h3>
              <p className="text-xs text-muted-foreground">Form 3A/6A compliant ECR text format for EPFO portal</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Covers 15 employees with 12% employee share and 12% employer share (EPS 8.33% + EPF 3.67%).
          </p>
          <button
            onClick={() => alert('Exporting EPF ECR File for EPFO Unified Portal...')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Download size={14} /> Export ECR File (.txt)
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Quarterly TDS Summary (Form 24Q)</h3>
              <p className="text-xs text-muted-foreground">Income Tax Department Traces Annexure II</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Aggregated quarterly tax deducted at source under Section 192 for FY 2026-27.
          </p>
          <button
            onClick={() => alert('Generating Form 24Q Quarterly TDS Filing...')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Download size={14} /> Export Form 24Q Report (.csv)
          </button>
        </div>
      </div>
    </div>
  );
}
