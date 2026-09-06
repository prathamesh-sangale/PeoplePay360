import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSalaryStructures, 
  getSalaryRules, 
  createSalaryStructure, 
  updateSalaryStructure, 
  deleteSalaryStructure 
} from '../lib/api';
import { useRole } from '../context/RoleContext';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  X, 
  Sliders, 
  AlertCircle,
  CheckSquare,
  Square,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface SalaryStructureRuleItem {
  id: string;
  code: string;
  name: string;
  category: string;
  sequence: number;
}

interface SalaryStructureItem {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  rules: SalaryStructureRuleItem[];
  rule_ids: number[];
  rules_count: number;
}

export default function SalaryStructures() {
  const queryClient = useQueryClient();
  const { currentRole } = useRole();
  const canEdit = currentRole === 'ADMIN' || currentRole === 'PAYROLL';

  const { data: structures, isLoading } = useQuery<SalaryStructureItem[]>({
    queryKey: ['salary-structures'],
    queryFn: getSalaryStructures,
  });

  const { data: allRules } = useQuery<any[]>({
    queryKey: ['salary-rules'],
    queryFn: getSalaryRules,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructureItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [ruleSearchTerm, setRuleSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
    selectedRuleIds: [] as number[],
  });

  const handleOpenCreate = () => {
    setEditingStructure(null);
    setFormError(null);
    setRuleSearchTerm('');
    // Default select standard rules if available
    const defaultIds = allRules
      ?.filter((r) => ['BASIC', 'HRA', 'SPECIAL_ALLOW', 'EPF_EE', 'PT', 'TDS', 'GROSS', 'NET'].includes(r.code))
      .map((r) => Number(r.id)) || [];

    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
      selectedRuleIds: defaultIds,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (struct: SalaryStructureItem) => {
    setEditingStructure(struct);
    setFormError(null);
    setRuleSearchTerm('');
    const currentRuleIds = struct.rule_ids?.length 
      ? struct.rule_ids.map(Number) 
      : (struct.rules || []).map((r) => Number(r.id));

    setFormData({
      name: struct.name || '',
      code: struct.code || '',
      description: struct.description || '',
      is_active: struct.is_active ?? true,
      selectedRuleIds: currentRuleIds,
    });
    setIsModalOpen(true);
  };

  const toggleRule = (ruleId: number) => {
    setFormData((prev) => {
      const exists = prev.selectedRuleIds.includes(ruleId);
      if (exists) {
        return {
          ...prev,
          selectedRuleIds: prev.selectedRuleIds.filter((id) => id !== ruleId),
        };
      } else {
        return {
          ...prev,
          selectedRuleIds: [...prev.selectedRuleIds, ruleId],
        };
      }
    });
  };

  const selectAllFilteredRules = (ruleIds: number[]) => {
    setFormData((prev) => {
      const combined = Array.from(new Set([...prev.selectedRuleIds, ...ruleIds]));
      return { ...prev, selectedRuleIds: combined };
    });
  };

  const deselectAllFilteredRules = (ruleIds: number[]) => {
    setFormData((prev) => ({
      ...prev,
      selectedRuleIds: prev.selectedRuleIds.filter((id) => !ruleIds.includes(id)),
    }));
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        is_active: formData.is_active,
        rule_ids: formData.selectedRuleIds,
      };

      if (editingStructure) {
        return await updateSalaryStructure(editingStructure.id, payload);
      } else {
        return await createSalaryStructure(payload);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      setIsModalOpen(false);
      setToastMessage(
        editingStructure
          ? `Salary Structure '${data.name}' modified successfully!`
          : `Salary Structure '${data.name}' created successfully!`
      );
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save salary structure. Please check details.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteSalaryStructure(id);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      setToastMessage(res.message || 'Salary structure modified successfully.');
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: any) => {
      setToastMessage(`Error: ${err.message || 'Failed to modify structure'}`);
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Structure Name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Structure Code is required (e.g. IND_STD_TECH).');
      return;
    }
    saveMutation.mutate();
  };

  const filteredStructures = structures?.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  const filteredModalRules = allRules?.filter((r) => {
    const q = ruleSearchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Salary Structures
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Indian compensation architectures and rule sets for Executives, Software Engineers, Operations, and Contractors.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/payroll/salary-rules"
            className="px-3.5 py-2 bg-card hover:bg-accent text-foreground border border-border text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sliders size={14} className="text-primary" /> Manage Salary Rules
          </Link>
          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm"
            >
              <Plus size={16} /> Create Structure
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          type="text"
          placeholder="Search structures by code or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs focus:ring-1 focus:ring-primary outline-none transition shadow-sm"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Structures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStructures?.map((s) => (
          <div
            key={s.id}
            className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 hover:border-primary/40 transition shadow-sm group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
                  {s.code}
                </span>
                <div className="flex items-center gap-2">
                  {s.is_active ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                      <XCircle size={11} /> Inactive
                    </span>
                  )}
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        title="Edit Salary Structure & Rules"
                        className="p-1.5 rounded-lg bg-card hover:bg-accent text-primary border border-border transition hover:scale-105"
                      >
                        <Edit3 size={13} />
                      </button>
                      {s.is_active && (
                        <button
                          onClick={() => {
                            if (confirm(`Deactivate structure '${s.name}' (${s.code})?`)) {
                              deleteMutation.mutate(s.id);
                            }
                          }}
                          title="Deactivate Salary Structure"
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {s.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {s.description || 'Indian Standard statutory compensation structure.'}
                </p>
              </div>

              {/* Rules List Preview */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground uppercase text-[11px]">
                    Assigned Rules ({s.rules?.length || 0})
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5"
                    >
                      Modify <ChevronRight size={12} />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {s.rules && s.rules.length > 0 ? (
                    s.rules.map((r) => (
                      <div
                        key={r.id || r.code}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border border-border"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                          <span className="font-medium text-foreground truncate">{r.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                          {r.code}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground bg-background rounded-lg border border-dashed border-border">
                      No salary rules attached yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            {canEdit && (
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="w-full py-2 bg-accent/60 hover:bg-accent text-foreground text-xs font-semibold rounded-xl border border-border flex items-center justify-center gap-1.5 transition"
                >
                  <Edit3 size={13} className="text-primary" /> Modify Structure & Rules
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit / Create Salary Structure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-accent/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {editingStructure ? `Modify Structure: ${editingStructure.code}` : 'Create Salary Structure'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure compensation framework and select statutory rules associated with this pay tier.
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
                    Structure Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indian Standard Tech Architecture"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">
                    Structure Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IND_STD_TECH, IND_EXEC_LEAD"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground font-mono font-bold text-xs focus:ring-1 focus:ring-primary outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Description / Applicability Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Applicable for regular software engineers, product managers, and engineering leads across Indian offices."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                <div>
                  <span className="font-semibold text-foreground block">Active Structure Status</span>
                  <span className="text-muted-foreground text-[11px]">
                    Available for assignment to employee contracts and automated payrun batches.
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

              {/* Rule Selection Matrix */}
              <div className="p-4 rounded-xl bg-accent/20 border border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                      <ShieldCheck size={15} className="text-primary" /> Associated Salary Calculation Rules ({formData.selectedRuleIds.length} Selected)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Check the computational rules that execute during payrun processing for this structure.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = (filteredModalRules || []).map((r) => Number(r.id));
                        selectAllFilteredRules(allIds);
                      }}
                      className="px-2 py-1 text-[10px] font-semibold bg-background hover:bg-accent border border-border rounded-lg text-primary transition"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = (filteredModalRules || []).map((r) => Number(r.id));
                        deselectAllFilteredRules(allIds);
                      }}
                      className="px-2 py-1 text-[10px] font-semibold bg-background hover:bg-accent border border-border rounded-lg text-muted-foreground transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search filter for rules */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search rules by name, category, or code..."
                    value={ruleSearchTerm}
                    onChange={(e) => setRuleSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Rule Checkbox Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredModalRules && filteredModalRules.length > 0 ? (
                    filteredModalRules.map((rule) => {
                      const rId = Number(rule.id);
                      const isSelected = formData.selectedRuleIds.includes(rId);
                      return (
                        <div
                          key={rule.id}
                          onClick={() => toggleRule(rId)}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                            isSelected
                              ? 'bg-primary/10 border-primary/40 text-foreground font-medium shadow-xs'
                              : 'bg-background hover:bg-accent/40 border-border text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-primary flex-shrink-0" />
                            ) : (
                              <Square size={16} className="text-muted-foreground/50 flex-shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="text-xs text-foreground block truncate font-medium">
                                {rule.name}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {rule.code} • {rule.category}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                            {rule.percentage ? `${rule.percentage}%` : rule.amount ? `₹${rule.amount}` : 'Formula'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                      No rules found.
                    </div>
                  )}
                </div>
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
                  ) : editingStructure ? (
                    'Save Structure Changes'
                  ) : (
                    'Create Salary Structure'
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

