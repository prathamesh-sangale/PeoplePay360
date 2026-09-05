import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContracts, createContract, getEmployees, getSalaryStructures } from '../lib/api';
import { formatINR, formatINRPerAnnum } from '../lib/formatters';
import { Search, Plus, Briefcase, AlertCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Contracts() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [structureId, setStructureId] = useState('');
  const [name, setName] = useState('');
  const [wage, setWage] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [contractType, setContractType] = useState('FULL_TIME');
  const [formError, setFormError] = useState('');

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', statusFilter],
    queryFn: () => getContracts({ status: statusFilter || undefined }),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-meta'],
    queryFn: () => getEmployees(),
  });

  const { data: structures } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: getSalaryStructures,
  });

  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create contract.');
    },
  });

  const resetForm = () => {
    setEmployeeId('');
    setStructureId('');
    setName('');
    setWage('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setContractType('FULL_TIME');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    if (employees && employees.length > 0) {
      setEmployeeId(String(employees[0].id));
      setName(`Employment Agreement - ${employees[0].full_name}`);
    }
    if (structures && structures.length > 0) {
      setStructureId(String(structures[0].id));
    }
    setWage('75000');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!employeeId) {
      setFormError('Please select an employee.');
      return;
    }
    if (!wage || Number(wage) <= 0) {
      setFormError('Please enter a valid monthly wage/CTC.');
      return;
    }
    if (!startDate) {
      setFormError('Start date is required.');
      return;
    }

    createMutation.mutate({
      employee_id: Number(employeeId),
      salary_structure_id: structureId ? Number(structureId) : undefined,
      name: name.trim() || `Contract - Emp #${employeeId}`,
      wage: Number(wage),
      start_date: startDate,
      end_date: endDate || undefined,
      contract_type: contractType,
      status: 'ACTIVE',
    });
  };

  const today = new Date();
  const sixtyDaysAhead = new Date();
  sixtyDaysAhead.setDate(today.getDate() + 60);

  const getContractStatusBadge = (c: any) => {
    if (c.status === 'EXPIRED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          EXPIRED
        </span>
      );
    }
    if (c.end_date) {
      const endD = new Date(c.end_date);
      if (endD < today) {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            EXPIRED
          </span>
        );
      }
      if (endD <= sixtyDaysAhead) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle size={10} /> EXPIRING SOON
          </span>
        );
      }
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        ACTIVE
      </span>
    );
  };

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="text-primary" size={24} /> Employment Contracts & Agreements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active and historical employment agreements, salary structures, wage tiers, and contract renewal monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Contract
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee, reference, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Contracts</option>
            <option value="ACTIVE">Active Contracts</option>
            <option value="EXPIRED">Expired Contracts</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Contract Ref</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Monthly CTC</th>
                <th className="py-3 px-4">Annualized</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered && filtered.length > 0 ? (
                filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                      {c.contract_reference}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <Link to={`/employees/${c.employee?.id}`} className="hover:text-primary transition-colors">
                        {c.employee?.name}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono">{c.employee?.code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{c.employee?.department}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">{formatINR(c.wage)}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{formatINRPerAnnum(c.wage)}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                      {c.start_date} {c.end_date ? `→ ${c.end_date}` : '→ Present'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getContractStatusBadge(c)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/contracts/${c.id}`}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 border border-border inline-flex items-center gap-1"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                    No contracts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CONTRACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Briefcase size={20} />
                <h3 className="text-foreground">Create Employment Contract</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Select Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    const selected = employees?.find((emp: any) => String(emp.id) === e.target.value);
                    if (selected) setName(`Employment Agreement - ${selected.full_name}`);
                  }}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.department?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Contract Title / Reference</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Monthly Gross Wage (₹)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="e.g. 75000"
                    value={wage}
                    onChange={(e) => setWage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Salary Structure</label>
                  <select
                    value={structureId}
                    onChange={(e) => setStructureId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    <option value="">Default Indian Standard Structure</option>
                    {structures?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-secondary/40 rounded-xl border border-border text-[11px] text-muted-foreground">
                Creating a new active contract preserves previous contracts in employee history and automatically updates the active wage for monthly payroll calculations.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
