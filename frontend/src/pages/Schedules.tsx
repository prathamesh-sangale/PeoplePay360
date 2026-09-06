import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  assignSchedule,
  getScheduleAssignments,
  getEmployees,
} from '../lib/api';
import { formatTime12Hour } from '../lib/formatters';
import { Clock, Plus, Users, Layers, AlertCircle, Edit3 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { day_of_week: 0, day_name: 'Monday' },
  { day_of_week: 1, day_name: 'Tuesday' },
  { day_of_week: 2, day_name: 'Wednesday' },
  { day_of_week: 3, day_name: 'Thursday' },
  { day_of_week: 4, day_name: 'Friday' },
  { day_of_week: 5, day_name: 'Saturday' },
  { day_of_week: 6, day_name: 'Sunday' },
];

export default function Schedules() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'schedules' | 'assignments'>('schedules');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingSched, setEditingSched] = useState<any | null>(null);

  // Create Form State
  const [schedName, setSchedName] = useState('');
  const [schedCode, setSchedCode] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(40);
  const [daysState, setDaysState] = useState<any[]>(
    DAYS_OF_WEEK.map((d) => ({
      day_of_week: d.day_of_week,
      day_name: d.day_name,
      start_time: '09:00',
      end_time: '18:00',
      is_working_day: d.day_of_week < 5,
    }))
  );
  const [createError, setCreateError] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editWeeklyHours, setEditWeeklyHours] = useState(40);
  const [editDaysState, setEditDaysState] = useState<any[]>([]);
  const [editError, setEditError] = useState('');

  // Assign Form State
  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignSchedId, setAssignSchedId] = useState('');
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignError, setAssignError] = useState('');

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  const { data: assignments } = useQuery({
    queryKey: ['schedule-assignments'],
    queryFn: getScheduleAssignments,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-meta'],
    queryFn: () => getEmployees(),
  });

  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setSchedName('');
      setSchedCode('');
      setWeeklyHours(40);
      setCreateError('');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (err: any) => {
      setCreateError(err.message || 'Failed to create schedule.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: any }) => updateSchedule(id, payload),
    onSuccess: () => {
      setIsEditModalOpen(false);
      setEditingSched(null);
      setEditError('');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-assignments'] });
    },
    onError: (err: any) => {
      setEditError(err.message || 'Failed to update schedule.');
    },
  });

  const assignMutation = useMutation({
    mutationFn: assignSchedule,
    onSuccess: () => {
      setIsAssignModalOpen(false);
      setAssignError('');
      queryClient.invalidateQueries({ queryKey: ['schedule-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (err: any) => {
      setAssignError(err.message || 'Failed to assign schedule.');
    },
  });

  const handleOpenEdit = (sched: any) => {
    setEditingSched(sched);
    setEditName(sched.name);
    setEditCode(sched.code);
    setEditWeeklyHours(Number(sched.weekly_hours || sched.hours_per_week || 40));
    setEditError('');

    const existingDays = sched.days || [];
    const populated = DAYS_OF_WEEK.map((d) => {
      const match = existingDays.find((ed: any) => ed.day_of_week === d.day_of_week);
      return {
        day_of_week: d.day_of_week,
        day_name: d.day_name,
        start_time: match?.start_time || '09:00',
        end_time: match?.end_time || '18:00',
        is_working_day: match ? match.is_working_day : d.day_of_week < 5,
      };
    });
    setEditDaysState(populated);
    setIsEditModalOpen(true);
  };

  const handleOpenAssign = (scheduleId?: string) => {
    setAssignError('');
    if (employees && employees.length > 0) setAssignEmpId(String(employees[0].id));
    if (scheduleId) {
      setAssignSchedId(scheduleId);
    } else if (schedules && schedules.length > 0) {
      setAssignSchedId(String(schedules[0].id));
    }
    setIsAssignModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!schedName.trim() || !schedCode.trim()) {
      setCreateError('Name and Code are required.');
      return;
    }

    createMutation.mutate({
      name: schedName.trim(),
      code: schedCode.trim().toUpperCase(),
      weekly_hours: Number(weeklyHours),
      days: daysState.map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        is_working_day: d.is_working_day,
      })),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!editingSched) return;
    if (!editName.trim() || !editCode.trim()) {
      setEditError('Name and Code are required.');
      return;
    }

    // Validation: for working days, start_time < end_time
    for (const d of editDaysState) {
      if (d.is_working_day && d.start_time >= d.end_time) {
        setEditError(`${d.day_name}: Start time (${d.start_time}) must be earlier than End time (${d.end_time}).`);
        return;
      }
    }

    updateMutation.mutate({
      id: editingSched.id,
      payload: {
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        weekly_hours: Number(editWeeklyHours),
        days: editDaysState.map((d) => ({
          day_of_week: d.day_of_week,
          start_time: d.start_time,
          end_time: d.end_time,
          is_working_day: d.is_working_day,
        })),
      },
    });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');
    if (!assignEmpId || !assignSchedId) {
      setAssignError('Please select employee and schedule.');
      return;
    }

    assignMutation.mutate({
      employee_id: Number(assignEmpId),
      working_schedule_id: Number(assignSchedId),
      start_date: assignStartDate,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="text-primary" size={24} /> Working Schedules & Rosters
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure shift timetables, weekly working hours, rest days, and employee roster assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenAssign()}
            className="px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 border border-border shadow-xs transition-all flex items-center gap-1.5"
          >
            <Users size={14} /> Assign to Employee
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Schedule
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'schedules'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers size={14} /> Working Schedules ({schedules?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users size={14} /> Assigned Rosters ({assignments?.length || 0})
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Tab: Schedules Cards */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules?.map((s: any) => {
            const workingDays = s.days?.filter((d: any) => d.is_working_day) || [];
            const firstDay = workingDays[0];

            return (
              <div
                key={s.id}
                className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-xs hover:border-primary/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                      {s.code}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs border border-emerald-500/20">
                      <Clock size={13} /> {s.weekly_hours}h / wk
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground">{s.name}</h3>
                    {firstDay && (
                      <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                        <span>Core Timing:</span>
                        <span className="font-semibold text-foreground">
                          {formatTime12Hour(firstDay.start_time)} – {formatTime12Hour(firstDay.end_time)}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Day-by-Day Roster */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold uppercase">
                      <span>Day of Week</span>
                      <span>Timing (12-Hr)</span>
                    </div>
                    <div className="space-y-1.5">
                      {s.days?.map((d: any) => (
                        <div
                          key={d.id}
                          className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-colors ${
                            d.is_working_day
                              ? 'bg-background border-border text-foreground'
                              : 'bg-muted/30 border-dashed border-border/60 text-muted-foreground'
                          }`}
                        >
                          <span className="font-medium">{d.day_name}</span>
                          {d.is_working_day ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-emerald-500">
                                {formatTime12Hour(d.start_time)} – {formatTime12Hour(d.end_time)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium italic text-muted-foreground">
                              Weekly Off
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-primary" /> {s.assigned_employees || 0} assigned
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="px-2.5 py-1 rounded-lg bg-card hover:bg-accent border border-border text-foreground text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Edit3 size={12} className="text-primary" /> Edit
                    </button>
                    <button
                      onClick={() => handleOpenAssign(s.id)}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Assign Roster →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Assignments Table */}
      {activeTab === 'assignments' && (
        <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Assigned Shift</th>
                  <th className="p-3.5">Weekly Hours</th>
                  <th className="p-3.5">Effective Date</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {assignments?.map((a: any) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="p-3.5 font-medium text-foreground">{a.employee_name}</td>
                    <td className="p-3.5">{a.schedule_name}</td>
                    <td className="p-3.5 font-mono">{a.weekly_hours} hrs</td>
                    <td className="p-3.5 font-mono text-muted-foreground">{a.start_date}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SCHEDULE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Layers size={20} />
                <h3 className="text-foreground">Create Working Schedule</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-muted-foreground block mb-1">Schedule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard General Shift (9 AM - 6 PM)"
                    value={schedName}
                    onChange={(e) => setSchedName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Schedule Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GS-40"
                    value={schedCode}
                    onChange={(e) => setSchedCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Weekly Working Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-2">Shift Days & Working Hours</label>
                <div className="space-y-2">
                  {daysState.map((d, index) => (
                    <div key={d.day_of_week} className="flex items-center gap-3 p-2 rounded-xl bg-accent/30 border border-border">
                      <input
                        type="checkbox"
                        id={`day-${d.day_of_week}`}
                        checked={d.is_working_day}
                        onChange={(e) => {
                          const updated = [...daysState];
                          updated[index].is_working_day = e.target.checked;
                          setDaysState(updated);
                        }}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <label htmlFor={`day-${d.day_of_week}`} className="w-24 font-semibold text-foreground">
                        {d.day_name}
                      </label>

                      {d.is_working_day ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={d.start_time}
                            onChange={(e) => {
                              const updated = [...daysState];
                              updated[index].start_time = e.target.value;
                              setDaysState(updated);
                            }}
                            className="p-1 rounded-lg border border-input bg-card text-foreground text-xs font-mono"
                          />
                          <span className="text-muted-foreground">to</span>
                          <input
                            type="time"
                            value={d.end_time}
                            onChange={(e) => {
                              const updated = [...daysState];
                              updated[index].end_time = e.target.value;
                              setDaysState(updated);
                            }}
                            className="p-1 rounded-lg border border-input bg-card text-foreground text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground flex-1">Weekly Off</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SCHEDULE MODAL */}
      {isEditModalOpen && editingSched && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Edit3 size={20} />
                <h3 className="text-foreground">Edit Working Schedule</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-muted-foreground block mb-1">Schedule Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Schedule Code</label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Weekly Working Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={editWeeklyHours}
                  onChange={(e) => setEditWeeklyHours(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-2">Shift Days & Working Hours</label>
                <div className="space-y-2">
                  {editDaysState.map((d, index) => (
                    <div key={d.day_of_week} className="flex items-center gap-3 p-2 rounded-xl bg-accent/30 border border-border">
                      <input
                        type="checkbox"
                        id={`edit-day-${d.day_of_week}`}
                        checked={d.is_working_day}
                        onChange={(e) => {
                          const updated = [...editDaysState];
                          updated[index].is_working_day = e.target.checked;
                          setEditDaysState(updated);
                        }}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <label htmlFor={`edit-day-${d.day_of_week}`} className="w-24 font-semibold text-foreground">
                        {d.day_name}
                      </label>

                      {d.is_working_day ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={d.start_time}
                            onChange={(e) => {
                              const updated = [...editDaysState];
                              updated[index].start_time = e.target.value;
                              setEditDaysState(updated);
                            }}
                            className="p-1 rounded-lg border border-input bg-card text-foreground text-xs font-mono"
                          />
                          <span className="text-muted-foreground">to</span>
                          <input
                            type="time"
                            value={d.end_time}
                            onChange={(e) => {
                              const updated = [...editDaysState];
                              updated[index].end_time = e.target.value;
                              setEditDaysState(updated);
                            }}
                            className="p-1 rounded-lg border border-input bg-card text-foreground text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground flex-1">Weekly Off</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN SCHEDULE MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Users size={20} />
                <h3 className="text-foreground">Assign Shift Schedule</h3>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">
                ✕
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Select Employee</label>
                <select
                  value={assignEmpId}
                  onChange={(e) => setAssignEmpId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.department?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Select Working Schedule</label>
                <select
                  value={assignSchedId}
                  onChange={(e) => setAssignSchedId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  {schedules?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.weekly_hours} hrs/wk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Effective Start Date</label>
                <input
                  type="date"
                  required
                  value={assignStartDate}
                  onChange={(e) => setAssignStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
