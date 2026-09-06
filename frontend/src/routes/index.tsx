import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { useRole } from '../context/RoleContext';
import Login from '../pages/Login';

import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import EmployeeDetail from '../pages/EmployeeDetail';
import Departments from '../pages/Departments';
import Jobs from '../pages/Jobs';
import EmployeeTypes from '../pages/EmployeeTypes';
import BankDetails from '../pages/BankDetails';
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

function ProtectedAppShell() {
  const { isAuthenticated } = useRole();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedAppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      
      // HR & Workforce Management Routes
      { path: 'employees', element: <Employees /> },
      { path: 'employees/:id', element: <EmployeeDetail /> },
      { path: 'departments', element: <Departments /> },
      { path: 'jobs', element: <Jobs /> },
      { path: 'employee-types', element: <EmployeeTypes /> },
      { path: 'bank-details', element: <BankDetails /> },
      { path: 'contracts', element: <Contracts /> },
      { path: 'contracts/:id', element: <ContractDetail /> },
      { path: 'schedules', element: <Schedules /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'attendance/:id', element: <AttendanceDetail /> },
      { path: 'time-off', element: <TimeOff /> },
      { path: 'time-off/:id', element: <TimeOffDetail /> },
      
      // Payroll Routes
      { path: 'payroll/payruns', element: <Payruns /> },
      { path: 'payroll/payruns/:id', element: <PayrunDetail /> },
      { path: 'payroll/payslips', element: <Payslips /> },
      { path: 'payroll/payslips/:id', element: <PayslipDetail /> },
      { path: 'payroll/salary-structures', element: <SalaryStructures /> },
      { path: 'payroll/salary-rules', element: <SalaryRules /> },
      
      // System & Admin Routes
      { path: 'reports', element: <Reports /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'admin/users', element: <Users /> },
      { path: 'admin/users/:id', element: <UserDetail /> },
      { path: 'admin/roles', element: <Roles /> },
      { path: 'admin/settings', element: <Settings /> },
      { path: 'admin/audit-logs', element: <AuditLogs /> },
    ]
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  }
]);
