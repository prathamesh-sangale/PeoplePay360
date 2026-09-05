import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContracts } from '../lib/api';
import { formatINR, formatINRPerAnnum, getStatusBadgeClass } from '../lib/formatters';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Contracts() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', statusFilter],
    queryFn: () => getContracts({ status: statusFilter || undefined }),
  });

  const filtered = contracts?.filter((c: any) =>
    search
      ? c.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.contract_reference?.toLowerCase().includes(search.toLowerCase()) ||
        c.employee?.department?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employment Contracts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active and historical employment agreements with salary structures and working schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
            {contracts?.length || 0} Total Contracts
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-card border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee, reference, department..."
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
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Contract Ref</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Monthly CTC</th>
                <th className="py-3 px-4">Annualized</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered?.map((c: any) => (
                <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                    {c.contract_reference}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    <Link to={`/employees/${c.employee?.id}`} className="hover:text-primary transition-colors">
                      {c.employee?.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.employee?.code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{c.employee?.department}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-500">{formatINR(c.wage)}</td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{formatINRPerAnnum(c.wage)}</td>
                  <td className="py-3.5 px-4 text-xs text-foreground">{c.working_schedule} ({c.hours_per_week}h/wk)</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(c.status)}`}>
                      {c.status}
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
