import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployees,
  getMetaDepartments,
  getMetaJobs,
  getMetaTypes,
  createEmployee,
  updateEmployee,
  getSalaryStructures,
  getSchedules,
} from '../lib/api';
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
  IndianRupee,
  Pencil,
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
  const [managerId, setManagerId] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [workingScheduleId, setWorkingScheduleId] = useState('');
  const [initialWage, setInitialWage] = useState('75000');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [workLocation, setWorkLocation] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [formError, setFormError] = useState('');

  // Edit Employee State
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWorkLocation, setEditWorkLocation] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editJobId, setEditJobId] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editError, setEditError] = useState('');

  const DEPT_LOCATION_MAP: Record<string, string> = {
    ENG: 'Bengaluru, Karnataka',
    PROD: 'Bengaluru, Karnataka',
    HR: 'Bengaluru, Karnataka',
    FIN: 'Mumbai, Maharashtra',
    SALES: 'Delhi NCR (Gurugram)',
    OPS: 'Hyderabad, Telangana',
  };

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

  const { data: structures } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: getSalaryStructures,
  });

  const { data: schedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  const { data: employeesList } = useQuery({
    queryKey: ['employees-active-meta'],
    queryFn: () => getEmployees({ status: 'ACTIVE' }),
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
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create employee profile.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: any }) => updateEmployee(id, payload),
    onSuccess: () => {
      setEditingEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setEditError(err.message || 'Failed to update employee profile.');
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
    setManagerId('');
    setSalaryStructureId('');
    setWorkingScheduleId('');
    setInitialWage('75000');
    setDateOfBirth('1995-01-01');
    setDateOfJoining(new Date().toISOString().split('T')[0]);
    setWorkLocation('');
    setPanNumber('');
    setAadhaarNumber('');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    if (departments && departments.length > 0) {
      setDepartmentId(String(departments[0].id));
      setWorkLocation(DEPT_LOCATION_MAP[departments[0].code] || 'Bengaluru, Karnataka');
    }
    if (jobs && jobs.length > 0) setJobId(String(jobs[0].id));
    if (types && types.length > 0) setEmployeeTypeId(String(types[0].id));
    if (structures && structures.length > 0) setSalaryStructureId(String(structures[0].id));
    if (schedules && schedules.length > 0) setWorkingScheduleId(String(schedules[0].id));
    setIsModalOpen(true);
  };

  const handleDepartmentChange = (deptId: string) => {
    setDepartmentId(deptId);
    // CRITICAL: NEVER overwrite user-typed workLocation / address!
    // Only autofill if workLocation is currently blank
    if (!workLocation || workLocation.trim() === '') {
      const found = departments?.find((d: any) => String(d.id) === String(deptId));
      if (found && DEPT_LOCATION_MAP[found.code]) {
        setWorkLocation(DEPT_LOCATION_MAP[found.code]);
      }
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, emp: any) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingEmployee(emp);
    setEditFirstName(emp.first_name || '');
    setEditLastName(emp.last_name || '');
    setEditEmail(emp.email || '');
    setEditPhone(emp.phone || '');
    setEditWorkLocation(emp.work_location || '');
    setEditDepartmentId(emp.department?.id ? String(emp.department.id) : '');
    setEditJobId(emp.job?.id ? String(emp.job.id) : '');
    setEditStatus(emp.status || 'ACTIVE');
    setEditError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditError('');
    if (!editFirstName.trim() || !editLastName.trim()) {
      setEditError('First and Last names are required.');
      return;
    }
    if (!editEmail.trim()) {
      setEditError('Valid email address is required.');
      return;
    }
    updateMutation.mutate({
      id: editingEmployee.id,
      payload: {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim() || undefined,
        work_location: editWorkLocation.trim(),
        department_id: editDepartmentId ? Number(editDepartmentId) : undefined,
        job_id: editJobId ? Number(editJobId) : undefined,
        status: editStatus,
      },
    });
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
      manager_id: managerId ? Number(managerId) : undefined,
      salary_structure_id: salaryStructureId ? Number(salaryStructureId) : undefined,
      working_schedule_id: workingScheduleId ? Number(workingScheduleId) : undefined,
      initial_wage: initialWage ? Number(initialWage) : 75000,
      date_of_birth: dateOfBirth,
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenEdit(e, emp)}
                    className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground text-[11px] font-semibold flex items-center gap-1 border border-border/80 transition-colors"
                    title="Edit Profile & Address"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                    View Profile <ChevronRight size={14} />
                  </div>
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
                  <th className="py-3 px-4 text-right">Actions</th>
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
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleOpenEdit(e, emp)}
                          className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 border border-border inline-flex items-center gap-1"
                          title="Edit Profile & Address"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <Link
                          to={`/employees/${emp.id}`}
                          className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 shadow-xs inline-flex items-center gap-1"
                        >
                          Profile →
                        </Link>
                      </div>
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
                    onChange={(e) => handleDepartmentChange(e.target.value)}
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
                  <label className="font-semibold text-muted-foreground block mb-1">Reporting Manager (Optional)</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    <option value="">No Direct Manager</option>
                    {employeesList?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name || `${emp.first_name} ${emp.last_name}`} ({emp.job?.name || emp.department?.name || ''} • {emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  >
                  </input>
                </div>
              </div>

              {/* Compensation & Roster Structure (HR -> Payroll Sync) */}
              <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <IndianRupee size={14} className="text-primary" /> Compensation & Roster Mapping (HR → Payroll Sync)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1 text-[11px]">Monthly Gross Wage (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      placeholder="e.g. 75000"
                      value={initialWage}
                      onChange={(e) => setInitialWage(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1 text-[11px]">Salary Structure *</label>
                    <select
                      value={salaryStructureId}
                      onChange={(e) => setSalaryStructureId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium text-xs"
                    >
                      {structures?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1 text-[11px]">Working Schedule / Shift *</label>
                    <select
                      value={workingScheduleId}
                      onChange={(e) => setWorkingScheduleId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium text-xs"
                    >
                      {schedules?.map((sc: any) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name} ({sc.weekly_hours}h)
                        </option>
                      ))}
                    </select>
                  </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-muted-foreground block">Work Location / Office Address</label>
                    <button
                      type="button"
                      onClick={() => {
                        const found = departments?.find((d: any) => String(d.id) === String(departmentId));
                        if (found && DEPT_LOCATION_MAP[found.code]) {
                          setWorkLocation(DEPT_LOCATION_MAP[found.code]);
                        }
                      }}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Use Dept Hub
                    </button>
                  </div>
                  <input
                    type="text"
                    list="work-location-suggestions"
                    placeholder="e.g. Pune Tech Park, Hinjawadi Phase 2, Pune 411057"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                  <datalist id="work-location-suggestions">
                    <option value="Bengaluru, Karnataka" />
                    <option value="Mumbai, Maharashtra" />
                    <option value="Delhi NCR (Gurugram)" />
                    <option value="Hyderabad, Telangana" />
                    <option value="Pune, Maharashtra" />
                    <option value="Chennai, Tamil Nadu" />
                    <option value="Noida, Uttar Pradesh" />
                    <option value="Kolkata, West Bengal" />
                  </datalist>
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

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Pencil size={18} />
                <h3 className="text-foreground">Edit Employee Profile & Address</h3>
              </div>
              <button onClick={() => setEditingEmployee(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
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
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Department</label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
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
                  <label className="font-semibold text-muted-foreground block mb-1">Job Title</label>
                  <select
                    value={editJobId}
                    onChange={(e) => setEditJobId(e.target.value)}
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
                  <label className="font-semibold text-muted-foreground block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="PROBATION">PROBATION</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-muted-foreground block">Work Location / Office Address</label>
                  <button
                    type="button"
                    onClick={() => {
                      const found = departments?.find((d: any) => String(d.id) === String(editDepartmentId));
                      if (found && DEPT_LOCATION_MAP[found.code]) {
                        setEditWorkLocation(DEPT_LOCATION_MAP[found.code]);
                      }
                    }}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Use Dept Hub
                  </button>
                </div>
                <input
                  type="text"
                  list="edit-work-location-suggestions"
                  placeholder="e.g. Flat 402, Green Glen Layout, Bellandur, Bengaluru 560103"
                  value={editWorkLocation}
                  onChange={(e) => setEditWorkLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                />
                <datalist id="edit-work-location-suggestions">
                  <option value="Bengaluru, Karnataka" />
                  <option value="Mumbai, Maharashtra" />
                  <option value="Delhi NCR (Gurugram)" />
                  <option value="Hyderabad, Telangana" />
                  <option value="Pune, Maharashtra" />
                  <option value="Chennai, Tamil Nadu" />
                  <option value="Noida, Uttar Pradesh" />
                  <option value="Kolkata, West Bengal" />
                </datalist>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Custom addresses, street names, and postal pins entered here will remain permanently saved.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm flex items-center gap-1.5"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
