import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, getMetaDepartments, getMetaJobs, getMetaTypes, createEmployee } from '../lib/api';
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
  Plus,
  Users,
  AlertCircle,
  LayoutGrid,
  List,
} from 'lucide-react';

export default function Employees() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobId, setJobId] = useState('');
  const [employeeTypeId, setEmployeeTypeId] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [workLocation, setWorkLocation] = useState('Bengaluru HQ');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [formError, setFormError] = useState('');

  const { data: departments } = useQuery({
    queryKey: ['meta-departments'],
    queryFn: getMetaDepartments,
  });

  const { data: jobs } = useQuery({
    queryKey: ['meta-jobs'],
    queryFn: getMetaJobs,
  });

  const { data: types } = useQuery({
    queryKey: ['meta-types'],
    queryFn: getMetaTypes,
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

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create employee profile.');
    },
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDepartmentId('');
    setJobId('');
    setEmployeeTypeId('');
    setDateOfJoining(new Date().toISOString().split('T')[0]);
    setWorkLocation('Bengaluru HQ');
    setPanNumber('');
    setAadhaarNumber('');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    if (departments && departments.length > 0) setDepartmentId(String(departments[0].id));
    if (jobs && jobs.length > 0) setJobId(String(jobs[0].id));
    if (types && types.length > 0) setEmployeeTypeId(String(types[0].id));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First and Last names are required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Valid work email is required.');
      return;
    }
    if (!departmentId || !jobId) {
      setFormError('Please select both Department and Job Title.');
      return;
    }

    createMutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      department_id: Number(departmentId),
      job_id: Number(jobId),
      employee_type_id: employeeTypeId ? Number(employeeTypeId) : undefined,
      date_of_joining: dateOfJoining,
      work_location: workLocation.trim(),
      pan_number: panNumber.trim().toUpperCase() || undefined,
      aadhaar_number: aadhaarNumber.trim() || undefined,
      status: 'ACTIVE',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="text-primary" size={24} /> Employee Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage workforce profiles, compensation packages, contracts, and job assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, code, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
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
            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
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
      {viewMode === 'grid' ? (
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
                      {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
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
                    <span>{emp.job?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building size={14} className="text-muted-foreground" />
                    <span>{emp.department?.name}</span>
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
      ) : (
        /* Table View */
        <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Work Location</th>
                  <th className="py-3 px-4">Monthly CTC</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {employees?.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <Link to={`/employees/${emp.id}`} className="hover:text-primary transition-colors">
                        {emp.full_name}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono">{emp.employee_code} • {emp.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{emp.department?.name}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-foreground">{emp.job?.name}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{emp.work_location}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                      {emp.wage ? formatINR(emp.wage) : '--'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 border border-border inline-flex items-center gap-1"
                      >
                        Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Users size={20} />
                <h3 className="text-foreground">Add New Employee Profile</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deshmukh"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vikram.deshmukh@peoplepay360.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    {departments?.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Job Title *</label>
                  <select
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    {jobs?.map((j: any) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Employee Type</label>
                  <select
                    value={employeeTypeId}
                    onChange={(e) => setEmployeeTypeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    {types?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Work Location</label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">PAN Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Aadhaar (Optional)</label>
                  <input
                    type="text"
                    placeholder="12 Digit Aadhaar"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
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
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
