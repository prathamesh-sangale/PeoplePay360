import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendance, getAttendanceSummary, punchAttendance, correctAttendance, getEmployees } from '../lib/api';
import { getStatusBadgeClass, formatTime12Hour } from '../lib/formatters';
import { Search, Plus, Edit3, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Attendance() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [correctingRecord, setCorrectingRecord] = useState<any | null>(null);

  // Punch Form State
  const [punchEmpId, setPunchEmpId] = useState('');
  const [punchCheckIn, setPunchCheckIn] = useState('');
  const [punchCheckOut, setPunchCheckOut] = useState('');
  const [punchStatus, setPunchStatus] = useState('PRESENT');
  const [punchNotes, setPunchNotes] = useState('');
  const [punchError, setPunchError] = useState('');

  // Correction Form State
  const [correctCheckIn, setCorrectCheckIn] = useState('');
  const [correctCheckOut, setCorrectCheckOut] = useState('');
  const [correctReason, setCorrectReason] = useState('');
  const [correctError, setCorrectError] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: getAttendanceSummary,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-meta'],
    queryFn: () => getEmployees(),
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance-records', statusFilter],
    queryFn: () => getAttendance({ status: statusFilter || undefined }),
  });

  const punchMutation = useMutation({
    mutationFn: punchAttendance,
    onSuccess: () => {
      setIsPunchModalOpen(false);
      setPunchError('');
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
    },
    onError: (err: any) => {
      setPunchError(err.message || 'Failed to record punch.');
    },
  });

  const correctMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) => correctAttendance(id, payload),
    onSuccess: () => {
      setCorrectingRecord(null);
      setCorrectError('');
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
    },
    onError: (err: any) => {
      setCorrectError(err.message || 'Failed to apply attendance correction.');
    },
  });

  const handleOpenPunch = () => {
    setPunchError('');
    if (employees && employees.length > 0) setPunchEmpId(String(employees[0].id));
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setPunchCheckIn(`${dateStr}T09:00:00`);
    setPunchCheckOut(`${dateStr}T18:00:00`);
    setPunchStatus('PRESENT');
    setPunchNotes('Manual HR Attendance Entry');
    setIsPunchModalOpen(true);
  };

  const handleOpenCorrect = (rec: any) => {
    setCorrectingRecord(rec);
    const dateStr = rec.attendance_date || new Date().toISOString().split('T')[0];
    setCorrectCheckIn(rec.check_in_time !== '--:--' ? `${dateStr}T${rec.check_in_time}` : `${dateStr}T09:00:00`);
    setCorrectCheckOut(rec.check_out_time !== '--:--' ? `${dateStr}T${rec.check_out_time}` : `${dateStr}T18:00:00`);
    setCorrectReason('Biometric reader sync adjustment verified with department lead.');
    setCorrectError('');
  };

  const handlePunchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPunchError('');
    if (!punchEmpId) {
      setPunchError('Please select an employee.');
      return;
    }
    punchMutation.mutate({
      employee_id: Number(punchEmpId),
      check_in: punchCheckIn ? new Date(punchCheckIn).toISOString() : undefined,
      check_out: punchCheckOut ? new Date(punchCheckOut).toISOString() : undefined,
      status: punchStatus,
      notes: punchNotes,
    });
  };

  const handleCorrectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrectError('');
    if (!correctReason || correctReason.trim().length < 5) {
      setCorrectError('Please enter a mandatory audit reason (minimum 5 characters).');
      return;
    }
    correctMutation.mutate({
      id: correctingRecord.id,
      payload: {
        new_check_in: correctCheckIn ? new Date(correctCheckIn).toISOString() : undefined,
        new_check_out: correctCheckOut ? new Date(correctCheckOut).toISOString() : undefined,
        reason: correctReason.trim(),
      },
    });
  };

  const filtered = records?.filter((r: any) =>
    search
      ? r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
        r.department?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="text-primary" size={24} /> Attendance & Punctuality Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Biometric punch logs, shift hours, missing checkouts, and audit-trail corrections.
          </p>
        </div>
        <button
          onClick={handleOpenPunch}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
        >
          <Plus size={15} /> Log Attendance Punch
        </button>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Logs</span>
            <div className="mt-2 text-2xl font-extrabold text-foreground">{summary.total_records}</div>
            <span className="text-[10px] text-muted-foreground">Logged in database</span>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">On-Time / Present</span>
            <div className="mt-2 text-2xl font-extrabold text-emerald-500">{summary.present_count}</div>
            <span className="text-[10px] text-muted-foreground">Completed shifts</span>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Late Arrivals</span>
            <div className="mt-2 text-2xl font-extrabold text-amber-500">{summary.late_count}</div>
            <span className="text-[10px] text-muted-foreground">Grace period exceeded</span>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Missing Checkout</span>
            <div className="mt-2 text-2xl font-extrabold text-rose-500">{summary.missing_checkout_count || 0}</div>
            <span className="text-[10px] text-muted-foreground">Needs checkout punch</span>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Avg Worked</span>
            <div className="mt-2 text-2xl font-extrabold text-blue-500">{summary.average_worked_hours}h</div>
            <span className="text-[10px] text-muted-foreground">Per day average</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee, code, department..."
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
            <option value="">All Attendance Statuses</option>
            <option value="PRESENT">Present (On-Time)</option>
            <option value="LATE">Late Arrival</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="OVERTIME">Overtime</option>
            <option value="MISSING_CHECKOUT">Missing Checkout</option>
            <option value="CORRECTED">Audit-Corrected Log</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check-In (12-Hr)</th>
                <th className="py-3 px-4">Check-Out (12-Hr)</th>
                <th className="py-3 px-4">Worked Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered && filtered.length > 0 ? (
                filtered.map((r: any) => (
                  <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-foreground whitespace-nowrap">{r.attendance_date}</td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <Link to={`/employees/${r.employee_id}`} className="hover:text-primary transition-colors">
                        {r.employee_name}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono">{r.employee_code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{r.department}</td>
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                      {r.status === 'ABSENT' ? (
                        <span className="text-muted-foreground italic">--:--</span>
                      ) : (
                        formatTime12Hour(r.check_in_time)
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                      {r.status === 'ABSENT' || !r.check_out_time || r.check_out_time === '--:--' ? (
                        <span className="text-rose-500 font-semibold text-xs">Missing Checkout</span>
                      ) : (
                        formatTime12Hour(r.check_out_time)
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">{r.worked_hours} hrs</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenCorrect(r)}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition-all border border-border inline-flex items-center gap-1"
                        title="Submit Attendance Correction"
                      >
                        <Edit3 size={12} /> Correct
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                    No attendance records found matching the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PUNCH ATTENDANCE MODAL */}
      {isPunchModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Clock size={20} />
                <h3 className="text-foreground">Log Attendance Punch</h3>
              </div>
              <button onClick={() => setIsPunchModalOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            {punchError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {punchError}
              </div>
            )}

            <form onSubmit={handlePunchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Select Employee</label>
                <select
                  value={punchEmpId}
                  onChange={(e) => setPunchEmpId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.department?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Check-In Timestamp</label>
                  <input
                    type="datetime-local"
                    value={punchCheckIn}
                    onChange={(e) => setPunchCheckIn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Check-Out Timestamp</label>
                  <input
                    type="datetime-local"
                    value={punchCheckOut}
                    onChange={(e) => setPunchCheckOut(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Status</label>
                <select
                  value={punchStatus}
                  onChange={(e) => setPunchStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late Arrival</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="OVERTIME">Overtime</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. On-site client shift log"
                  value={punchNotes}
                  onChange={(e) => setPunchNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPunchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={punchMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {punchMutation.isPending ? 'Logging...' : 'Log Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTENDANCE CORRECTION MODAL */}
      {correctingRecord && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <ShieldCheck size={20} />
                <h3 className="text-foreground">Attendance Audit Correction</h3>
              </div>
              <button onClick={() => setCorrectingRecord(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="p-3 bg-secondary/50 rounded-xl border border-border text-xs space-y-1">
              <div className="font-bold text-foreground">{correctingRecord.employee_name} ({correctingRecord.employee_code})</div>
              <div className="text-muted-foreground font-mono">Date: {correctingRecord.attendance_date} | Original Status: {correctingRecord.status}</div>
            </div>

            {correctError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {correctError}
              </div>
            )}

            <form onSubmit={handleCorrectSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Corrected Check-In</label>
                  <input
                    type="datetime-local"
                    value={correctCheckIn}
                    onChange={(e) => setCorrectCheckIn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Corrected Check-Out</label>
                  <input
                    type="datetime-local"
                    value={correctCheckOut}
                    onChange={(e) => setCorrectCheckOut(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Mandatory Audit Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide detailed justification for audit trail (e.g. Card reader outage verified by Manager)..."
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCorrectingRecord(null)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {correctMutation.isPending ? 'Submitting...' : 'Submit Audit Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
