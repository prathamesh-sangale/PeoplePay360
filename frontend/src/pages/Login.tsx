import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole, CANONICAL_PERSONAS } from '../context/RoleContext';
import { loginWithCredentials, getSampleEmployees } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Layers,
  Users,
  Briefcase,
  DollarSign,
  User,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useRole();

  const [email, setEmail] = useState('aarav.sharma@peoplepay360.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMoreEmployees, setShowMoreEmployees] = useState(false);

  // Fetch sample employee directory for one-click testing
  const { data: sampleEmployees } = useQuery({
    queryKey: ['sample-employees'],
    queryFn: getSampleEmployees,
  });

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your work email, username, or employee code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loginWithCredentials({
        email: email.trim(),
        password: password.trim() || undefined,
      });

      if (response && response.access_token) {
        login(response.access_token, response.user);
        navigate('/dashboard');
      } else {
        setErrorMessage('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message?.includes('401')
          ? 'Email not registered or invalid credentials. Please check your email or employee code.'
          : err.message || 'Failed to authenticate. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoPersona = (persona: typeof CANONICAL_PERSONAS[0]) => {
    setEmail(persona.email);
    setPassword('password123');
    setErrorMessage(null);
  };

  const handleSelectStaffEmployee = (emp: any) => {
    setEmail(emp.email);
    setPassword('password123');
    setErrorMessage(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield size={16} className="text-indigo-400" />;
      case 'HR':
        return <Briefcase size={16} className="text-blue-400" />;
      case 'PAYROLL':
        return <DollarSign size={16} className="text-emerald-400" />;
      case 'EMPLOYEE':
        return <User size={16} className="text-amber-400" />;
      default:
        return <Users size={16} className="text-primary" />;
    }
  };

  // Preview destination portal based on entered email
  const getDestinationPortal = () => {
    const lower = email.toLowerCase().trim();
    if (lower.includes('aarav') || lower.includes('admin')) {
      return { name: 'Admin Portal & System Overview', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' };
    }
    if (lower.includes('priya') || lower.includes('hr')) {
      return { name: 'HR Workforce Intelligence Portal', color: 'text-blue-400 border-blue-500/20 bg-blue-500/10' };
    }
    if (lower.includes('rohan') || lower.includes('payroll') || lower.includes('finance')) {
      return { name: 'Payroll Processing & Compliance Portal', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' };
    }
    return { name: 'Employee Self-Service (Personal Attendance, Leaves & Payslips)', color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' };
  };

  const destination = getDestinationPortal();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background Glow Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10 transform -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-primary/20 mb-3">
          <Layers size={32} />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          PeoplePay<span className="text-primary">360</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto font-medium">
          Enterprise Indian HR, Attendance, & Statutory Payroll Architecture
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-foreground">Sign In to Your Workspace</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter any employee work email or employee code to open your designated role portal.
            </p>
          </div>

          {/* Destination Portal Preview Banner */}
          {email && (
            <div className={`mb-4 px-3.5 py-2 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${destination.color}`}>
              <Sparkles size={13} className="shrink-0" />
              <span className="truncate">Opens: <strong>{destination.name}</strong></span>
            </div>
          )}

          {/* Quick Access Dropdown Menu */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" /> Quick Access Login Menu
              </span>
              <span className="text-[10px] text-muted-foreground">Select to auto-fill</span>
            </label>
            <div className="relative">
              <select
                value={email}
                onChange={(e) => {
                  const selectedEmail = e.target.value;
                  setEmail(selectedEmail);
                  setPassword('password123');
                  setErrorMessage(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border-2 border-primary/30 text-foreground text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition appearance-none cursor-pointer shadow-xs pr-9"
              >
                <optgroup label="👑 System Administration">
                  <option value="aarav.sharma@peoplepay360.in">
                    Aarav Sharma — System Administrator (ADMIN)
                  </option>
                </optgroup>
                
                <optgroup label="💼 Human Resources & Talent (HR)">
                  <option value="priya.patel@peoplepay360.in">
                    Priya Patel — Head of HR (HR Portal)
                  </option>
                  <option value="pooja.deshmukh@peoplepay360.in">
                    Pooja Deshmukh — HR Operations Lead (HR Portal)
                  </option>
                </optgroup>

                <optgroup label="💰 Finance & Payroll Department">
                  <option value="rohan.mehta@peoplepay360.in">
                    Rohan Mehta — Head of Finance & Payroll (Payroll Portal)
                  </option>
                  <option value="amitav.banerjee@peoplepay360.in">
                    Amitav Banerjee — Senior Payroll & Tax Specialist (Payroll Portal)
                  </option>
                </optgroup>

                <optgroup label="👤 Employee Self-Service">
                  <option value="ananya.iyer@peoplepay360.in">
                    Ananya Iyer — Sr. Software Engineer (Employee Portal)
                  </option>
                  <option value="vikram.sengupta@peoplepay360.in">
                    Vikram Sengupta — Principal Architect (Employee Portal)
                  </option>
                </optgroup>

                {sampleEmployees && sampleEmployees.length > 0 && (
                  <optgroup label="🏢 Enterprise Staff Directory (230 Employees)">
                    {sampleEmployees.map((emp: any) => (
                      <option key={emp.employee_id} value={emp.email}>
                        {emp.full_name} ({emp.employee_code}) — {emp.job_title}, {emp.department}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Work Email or Employee Code
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. ananya.iyer@peoplepay360.in or EMP-IND-004"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition shadow-inner"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Password
                </label>
                <span className="text-[11px] text-muted-foreground">Demo: password123</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying Email & Logging In...
                </>
              ) : (
                <>
                  Sign In with JWT <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Canonical Role Fast Switchers */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" /> Fast Role Selectors
              </span>
              <span className="text-[10px] text-muted-foreground">Click to fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CANONICAL_PERSONAS.map((p) => {
                const isSelected = email.toLowerCase() === p.email.toLowerCase();
                return (
                  <button
                    key={`${p.role}-${p.user_id}`}
                    type="button"
                    onClick={() => handleSelectDemoPersona(p)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-foreground font-semibold shadow-xs'
                        : 'bg-background/80 hover:bg-accent border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-card border border-border shrink-0">
                      {getRoleIcon(p.role)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate block">{p.full_name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.display_title || p.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Expandable Other Employees / Staff Selector */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowMoreEmployees(!showMoreEmployees)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground text-xs font-medium flex items-center justify-between transition-colors cursor-pointer bg-background/50"
              >
                <span className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-primary" />
                  Select Other Employees ({sampleEmployees?.length || 15} staff)
                </span>
                {showMoreEmployees ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showMoreEmployees && sampleEmployees && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-background border border-border">
                  {sampleEmployees.map((emp: any) => {
                    const isSelected = email.toLowerCase() === emp.email.toLowerCase();
                    return (
                      <button
                        key={emp.employee_id}
                        type="button"
                        onClick={() => handleSelectStaffEmployee(emp)}
                        className={`w-full p-2 rounded-lg text-left transition-all flex items-center justify-between text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-accent/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-foreground block truncate">{emp.full_name}</span>
                          <span className="text-[10px] text-muted-foreground block truncate">{emp.email} • {emp.department}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent text-muted-foreground shrink-0 ml-2">
                          {emp.employee_code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Statutory EPF, PT, TDS & ECR Compliance Secured</span>
        </div>
      </div>
    </div>
  );
}