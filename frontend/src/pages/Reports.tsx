import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, ShieldCheck, Building, DollarSign } from 'lucide-react';
import { formatINR } from '../lib/formatters';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'overview' | 'epf' | 'tds' | 'bank'>('overview');

  // Fetch report data
  const { data: summary } = useQuery({
    queryKey: ['report-payroll-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/reports/payroll-summary`);
      return res.json();
    },
  });

  const { data: epfData } = useQuery({
    queryKey: ['report-epf-ecr'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/reports/epf-ecr`);
      return res.json();
    },
  });

  const { data: tdsData } = useQuery({
    queryKey: ['report-form-24q'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/reports/form-24q`);
      return res.json();
    },
  });

  const { data: bankData } = useQuery({
    queryKey: ['report-bank-advice'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/reports/bank-advice`);
      return res.json();
    },
  });

  const handleDownload = (reportType: string) => {
    window.open(`${API_BASE_URL}/reports/download/${reportType}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance & Statutory Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Indian statutory compliance filings (EPFO ECR, TDS Form 24Q, Bank Transfer Advice, Monthly Salary Registers).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('summary')}
            className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-accent/50 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download size={14} /> Export Summary
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card border border-border w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign size={14} /> Payroll Overview
        </button>
        <button
          onClick={() => setActiveTab('epf')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'epf' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSpreadsheet size={14} /> EPFO ECR Return
        </button>
        <button
          onClick={() => setActiveTab('tds')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'tds' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck size={14} /> TDS Form 24Q
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'bank' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building size={14} /> Bank Transfer Advice
        </button>
      </div>

      {/* Tab 1: Payroll Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Gross CTC</span>
              <div className="text-2xl font-bold text-foreground">{formatINR(summary?.total_gross || 2170000)}</div>
              <span className="text-xs text-muted-foreground">15 employees covered</span>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Net Disbursement</span>
              <div className="text-2xl font-bold text-emerald-500">{formatINR(summary?.total_net || 1888700)}</div>
              <span className="text-xs text-emerald-500/80 font-medium">100% Disbursed via Bank Transfer</span>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Statutory EPF Remit</span>
              <div className="text-2xl font-bold text-blue-500">{formatINR(summary?.total_epf || 27000)}</div>
              <span className="text-xs text-muted-foreground">EE + ER Share</span>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Income Tax (TDS)</span>
              <div className="text-2xl font-bold text-amber-500">{formatINR(summary?.total_tds || 251300)}</div>
              <span className="text-xs text-muted-foreground">Section 192 Tax</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Department-wise Wage & Headcount Register</h3>
                <p className="text-xs text-muted-foreground">Monthly expense breakdown by business unit</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Staff Count</th>
                    <th className="py-3 px-4">Gross Compensation</th>
                    <th className="py-3 px-4">Net Take-Home</th>
                    <th className="py-3 px-4">Share of Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {summary?.departments?.map((d: any) => (
                    <tr key={d.department_id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {d.department_name} ({d.code})
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{d.headcount}</td>
                      <td className="py-3 px-4 font-bold text-foreground">{formatINR(d.gross_pay)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-500">{formatINR(d.net_pay)}</td>
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                        {summary.total_gross ? `${Math.round((d.gross_pay / summary.total_gross) * 100)}%` : '0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: EPFO ECR Return */}
      {activeTab === 'epf' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    EPFO Unified Portal
                  </span>
                  <h3 className="text-lg font-bold text-foreground">Monthly Electronic Challan Return (ECR)</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Establishment: {epfData?.establishment_name} • Code: {epfData?.establishment_id} • Month: {epfData?.wage_month}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload('epf-ecr')}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-2 shadow-md shadow-primary/20 transition-all"
                >
                  <Download size={14} /> Download EPFO ECR (.txt)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                <span className="text-muted-foreground">Total Members</span>
                <div className="text-xl font-bold text-foreground">{epfData?.total_members || 15}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                <span className="text-muted-foreground">Employee Share (12%)</span>
                <div className="text-xl font-bold text-blue-500">{formatINR(epfData?.total_ee_share || 27000)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                <span className="text-muted-foreground">Employer EPS (8.33%)</span>
                <div className="text-xl font-bold text-foreground">{formatINR(epfData?.total_er_eps || 18742)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                <span className="text-muted-foreground">Total Challan Remittance</span>
                <div className="text-xl font-bold text-emerald-500">{formatINR(epfData?.total_challan_amount || 55250)}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">UAN</th>
                    <th className="py-2.5 px-3">Member Name</th>
                    <th className="py-2.5 px-3">Gross Wages</th>
                    <th className="py-2.5 px-3">EPF Wages</th>
                    <th className="py-2.5 px-3">EE Share (12%)</th>
                    <th className="py-2.5 px-3">ER EPS (8.33%)</th>
                    <th className="py-2.5 px-3">ER EPF (3.67%)</th>
                    <th className="py-2.5 px-3">NCP Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {epfData?.items?.map((item: any) => (
                    <tr key={item.uan} className="hover:bg-accent/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">{item.uan}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{item.member_name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{formatINR(item.gross_wages)}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{formatINR(item.epf_wages)}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-500">{formatINR(item.ee_share)}</td>
                      <td className="py-2.5 px-3 text-foreground">{formatINR(item.eps_share)}</td>
                      <td className="py-2.5 px-3 text-foreground">{formatINR(item.er_share)}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{item.ncp_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: TDS Form 24Q */}
      {activeTab === 'tds' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Income Tax TRACES
                  </span>
                  <h3 className="text-lg font-bold text-foreground">Quarterly TDS Statement (Form 24Q Annexure II)</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  TAN: {tdsData?.tan} • Employer: {tdsData?.employer_name} • Quarter: {tdsData?.quarter} (FY {tdsData?.financial_year})
                </p>
              </div>

              <button
                onClick={() => handleDownload('form-24q')}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-2 shadow-md shadow-primary/20 transition-all"
              >
                <Download size={14} /> Export Form 24Q (.csv)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">PAN</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Regime</th>
                    <th className="py-2.5 px-3">Annualized CTC</th>
                    <th className="py-2.5 px-3">Std Deduction</th>
                    <th className="py-2.5 px-3">Taxable Salary</th>
                    <th className="py-2.5 px-3">Quarterly TDS</th>
                    <th className="py-2.5 px-3">Challan BSR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tdsData?.items?.map((item: any) => (
                    <tr key={item.pan} className="hover:bg-accent/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">{item.pan}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{item.employee_name}</td>
                      <td className="py-2.5 px-3 text-[11px] text-muted-foreground">{item.regime}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{formatINR(item.annual_gross_salary)}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{formatINR(item.standard_deduction)}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{formatINR(item.taxable_amount)}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-500">{formatINR(item.quarterly_tds)}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{item.challan_bsr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Bank Transfer Advice */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    Corporate Banking
                  </span>
                  <h3 className="text-lg font-bold text-foreground">Direct Bank Salary Transfer Advice</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Debit Account: {bankData?.debit_bank} ({bankData?.debit_account_number}) • Ref: {bankData?.batch_reference}
                </p>
              </div>

              <button
                onClick={() => handleDownload('bank-advice')}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-2 shadow-md shadow-primary/20 transition-all"
              >
                <Download size={14} /> Download Bank Transfer CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Beneficiary Name</th>
                    <th className="py-2.5 px-3">Bank Name</th>
                    <th className="py-2.5 px-3">Account Number</th>
                    <th className="py-2.5 px-3">IFSC Code</th>
                    <th className="py-2.5 px-3">Net Amount (INR)</th>
                    <th className="py-2.5 px-3">Transfer Narration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bankData?.items?.map((item: any) => (
                    <tr key={item.employee_code} className="hover:bg-accent/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">{item.employee_code}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{item.beneficiary_name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{item.bank_name}</td>
                      <td className="py-2.5 px-3 font-mono text-foreground">{item.account_number}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">{item.ifsc_code}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-500">{formatINR(item.net_amount)}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{item.narration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
