import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../lib/api';


export default function Users() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsers,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage system users, administrators, HR managers, and access permissions.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {u.full_name?.charAt(0)}
                    </div>
                    {u.full_name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{u.email}</td>
                  <td className="py-3.5 px-4 font-medium text-primary text-xs">{u.role}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    {u.is_verified ? 'Verified' : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
