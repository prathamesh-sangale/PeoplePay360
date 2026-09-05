import { useQuery } from '@tanstack/react-query';
import { getRoles } from '../lib/api';
import { ShieldCheck } from 'lucide-react';

export default function Roles() {
  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: getRoles,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Role & Access Control</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configured system authorization roles (Super Admin, HR Manager, Payroll Lead, etc.).
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map((r: any) => (
          <div key={r.id} className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-sm">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-foreground">{r.name}</h3>
            <p className="text-xs text-muted-foreground">{r.description || 'System access role'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
