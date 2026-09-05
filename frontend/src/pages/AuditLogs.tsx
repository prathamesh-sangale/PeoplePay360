

export default function AuditLogs() {
  const sampleLogs = [
    { id: 1, action: 'PAYRUN_COMPUTED', user: 'Admin User', timestamp: '2026-09-01 10:30:15', details: 'Computed July 2026 Monthly Payrun with 15 payslips.' },
    { id: 2, action: 'CONTRACT_CREATED', user: 'HR Manager', timestamp: '2026-08-15 14:22:01', details: 'Added contract for Aarav Sharma (INR 36 LPA).' },
    { id: 3, action: 'LEAVE_APPROVED', user: 'Priya Patel', timestamp: '2026-08-10 11:05:40', details: 'Approved Casual Leave for Sneha Roy (2 days).' },
    { id: 4, action: 'ATTENDANCE_SYNC', user: 'Biometric System', timestamp: '2026-08-01 09:00:00', details: 'Synced 350+ attendance punch logs from biometric machine.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit & System Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tamper-evident audit trail of all payroll calculations, contract edits, and user actions.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sampleLogs.map((l) => (
                <tr key={l.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary">{l.action}</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">{l.user}</td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">{l.timestamp}</td>
                  <td className="py-3.5 px-4 text-xs text-foreground/80">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
