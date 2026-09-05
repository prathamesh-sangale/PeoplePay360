import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPayslips } from '../lib/api';
import { formatINR, getStatusBadgeClass } from '../lib/formatters';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';

export default function Payslips() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: payslips, isLoading } = useQuery({
    queryKey: ['payslips', statusFilter],
    queryFn: () => getPayslips({ status: statusFilter || undefined }),
  });

  const filtered = payslips?.filter((p: any) =>
    search
      ? p.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.employee?.code?.toLowerCase().includes(search.toLowerCase()) ||
        p.payslip_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.employee?.department?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Payslips</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View, verify, and export itemized salary slips with Indian statutory calculations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
            {payslips?.length || 0} Total Payslips
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-card border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee name, code, slip #, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="DRAFT">Draft</option>
            <option value="VALIDATED">Validated</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Payslips Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Payslip #</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Gross Wage</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered?.map((ps: any) => (
                <tr key={ps.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                    {ps.payslip_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    {ps.employee?.name}
                    <div className="text-xs text-muted-foreground">{ps.employee?.code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{ps.employee?.department}</td>
                  <td className="py-3.5 px-4 text-xs text-foreground font-medium">{ps.period}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-foreground font-semibold">{formatINR(ps.gross_wage)}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-rose-500 font-semibold">-{formatINR(ps.total_deductions)}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-500">{formatINR(ps.net_wage)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(ps.status)}`}>
                      {ps.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/payroll/payslips/${ps.id}`}
                      className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      View Slip <ChevronRight size={13} />
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
