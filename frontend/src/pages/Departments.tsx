import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment, updateDepartment, getEmployees } from '../lib/api';
import { Building, Plus, Users, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

export default function Departments() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-meta'],
    queryFn: () => getEmployees(),
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create department.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) => updateDepartment(id, payload),
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update department.');
    },
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setManagerId('');
    setIsActive(true);
    setEditingDept(null);
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: any) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setManagerId(dept.manager?.id ? String(dept.manager.id) : '');
    setIsActive(dept.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Department name is required.');
      return;
    }
    if (!code.trim()) {
      setFormError('Department code is required.');
      return;
    }

    const payload: any = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      manager_id: managerId ? Number(managerId) : undefined,
      is_active: isActive,
    };

    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const totalActiveHeadcount = departments?.reduce((acc: number, d: any) => acc + (d.employee_count || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building className="text-primary" size={24} /> Departments Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize company structure, department leads, and workforce distribution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Users size={14} className="text-primary" /> Total Headcount: <span className="text-foreground font-bold">{totalActiveHeadcount}</span>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Add Department
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments?.map((d: any) => (
          <div
            key={d.id}
            className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {d.code}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-tight">{d.name}</h3>
                    <span className="text-[11px] font-mono text-muted-foreground">Code: {d.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenEdit(d)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit Department"
                >
                  <Edit3 size={15} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                {d.description || 'Enterprise department unit'}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users size={14} className="text-primary" />
                <span className="font-bold text-foreground">{d.employee_count}</span> active staff
              </div>
              <div>
                {d.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 size={10} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Building size={20} />
                <h3 className="text-foreground">{editingDept ? 'Edit Department' : 'Create Department'}</h3>
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
                <label className="font-semibold text-muted-foreground block mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering & Technology"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Core department responsibilities and location..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Department Lead / Manager (Optional)</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                >
                  <option value="">No Manager Assigned</option>
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="deptActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="deptActive" className="font-semibold text-foreground cursor-pointer">
                  Active Department
                </label>
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
