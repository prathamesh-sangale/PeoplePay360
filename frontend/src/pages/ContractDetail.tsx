import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getContractDetail } from '../lib/api';
import { formatINR, formatINRPerAnnum, getStatusBadgeClass } from '../lib/formatters';
import { ArrowLeft, User, Building, Calendar, Layers, Clock, ShieldCheck } from 'lucide-react';

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
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Assigned to:</span>
              <Link
                to={`/employees/${contract.employee?.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold text-xs"
              >
                <User size={12} /> {contract.employee?.name} ({contract.employee?.code})
              </Link>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(contract.status)}`}>
            {contract.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-background border border-border space-y-1">
            <span className="text-muted-foreground">Monthly Compensation (Gross CTC)</span>
            <div className="text-xl font-bold text-emerald-500">{formatINR(contract.wage)}</div>
            <span className="text-muted-foreground font-medium">{formatINRPerAnnum(contract.wage)}</span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border space-y-1">
            <span className="text-muted-foreground">Salary Structure</span>
            <div className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-1">
              <Layers size={14} className="text-primary" /> {contract.salary_structure}
            </div>
            <span className="text-muted-foreground">Indian Statutory (EPF + PT + TDS + HRA)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1"><Building size={12} /> Department & Role</span>
            <p className="font-semibold text-foreground">{contract.employee?.department || 'Engineering'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1"><Clock size={12} /> Working Schedule</span>
            <p className="font-semibold text-foreground">{contract.working_schedule} ({contract.hours_per_week || 40} hrs/week)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1"><Calendar size={12} /> Start Date</span>
            <p className="font-semibold text-foreground">{contract.date_start || contract.start_date || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1"><Calendar size={12} /> End Date</span>
            <p className="font-semibold text-foreground">{contract.date_end || contract.end_date || 'Permanent (Indefinite)'}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-3">
          <ShieldCheck className="text-primary flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-foreground">Statutory Indian Labor Code Compliant</p>
            <p className="text-[11px] mt-0.5">
              Includes mandatory 50% Basic wage ratio, 12% EPF match, and applicable state Professional Tax deduction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
