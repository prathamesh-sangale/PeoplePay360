import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

base_dir = r"C:\Users\Acer\Documents\PeoplePay360\frontend"

# 1. CSS Design Tokens
index_css = """
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 248 11% 13%; /* #1E1D23 */
    --foreground: 0 0% 97%; /* #F8F8F8 */
    --card: 248 11% 16%;
    --card-foreground: 0 0% 97%;
    --popover: 248 11% 16%;
    --popover-foreground: 0 0% 97%;
    --primary: 321 23% 41%; /* #80506F */
    --primary-foreground: 0 0% 97%;
    --secondary: 217 24% 21%; /* #293343 */
    --secondary-foreground: 0 0% 97%;
    --muted: 248 11% 20%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 322 18% 51%; /* #9A6B89 */
    --accent-foreground: 0 0% 97%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 97%;
    --border: 248 11% 20%;
    --input: 248 11% 20%;
    --ring: 321 23% 41%;
    --radius: 0.3rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
"""
create_file(os.path.join(base_dir, "src/index.css"), index_css)

# 2. Tailwind Config (simple v3 style for now, or v4 if already on it)
tailwind_config = """
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
"""
create_file(os.path.join(base_dir, "tailwind.config.js"), tailwind_config)

# 3. Create placeholder pages
pages = [
    "Dashboard", "Employees", "EmployeeDetail", "Contracts", "ContractDetail",
    "Schedules", "Attendance", "AttendanceDetail", "TimeOff", "TimeOffDetail",
    "Payruns", "PayrunDetail", "Payslips", "PayslipDetail", "SalaryStructures",
    "SalaryRules", "Reports", "Notifications", "Users", "UserDetail", "Roles",
    "Settings", "AuditLogs"
]

for page in pages:
    page_content = f"""
export default function {page}() {{
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{page}</h1>
      <p className="text-muted-foreground">Placeholder for {page} page.</p>
    </div>
  );
}}
"""
    create_file(os.path.join(base_dir, f"src/pages/{page}.tsx"), page_content)

# 4. App Shell & Layout
app_shell = """
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
"""
create_file(os.path.join(base_dir, "src/components/layout/AppShell.tsx"), app_shell)

sidebar = """
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
"""
create_file(os.path.join(base_dir, "src/components/layout/Sidebar.tsx"), sidebar)

header = """
import { Bell, Search, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        {/* Breadcrumb placeholder */}
        <span className="text-sm text-muted-foreground">Home / Dashboard</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Global search..." className="h-9 w-64 rounded-md border border-input bg-background px-9 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
        <button className="p-2 rounded-full hover:bg-accent/50 transition-colors">
          <Bell size={20} />
        </button>
        <button className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-accent/50 transition-colors border border-border bg-background">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-medium">U</div>
          <span className="text-sm font-medium">Admin</span>
        </button>
      </div>
    </header>
  );
}
"""
create_file(os.path.join(base_dir, "src/components/layout/Header.tsx"), header)

# 5. Routing
routes = """
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';

import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import EmployeeDetail from '../pages/EmployeeDetail';
import Contracts from '../pages/Contracts';
import ContractDetail from '../pages/ContractDetail';
import Schedules from '../pages/Schedules';
import Attendance from '../pages/Attendance';
import AttendanceDetail from '../pages/AttendanceDetail';
import TimeOff from '../pages/TimeOff';
import TimeOffDetail from '../pages/TimeOffDetail';
import Payruns from '../pages/Payruns';
import PayrunDetail from '../pages/PayrunDetail';
import Payslips from '../pages/Payslips';
import PayslipDetail from '../pages/PayslipDetail';
import SalaryStructures from '../pages/SalaryStructures';
import SalaryRules from '../pages/SalaryRules';
import Reports from '../pages/Reports';
import Notifications from '../pages/Notifications';
import Users from '../pages/Users';
import UserDetail from '../pages/UserDetail';
import Roles from '../pages/Roles';
import Settings from '../pages/Settings';
import AuditLogs from '../pages/AuditLogs';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      
      { path: 'employees', element: <Employees /> },
      { path: 'employees/:id', element: <EmployeeDetail /> },
      
      { path: 'contracts', element: <Contracts /> },
      { path: 'contracts/:id', element: <ContractDetail /> },
      
      { path: 'schedules', element: <Schedules /> },
      
      { path: 'attendance', element: <Attendance /> },
      { path: 'attendance/:id', element: <AttendanceDetail /> },
      
      { path: 'time-off', element: <TimeOff /> },
      { path: 'time-off/:id', element: <TimeOffDetail /> },
      
      { path: 'payroll/payruns', element: <Payruns /> },
      { path: 'payroll/payruns/:id', element: <PayrunDetail /> },
      { path: 'payroll/payslips', element: <Payslips /> },
      { path: 'payroll/payslips/:id', element: <PayslipDetail /> },
      { path: 'payroll/salary-structures', element: <SalaryStructures /> },
      { path: 'payroll/salary-rules', element: <SalaryRules /> },
      
      { path: 'reports', element: <Reports /> },
      { path: 'notifications', element: <Notifications /> },
      
      { path: 'admin/users', element: <Users /> },
      { path: 'admin/users/:id', element: <UserDetail /> },
      { path: 'admin/roles', element: <Roles /> },
      { path: 'admin/settings', element: <Settings /> },
      { path: 'admin/audit-logs', element: <AuditLogs /> },
    ]
  }
]);
"""
create_file(os.path.join(base_dir, "src/routes/index.tsx"), routes)

# 6. Main App
app_tsx = """
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
"""
create_file(os.path.join(base_dir, "src/App.tsx"), app_tsx)
create_file(os.path.join(base_dir, "src/main.tsx"), """
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
""")

print("Frontend Phase 2 Scaffolding Complete!")
