import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployeeTypes, createEmployeeType, updateEmployeeType } from '../lib/api';
import { Tags, Plus, Users, AlertCircle, Edit3 } from 'lucide-react';

export default function EmployeeTypes() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');

  const { data: types, isLoading } = useQuery({
    queryKey: ['employee-types'],
    queryFn: getEmployeeTypes,
  });

  const createMutation = useMutation({
    mutationFn: createEmployeeType,
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['employee-types'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create employee type.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) => updateEmployeeType(id, payload),
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['employee-types'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update employee type.');
    },
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setEditingType(null);
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingType(t);
    setName(t.name);
    setCode(t.code);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Type name is required.');
      return;
    }
    if (!code.trim()) {
      setFormError('Type code is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
    };

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tags className="text-primary" size={24} /> Employee Types
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Classify employment models: Full-Time Regular, Part-Time, Intern, and Contract workers.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
        >
          <Plus size={15} /> Add Employee Type
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {types?.map((t: any) => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  {t.code}
                </span>
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                  title="Edit Type"
                >
                  <Edit3 size={14} />
                </button>
              </div>
              <h3 className="text-base font-bold text-foreground mt-2">{t.name}</h3>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users size={13} className="text-primary" /> Headcount:
              </span>
              <span className="font-bold text-foreground text-sm">{t.employee_count || 0}</span>
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
                <Tags size={20} />
                <h3 className="text-foreground">{editingType ? 'Edit Employee Type' : 'Create Employee Type'}</h3>
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
                <label className="font-semibold text-muted-foreground block mb-1">Type Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Time Regular"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Type Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FT"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                />
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
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingType ? 'Save Changes' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
