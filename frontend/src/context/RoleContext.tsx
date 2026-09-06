import React, { createContext, useContext, useState, useEffect } from 'react';

export type RoleType = 'ADMIN' | 'HR' | 'PAYROLL' | 'EMPLOYEE';

export interface UserPersona {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: RoleType;
  raw_role: string;
  display_title: string;
  description: string;
  badge_color: string;
  avatar_initials: string;
  department: string;
  employee_id?: string | null;
  employee_code?: string | null;
}

export const CANONICAL_PERSONAS: UserPersona[] = [
  {
    user_id: '1',
    username: 'aarav.sharma',
    email: 'aarav.sharma@peoplepay360.in',
    full_name: 'Aarav Sharma',
    role: 'ADMIN',
    raw_role: 'ADMIN',
    display_title: 'System Administrator',
    description: 'Full system oversight, User/Role admin, Settings, Audit logs, Global controls.',
    badge_color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    avatar_initials: 'AS',
    department: 'Engineering & Technology',
    employee_id: '1',
    employee_code: 'EMP-IND-001',
  },
  {
    user_id: '2',
    username: 'priya.patel',
    email: 'priya.patel@peoplepay360.in',
    full_name: 'Priya Patel',
    role: 'HR',
    raw_role: 'HR',
    display_title: 'Human Resources Lead',
    description: 'Complete employee lifecycle, contracts, attendance, time off, schedules, bank details.',
    badge_color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    avatar_initials: 'PP',
    department: 'Human Resources & Talent',
    employee_id: '2',
    employee_code: 'EMP-IND-002',
  },
  {
    user_id: '11',
    username: 'pooja.deshmukh',
    email: 'pooja.deshmukh@peoplepay360.in',
    full_name: 'Pooja Deshmukh',
    role: 'HR',
    raw_role: 'HR',
    display_title: 'HR Operations & Talent Partner',
    description: 'Workforce onboarding, leave approvals, attendance tracking, and contract compliance.',
    badge_color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    avatar_initials: 'PD',
    department: 'Human Resources & Talent',
    employee_id: '11',
    employee_code: 'EMP-IND-011',
  },
  {
    user_id: '3',
    username: 'rohan.mehta',
    email: 'rohan.mehta@peoplepay360.in',
    full_name: 'Rohan Mehta',
    role: 'PAYROLL',
    raw_role: 'PAYROLL',
    display_title: 'Head of Finance & Payroll',
    description: 'Salary structures, rules, payrun computation, payslips, ECR compliance.',
    badge_color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    avatar_initials: 'RM',
    department: 'Finance & Accounts',
    employee_id: '3',
    employee_code: 'EMP-IND-003',
  },
  {
    user_id: '12',
    username: 'amitav.banerjee',
    email: 'amitav.banerjee@peoplepay360.in',
    full_name: 'Amitav Banerjee',
    role: 'PAYROLL',
    raw_role: 'PAYROLL',
    display_title: 'Senior Payroll & Tax Specialist',
    description: 'EPF, PT, TDS deductions, timesheet validation, bank payout disbursements.',
    badge_color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    avatar_initials: 'AB',
    department: 'Finance & Accounts',
    employee_id: '12',
    employee_code: 'EMP-IND-012',
  },
  {
    user_id: '5',
    username: 'ananya.iyer',
    email: 'ananya.iyer@peoplepay360.in',
    full_name: 'Ananya Iyer',
    role: 'EMPLOYEE',
    raw_role: 'EMPLOYEE',
    display_title: 'Employee Self-Service (Sr SDE)',
    description: 'My profile, live duty hours, unified leave balances, my payslips & tax details.',
    badge_color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    avatar_initials: 'AI',
    department: 'Engineering & Technology',
    employee_id: '5',
    employee_code: 'EMP-IND-005',
  },
  {
    user_id: '4',
    username: 'vikram.sengupta',
    email: 'vikram.sengupta@peoplepay360.in',
    full_name: 'Vikram Sengupta',
    role: 'EMPLOYEE',
    raw_role: 'EMPLOYEE',
    display_title: 'Principal Architect (Staff Self-Service)',
    description: 'Personal profile, live duty hours, leave balances, downloaded payslips.',
    badge_color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    avatar_initials: 'VS',
    department: 'Engineering & Technology',
    employee_id: '4',
    employee_code: 'EMP-IND-004',
  },
];

