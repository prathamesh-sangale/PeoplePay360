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
    user_id: '3',
    username: 'rohan.mehta',
    email: 'rohan.mehta@peoplepay360.in',
    full_name: 'Rohan Mehta',
    role: 'PAYROLL',
    raw_role: 'PAYROLL',
    display_title: 'Payroll Department',
    description: 'Salary structures, rules, payrun computation, payslips, ECR compliance.',
    badge_color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    avatar_initials: 'RM',
    department: 'Finance & Accounts',
    employee_id: '3',
    employee_code: 'EMP-IND-003',
  },
  {
    user_id: '5',
    username: 'ananya.iyer',
    email: 'ananya.iyer@peoplepay360.in',
    full_name: 'Ananya Iyer',
    role: 'EMPLOYEE',
    raw_role: 'EMPLOYEE',
    display_title: 'Employee Self-Service',
    description: 'My profile, clock in/out, unified leave balances, my payslips & tax details.',
    badge_color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    avatar_initials: 'AI',
    department: 'Engineering & Technology',
    employee_id: '5',
    employee_code: 'EMP-IND-005',
  },
];

interface RoleContextType {
  currentPersona: UserPersona;
  currentRole: RoleType;
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
    // Default to HR persona for testing the HR Portal or Admin
    return CANONICAL_PERSONAS[1]; // Priya Patel (HR)
  });

  useEffect(() => {
    localStorage.setItem('peoplepay360_active_persona', JSON.stringify(currentPersona));
    localStorage.setItem('peoplepay360_active_role', currentPersona.role);
    localStorage.setItem('peoplepay360_active_user_id', currentPersona.user_id);
  }, [currentPersona]);

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
