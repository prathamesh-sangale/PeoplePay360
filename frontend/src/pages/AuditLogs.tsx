import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', categoryFilter, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs?${params.toString()}`);
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle2 size={10} /> Success</span>;
      case 'WARNING':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20"><AlertTriangle size={10} /> Warning</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20"><XCircle size={10} /> Failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">{status}</span>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      PAYROLL: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      COMPLIANCE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      EMPLOYEE: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      SECURITY: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      ATTENDANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${colors[category] || 'bg-card border-border text-foreground'}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit & System Event Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Immutable, tamper-evident audit trail of payroll disbursements, tax filings, contract updates, and system access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-card border border-border text-foreground hover:bg-accent/50 transition-all shadow-sm"
            title="Refresh Logs"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-card border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search action, actor, IP, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="ALL">All Event Categories</option>
            <option value="PAYROLL">Payroll Disbursements</option>
            <option value="COMPLIANCE">Statutory Compliance (EPF/TDS)</option>
            <option value="EMPLOYEE">Employee & Contracts</option>
            <option value="ATTENDANCE">Attendance & Biometrics</option>
            <option value="SECURITY">Security & Access</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="WARNING">Warnings</option>
            <option value="FAILED">Failures</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Logs Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground uppercase">
                <th className="py-3 px-3">Log ID & Timestamp</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Event Action</th>
                <th className="py-3 px-3">Performed By</th>
                <th className="py-3 px-3">IP Address</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-3">Details</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data?.items?.map((l: any) => (
                <tr key={l.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-foreground block">{l.id}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{l.timestamp?.replace('T', ' ').slice(0, 19)}</span>
                  </td>
                  <td className="py-3 px-3">{getCategoryBadge(l.category)}</td>
                  <td className="py-3 px-3 font-mono font-bold text-primary">{l.action}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground block">{l.actor}</span>
                    <span className="text-[10px] text-muted-foreground">{l.actor_role}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-muted-foreground">{l.ip_address}</td>
                  <td className="py-3 px-3 font-medium text-foreground">{l.entity}</td>
                  <td className="py-3 px-3 text-muted-foreground max-w-xs truncate" title={l.details}>
                    {l.details}
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(l.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