interface RoleContextType {
  currentPersona: UserPersona;
  currentRole: RoleType;
  isAuthenticated: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  switchPersona: (persona: UserPersona) => void;
  switchRole: (role: RoleType) => void;
  personas: UserPersona[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPersona, setCurrentPersona] = useState<UserPersona>(() => {
    const saved = localStorage.getItem('peoplepay360_active_persona');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return CANONICAL_PERSONAS[0]; // Default Aarav Sharma (Admin)
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('peoplepay360_jwt_token') || !!localStorage.getItem('peoplepay360_active_persona');
  });

  useEffect(() => {
    if (isAuthenticated && currentPersona) {
      localStorage.setItem('peoplepay360_active_persona', JSON.stringify(currentPersona));
      localStorage.setItem('peoplepay360_active_role', currentPersona.role);
      localStorage.setItem('peoplepay360_active_user_id', currentPersona.user_id);
    }
  }, [currentPersona, isAuthenticated]);

  const login = (token: string, userData: any) => {
    localStorage.setItem('peoplepay360_jwt_token', token);
    
    const role = (userData.role as RoleType) || 'EMPLOYEE';
    const fullName = userData.full_name || (userData.username ? userData.username.replace('.', ' ').replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase()) : 'Enterprise User');
    
    // Build initials from actual full name
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const initials = nameParts.length >= 2 
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : (nameParts[0]?.slice(0, 2) || 'PP').toUpperCase();

    const getRoleBadge = (r: RoleType) => {
      switch (r) {
        case 'ADMIN': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        case 'HR': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'PAYROLL': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'EMPLOYEE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        default: return 'bg-primary/10 text-primary border-primary/20';
      }
    };

    const getRoleTitle = (r: RoleType) => {
      switch (r) {
        case 'ADMIN': return 'System Administrator';
        case 'HR': return 'Human Resources Lead';
        case 'PAYROLL': return 'Payroll Department';
        case 'EMPLOYEE': return 'Employee Self-Service';
        default: return 'Enterprise User';
      }
    };

    const persona: UserPersona = {
      user_id: String(userData.id || '1'),
      username: userData.username || userData.email?.split('@')[0] || 'user',
      email: userData.email || '',
      full_name: fullName,
      role: role,
      raw_role: userData.raw_role || role,
      display_title: userData.job_title || getRoleTitle(role),
      description: `Active ${role} workspace session`,
      badge_color: getRoleBadge(role),
      avatar_initials: initials,
      department: userData.department || 'Operations',
      employee_id: userData.employee_id || null,
      employee_code: userData.employee_code || null,
    };

    setCurrentPersona(persona);
    setIsAuthenticated(true);
    localStorage.setItem('peoplepay360_active_persona', JSON.stringify(persona));
    localStorage.setItem('peoplepay360_active_role', persona.role);
    localStorage.setItem('peoplepay360_active_user_id', persona.user_id);
  };

  const logout = () => {
    localStorage.removeItem('peoplepay360_jwt_token');
    localStorage.removeItem('peoplepay360_active_persona');
    localStorage.removeItem('peoplepay360_active_role');
    localStorage.removeItem('peoplepay360_active_user_id');
    setIsAuthenticated(false);
  };

  const switchPersona = (persona: UserPersona) => {
    setCurrentPersona(persona);
  };

  const switchRole = (role: RoleType) => {
    const found = CANONICAL_PERSONAS.find((p) => p.role === role);
    if (found) {
      setCurrentPersona(found);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        currentPersona,
        currentRole: currentPersona.role,
        isAuthenticated,
        login,
        logout,
        switchPersona,
        switchRole,
        personas: CANONICAL_PERSONAS,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
