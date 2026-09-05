import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, createJob, updateJob } from '../lib/api';
import { BadgePercent, Plus, Users, CheckCircle2, AlertCircle, Edit3, Search } from 'lucide-react';

export default function Jobs() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create job role.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) => updateJob(id, payload),
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update job role.');
    },
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setIsActive(true);
    setEditingJob(null);
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (job: any) => {
    setEditingJob(job);
    setName(job.name);
    setCode(job.code);
    setDescription(job.description || '');
    setIsActive(job.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Job name is required.');
      return;
    }
    if (!code.trim()) {
      setFormError('Job code is required.');
      return;
    }

    const payload: any = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      is_active: isActive,
    };

    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredJobs = jobs?.filter((j: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return j.name.toLowerCase().includes(term) || j.code.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BadgePercent className="text-primary" size={24} /> Jobs & Job Titles
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage official job positions, job codes, and employee assignments across the organization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Job Title
          </button>
        </div>
      </div>

      {/* Search Filter Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search job title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-input bg-card text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Jobs Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Job Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredJobs && filteredJobs.length > 0 ? (
                filteredJobs.map((j: any) => (
                  <tr key={j.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">{j.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-primary font-bold">{j.code}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-sm truncate">
                      {j.description || '--'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Users size={13} className="text-primary" /> {j.employee_count} active
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {j.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(j)}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition-all border border-border inline-flex items-center gap-1"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                    No job roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <BadgePercent size={20} />
                <h3 className="text-foreground">{editingJob ? 'Edit Job Role' : 'Create Job Role'}</h3>
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
                <label className="font-semibold text-muted-foreground block mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Job Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSE"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Role Description</label>
                <textarea
                  rows={2}
                  placeholder="Primary job responsibilities and seniority level..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="jobActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="jobActive" className="font-semibold text-foreground cursor-pointer">
                  Active Position
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
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingJob ? 'Save Changes' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
