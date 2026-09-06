import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSalaryRules, createSalaryRule, updateSalaryRule, deleteSalaryRule } from '../lib/api';
import { useRole } from '../context/RoleContext';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Plus, 
  Search, 
  Trash2, 
  Sliders, 
  Info, 
  Percent, 
  Calculator, 
  Coins, 
  X,
  AlertCircle
} from 'lucide-react';

interface SalaryRuleItem {
  id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
  calculation_type: string;
  percentage: number | null;
  amount: number | null;
  formula: string | null;
  description: string | null;
  is_active: boolean;
}

export default function SalaryRules() {
  const queryClient = useQueryClient();
  const { currentRole } = useRole();
  const canEdit = currentRole === 'ADMIN' || currentRole === 'PAYROLL';

  const { data: rules, isLoading } = useQuery<SalaryRuleItem[]>({
    queryKey: ['salary-rules'],
    queryFn: getSalaryRules,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SalaryRuleItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'ALLOWANCE',
    sequence: 100,
    calculation_type: 'PERCENTAGE',
    percentage: '' as string | number,
    amount: '' as string | number,
    formula: '',
    description: '',
    is_active: true,
  });

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      category: 'ALLOWANCE',
      sequence: ((rules?.length || 0) + 1) * 10,
      calculation_type: 'PERCENTAGE',
      percentage: '10.0',
      amount: '',
      formula: '',
      description: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: SalaryRuleItem) => {
    setEditingRule(rule);
    setFormError(null);
    setFormData({
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'ALLOWANCE',
      sequence: rule.sequence || 100,
      calculation_type: rule.calculation_type || 'PERCENTAGE',
      percentage: rule.percentage !== null && rule.percentage !== undefined ? rule.percentage : '',
      amount: rule.amount !== null && rule.amount !== undefined ? rule.amount : '',
      formula: rule.formula || '',
      description: rule.description || '',
      is_active: rule.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        category: formData.category,
        sequence: Number(formData.sequence) || 100,
        calculation_type: formData.calculation_type,
        percentage: formData.calculation_type === 'PERCENTAGE' && formData.percentage !== '' ? Number(formData.percentage) : null,
        amount: formData.calculation_type === 'FIXED' && formData.amount !== '' ? Number(formData.amount) : null,
        formula: formData.calculation_type === 'FORMULA' && formData.formula.trim() ? formData.formula.trim() : null,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      };

      if (editingRule) {
        return await updateSalaryRule(editingRule.id, payload);
      } else {
        return await createSalaryRule(payload);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules'] });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      setIsModalOpen(false);
      setToastMessage(editingRule ? `Salary rule '${data.name}' updated successfully!` : `Salary rule '${data.name}' created successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save salary rule. Please check details.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteSalaryRule(id);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules'] });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      setToastMessage(res.message || 'Salary rule modified successfully.');
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: any) => {
      setToastMessage(`Error: ${err.message || 'Failed to delete rule'}`);
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Rule Name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Rule Code is required (e.g. HRA, EPF_EE).');
      return;
    }
    saveMutation.mutate();
  };

  const filteredRules = rules?.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || r.category.toUpperCase() === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'BASIC':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ALLOWANCE':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'DEDUCTION':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'STATUTORY':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'GROSS':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'NET':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'CONTRIBUTION':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" /> Indian Statutory Salary Rules
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure computational rules for Basic, HRA, EPF (12%), Professional Tax, TDS (Section 192), Special Allowances & Net Pay.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm"
          >
            <Plus size={16} /> Create Salary Rule
          </button>
        )}
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center justify-between font-medium shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search salary rules by name, code (e.g. HRA, EPF), or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'BASIC', 'ALLOWANCE', 'DEDUCTION', 'GROSS', 'NET', 'CONTRIBUTION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:bg-accent text-muted-foreground border border-border'
              }`}
            >
              {cat === 'ALL' ? 'All Rules' : cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Rules Table */}
      {!isLoading && (
        <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4">Seq</th>
                  <th className="py-3.5 px-4">Rule Code</th>
                  <th className="py-3.5 px-4">Rule Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Calculation Method</th>
                  <th className="py-3.5 px-4">Computation / Rate</th>
                  <th className="py-3.5 px-4">Statutory Notes</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canEdit && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRules && filteredRules.length > 0 ? (
                  filteredRules.map((r) => (
                    <tr key={r.id} className="hover:bg-accent/20 transition-colors group">
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground font-semibold">
                        {r.sequence}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                          {r.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {r.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(r.category)}`}>
                          {r.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                          {r.calculation_type === 'PERCENTAGE' && <Percent size={13} className="text-emerald-500" />}
                          {r.calculation_type === 'FIXED' && <Coins size={13} className="text-amber-500" />}
                          {r.calculation_type === 'FORMULA' && <Calculator size={13} className="text-purple-500" />}
                          {r.calculation_type || 'PERCENTAGE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold">
                        {r.calculation_type === 'PERCENTAGE' && r.percentage !== null ? (
                          <span className="text-emerald-500 font-bold">{r.percentage}% of Base</span>
                        ) : r.calculation_type === 'FIXED' && r.amount !== null ? (
                          <span className="text-amber-500 font-bold">₹{Number(r.amount).toLocaleString('en-IN')}</span>
                        ) : r.formula ? (
                          <span className="text-purple-400 font-sans text-[11px] truncate max-w-[200px] block" title={r.formula}>
                            {r.formula}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-[220px] truncate" title={r.description || ''}>
                        {r.description || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {r.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1 w-fit">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(r)}
                              title="Modify / Edit Salary Rule"
                              className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-accent text-primary hover:text-primary-foreground border border-border text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            {r.is_active && (
                              <button
                                onClick={() => {
                                  if (confirm(`Deactivate rule '${r.name}' (${r.code})?`)) {
                                    deleteMutation.mutate(r.id);
                                  }
                                }}
                                title="Deactivate Rule"
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="py-12 text-center text-muted-foreground text-xs">
                      No salary rules found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Salary Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-accent/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {editingRule ? `Modify Salary Rule: ${editingRule.code}` : 'Create New Salary Rule'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {editingRule
                      ? 'Update rate percentages, fixed allowances, sequence or calculation formulas.'
                      : 'Configure a new statutory or custom calculation rule for the payroll engine.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">
                    Rule Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House Rent Allowance (HRA)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">
                    Rule Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HRA, EPF_EE, TDS"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground font-mono font-bold text-xs focus:ring-1 focus:ring-primary outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="ALLOWANCE">ALLOWANCE</option>
                    <option value="DEDUCTION">DEDUCTION</option>
                    <option value="STATUTORY">STATUTORY</option>
                    <option value="GROSS">GROSS</option>
                    <option value="NET">NET</option>
                    <option value="CONTRIBUTION">CONTRIBUTION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Calculation Method</label>
                  <select
                    value={formData.calculation_type}
                    onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none font-semibold"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED AMOUNT (₹)</option>
                    <option value="FORMULA">FORMULA / PYTHON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Sequence Order</label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={formData.sequence}
                    onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Value Input depending on calculation type */}
              <div className="p-4 rounded-xl bg-accent/30 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Info size={14} className="text-primary" /> Computation Configuration
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">
                    Mode: {formData.calculation_type}
                  </span>
                </div>

                {formData.calculation_type === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      Percentage Rate (% of Base / Gross)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="e.g. 50.00 for 50%, 12.00 for EPF"
                        value={formData.percentage}
                        onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                        className="w-full pl-3 pr-8 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                    </div>
                  </div>
                )}

                {formData.calculation_type === 'FIXED' && (
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      Monthly Fixed Amount (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 200.00 for PT, 1600.00 for Conveyance"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                )}

                {formData.calculation_type === 'FORMULA' && (
                  <div className="space-y-2">
                    <label className="block text-muted-foreground font-medium mb-1">
                      Expression Formula (Balancing / Aggregation)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TOTAL_WAGE - BASIC - HRA - ALLOWANCES or (BASIC / WORKING_DAYS) * LOP_DAYS"
                      value={formData.formula}
                      onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:ring-1 focus:ring-primary outline-none"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Available variables: <code className="text-primary font-mono font-bold">TOTAL_WAGE</code>, <code className="text-primary font-mono font-bold">BASIC</code>, <code className="text-primary font-mono font-bold">HRA</code>, <code className="text-primary font-mono font-bold">GROSS</code>, <code className="text-primary font-mono font-bold">WORKING_DAYS</code>, <code className="text-primary font-mono font-bold">LOP_DAYS</code>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Description / Statutory Reference
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Section 10(13A) HRA exemption eligible; Statutory EPF ceiling under EPFO rules."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                <div>
                  <span className="font-semibold text-foreground block">Active Rule Status</span>
                  <span className="text-muted-foreground text-[11px]">
                    Inactive rules are bypassed by payroll calculations and payrun engines.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-border font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saveMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : editingRule ? (
                    'Save Rule Modifications'
                  ) : (
                    'Create Salary Rule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
