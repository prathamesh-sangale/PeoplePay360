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
