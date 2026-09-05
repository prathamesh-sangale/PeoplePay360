import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployees, getMetaDepartments } from '../lib/api';
import { formatINR, getStatusBadgeClass } from '../lib/formatters';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Mail,
  Phone,
  Building,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

export default function Employees() {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data: departments } = useQuery({
    queryKey: ['meta-departments'],
    queryFn: getMetaDepartments,
  });

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees', search, selectedDept, selectedStatus],
    queryFn: () =>
      getEmployees({
        search: search || undefined,
        department_id: selectedDept || undefined,
        status: selectedStatus || undefined,
      }),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Directory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage Indian workforce profiles, compensation packages, bank details, and job assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
            {employees?.length || 0} Total Staff
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-card border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, code, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Departments</option>
            {departments?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Loading & Empty State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="p-8 text-center text-rose-500 bg-rose-500/10 rounded-2xl">
          Failed to load employees.
        </div>
      )}

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees?.map((emp: any) => (
          <Link
            to={`/employees/${emp.id}`}
            key={emp.id}
            className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              {/* Header: Avatar, Name, Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary flex items-center justify-center font-bold text-base shadow-inner">
                    {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                      {emp.full_name}
                    </h3>
                    <div className="text-xs text-muted-foreground font-mono">{emp.employee_code}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(emp.status)}`}>
                  {emp.status}
                </span>
              </div>

              {/* Department & Job Position */}
              <div className="space-y-1 py-1">
                <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                  <Briefcase size={14} className="text-muted-foreground" />
                  <span>{emp.job.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building size={14} className="text-muted-foreground" />
                  <span>{emp.department.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin size={14} className="text-muted-foreground" />
                  <span>{emp.work_location}</span>
                </div>
              </div>

              {/* Contact details */}
              <div className="pt-2 border-t border-border/60 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 truncate">
                  <Mail size={13} /> <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} /> <span>{emp.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer: Package & Action */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground block">Monthly CTC</span>
                <span className="text-sm font-bold text-emerald-500">
                  {emp.wage ? formatINR(emp.wage) : 'Contract Pending'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                View Profile <ChevronRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
