import { Link } from 'react-router-dom';
import { Users, Calendar, Briefcase, FileText, Settings, Bell, DollarSign, LayoutDashboard } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-lg font-bold text-primary">PeoplePay360</h1>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-6 px-4">
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dashboard</h2>
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent/50 text-foreground transition-colors"><LayoutDashboard size={18}/> Dashboard</Link>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">People</h2>
            <Link to="/employees" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent/50 text-foreground transition-colors"><Users size={18}/> Employees</Link>
            <Link to="/contracts" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent/50 text-foreground transition-colors"><Briefcase size={18}/> Contracts</Link>
            <Link to="/schedules" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent/50 text-foreground transition-colors"><Calendar size={18}/> Schedules</Link>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workforce</h2>
            <Link to="/attendance" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent/50 text-foreground transition-colors"><Calendar size={18}/> Attendance</Link>
            <Link to="/time-off" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent/50 text-foreground transition-colors"><Calendar size={18}/> Time Off</Link>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payroll</h2>
            <Link to="/payroll/payruns" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent/50 text-foreground transition-colors"><DollarSign size={18}/> Payruns</Link>
            <Link to="/payroll/payslips" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent/50 text-foreground transition-colors"><FileText size={18}/> Payslips</Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
