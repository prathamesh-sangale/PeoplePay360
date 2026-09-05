import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAttendance, getAttendanceSummary } from '../lib/api';
import { getStatusBadgeClass } from '../lib/formatters';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Attendance() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: getAttendanceSummary,
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance-records', statusFilter],
    queryFn: () => getAttendance({ status: statusFilter || undefined }),
  });

  const filtered = records?.filter((r: any) =>
    search
      ? r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
        r.department?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Biometric Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time biometric punch records, working hours, and punctuality tracking.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Punches</span>
            <div className="mt-2 text-2xl font-bold text-foreground">{summary.total_records}</div>
            <span className="text-xs text-muted-foreground">Logged in system</span>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase">On-Time / Present</span>
            <div className="mt-2 text-2xl font-bold text-emerald-500">{summary.present_count}</div>
            <span className="text-xs text-muted-foreground">Normal shifts</span>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Late Arrivals</span>
            <div className="mt-2 text-2xl font-bold text-amber-500">{summary.late_count}</div>
            <span className="text-xs text-muted-foreground">Grace period exceeded</span>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Avg Worked Hours</span>
            <div className="mt-2 text-2xl font-bold text-blue-500">{summary.average_worked_hours}h</div>
            <span className="text-xs text-muted-foreground">Per day average</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-card border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee, code, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present / On Time</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Worked Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered?.map((r: any) => (
                <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground">{r.attendance_date}</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    <Link to={`/employees/${r.employee_id}`} className="hover:text-primary transition-colors">
                      {r.employee_name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{r.employee_code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{r.department}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{r.check_in_time}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{r.check_out_time}</td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">{r.worked_hours} hrs</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
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
