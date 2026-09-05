import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getContractDetail } from '../lib/api';
import { formatINR, formatINRPerAnnum, getStatusBadgeClass } from '../lib/formatters';
import { ArrowLeft } from 'lucide-react';

export default function ContractDetail() {
  const { id } = useParams();

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract-detail', id],
    queryFn: () => getContractDetail(id || ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500">Failed to load contract.</p>
        <Link to="/contracts" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Contracts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      <Link to="/contracts" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back to Contracts
      </Link>

      <div className="p-6 rounded-2xl bg-card border border-border space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">{contract.contract_reference}</h2>
            <p className="text-xs text-muted-foreground">Assigned to: {contract.employee?.name} ({contract.employee?.code})</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(contract.status)}`}>
            {contract.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-background border border-border space-y-1">
            <span className="text-muted-foreground">Monthly Compensation</span>
            <div className="text-xl font-bold text-emerald-500">{formatINR(contract.wage)}</div>
            <span className="text-muted-foreground font-medium">{formatINRPerAnnum(contract.wage)}</span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border space-y-1">
            <span className="text-muted-foreground">Salary Structure</span>
            <div className="text-base font-bold text-foreground">{contract.salary_structure?.name}</div>
            <span className="text-muted-foreground font-mono">{contract.salary_structure?.code}</span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Start Date</span>
            <span className="font-medium text-foreground">{contract.start_date}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">End Date</span>
            <span className="font-medium text-foreground">{contract.end_date || 'Open Ended / Permanent'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Working Schedule</span>
            <span className="font-medium text-foreground">{contract.working_schedule?.name} ({contract.working_schedule?.hours_per_week}h/wk)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
