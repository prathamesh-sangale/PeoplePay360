import { useState } from 'react';
import {
  Building,
  DollarSign,
  Clock,
  Calendar,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'company' | 'payroll' | 'attendance' | 'leaves' | 'notifications' | 'security'>('company');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states initialized with realistic Indian defaults
  const [company, setCompany] = useState({
    company_name: 'PeoplePay360 Technologies Private Limited',
    trade_name: 'PeoplePay360 HR & Payroll',
    cin: 'U72200KA2026PTC089123',
    gstin: '29AABCP1234F1Z8',
    pan: 'AABCP1234F',
    tan: 'BLRP12345D',
    epfo_code: 'KN/BNG/0089123/000',
    esic_code: '53000891230000101',
    registered_address: 'Embassy TechVillage, Outer Ring Road, Devarabisanahalli, Bengaluru, Karnataka 560103',
    contact_email: 'compliance@peoplepay360.in',
    hr_phone: '+91 80 4567 8900',
    currency: 'INR (₹ - Indian Rupee)',
    fiscal_year: 'April 01 to March 31',
  });

  const [payroll, setPayroll] = useState({
    epf_ee_rate: 12.0,
    epf_er_rate: 12.0,
    epf_eps_split: 8.33,
    epf_wage_ceiling: 15000,
    esic_limit: 21000,
    esic_ee_rate: 0.75,
    esic_er_rate: 3.25,
    tax_regime: 'NEW_115BAC',
    std_deduction: 75000,
    pt_karnataka: 200,
    pt_maharashtra: 200,
    payroll_cutoff: 25,
    pay_disbursement: 1,
  });

  const [attendance, setAttendance] = useState({
    work_hours: 8.5,
    work_days: 5,
    check_in: '09:30',
    check_out: '18:00',
    grace_minutes: 15,
    half_day_minutes: 120,
    auto_half_day: true,
    biometric_sync: 30,
  });

  const [leaves, setLeaves] = useState({
    annual_pl: 18,
    annual_cl: 12,
    annual_sl: 10,
    maternity_weeks: 26,
    paternity_days: 15,
    max_carryover: 30,
    encashment_allowed: true,
    notice_days: 3,
  });

  const [notifications, setNotifications] = useState({
    email_payslips: true,
    sms_alerts: true,
    contract_expiry_days: 30,
    leave_approval_alerts: true,
    tax_filing_reminders: true,
  });

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Enterprise Organization Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure statutory compliance rules, Indian tax regimes, working policies, and system preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 shadow-md shadow-primary/20 hover:opacity-90 transition-all self-start sm:self-auto"
        >
          <Save size={14} /> Save Configuration
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 size={18} />
          <span className="text-xs font-semibold">Settings updated and applied across PeoplePay360 successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card border border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'company' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building size={14} /> Entity & Registration
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payroll' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign size={14} /> Payroll & Statutory
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'attendance' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock size={14} /> Working Hours & Shifts
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'leaves' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar size={14} /> Leave Policies
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bell size={14} /> Notifications
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield size={14} /> Security & Integrations
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Corporate Entity & Statutory Identification</h3>
              <p className="text-xs text-muted-foreground">Official registered details for payroll payslip & form generation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Company Legal Name</label>
              <input
                type="text"
                value={company.company_name}
                onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Trade / Brand Name</label>
              <input
                type="text"
                value={company.trade_name}
                onChange={(e) => setCompany({ ...company, trade_name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Corporate Identity Number (CIN)</label>
              <input
                type="text"
                value={company.cin}
                onChange={(e) => setCompany({ ...company, cin: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">GSTIN (Karnataka)</label>
              <input
                type="text"
                value={company.gstin}
                onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Company PAN</label>
              <input
                type="text"
                value={company.pan}
                onChange={(e) => setCompany({ ...company, pan: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Tax Deduction Account Number (TAN)</label>
              <input
                type="text"
                value={company.tan}
                onChange={(e) => setCompany({ ...company, tan: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">EPFO Establishment Code</label>
              <input
                type="text"
                value={company.epfo_code}
                onChange={(e) => setCompany({ ...company, epfo_code: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">ESIC Employer Code</label>
              <input
                type="text"
                value={company.esic_code}
                onChange={(e) => setCompany({ ...company, esic_code: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="font-semibold text-foreground">Registered Office Address</label>
              <input
                type="text"
                value={company.registered_address}
                onChange={(e) => setCompany({ ...company, registered_address: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payroll & Statutory */}
      {activeTab === 'payroll' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <IndianRupee size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Indian Statutory Payroll Rules (FY 2026-27)</h3>
              <p className="text-xs text-muted-foreground">Provident Fund, ESIC, Tax Regimes, and Monthly Payroll Cycles</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">EPF Employee Share (%)</label>
              <input
                type="number"
                value={payroll.epf_ee_rate}
                onChange={(e) => setPayroll({ ...payroll, epf_ee_rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">Mandatory 12% on Basic</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">EPF Wage Ceiling (₹/month)</label>
              <input
                type="number"
                value={payroll.epf_wage_ceiling}
                onChange={(e) => setPayroll({ ...payroll, epf_wage_ceiling: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">Statutory statutory limit (₹15,000)</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Default Income Tax Regime</label>
              <select
                value={payroll.tax_regime}
                onChange={(e) => setPayroll({ ...payroll, tax_regime: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              >
                <option value="NEW_115BAC">New Tax Regime (Sec 115BAC Default)</option>
                <option value="OLD_REGIME">Old Tax Regime (With 80C/80D/HRA)</option>
              </select>
              <span className="text-[11px] text-muted-foreground">Budget 2024-26 standard default</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Standard Deduction (₹)</label>
              <input
                type="number"
                value={payroll.std_deduction}
                onChange={(e) => setPayroll({ ...payroll, std_deduction: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">₹75,000 under New Tax Regime</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Payroll Cutoff Day</label>
              <input
                type="number"
                value={payroll.payroll_cutoff}
                onChange={(e) => setPayroll({ ...payroll, payroll_cutoff: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">25th of every month</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Disbursement Day</label>
              <input
                type="number"
                value={payroll.pay_disbursement}
                onChange={(e) => setPayroll({ ...payroll, pay_disbursement: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">1st of following month</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Working Hours & Shifts */}
      {activeTab === 'attendance' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Attendance, Shifts & Biometric Synchronization</h3>
              <p className="text-xs text-muted-foreground">Work week parameters and late arrival penalty rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Daily Working Hours</label>
              <input
                type="number"
                step="0.5"
                value={attendance.work_hours}
                onChange={(e) => setAttendance({ ...attendance, work_hours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Standard Check-In Time</label>
              <input
                type="time"
                value={attendance.check_in}
                onChange={(e) => setAttendance({ ...attendance, check_in: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Standard Check-Out Time</label>
              <input
                type="time"
                value={attendance.check_out}
                onChange={(e) => setAttendance({ ...attendance, check_out: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Late Grace Period (Minutes)</label>
              <input
                type="number"
                value={attendance.grace_minutes}
                onChange={(e) => setAttendance({ ...attendance, grace_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">15 mins grace allowance</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Auto Half-Day Penalty Threshold</label>
              <input
                type="number"
                value={attendance.half_day_minutes}
                onChange={(e) => setAttendance({ ...attendance, half_day_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">After 120 mins delay</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Biometric Sync Interval (Mins)</label>
              <input
                type="number"
                value={attendance.biometric_sync}
                onChange={(e) => setAttendance({ ...attendance, biometric_sync: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Leaves Policy */}
      {activeTab === 'leaves' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Indian Annual Leave Entitlements & Encashment</h3>
              <p className="text-xs text-muted-foreground">Compliant with Factories Act & Shops & Establishments Act</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Privilege / Earned Leave (PL) Quota</label>
              <input
                type="number"
                value={leaves.annual_pl}
                onChange={(e) => setLeaves({ ...leaves, annual_pl: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">18 days per year</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Casual Leave (CL) Quota</label>
              <input
                type="number"
                value={leaves.annual_cl}
                onChange={(e) => setLeaves({ ...leaves, annual_cl: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">12 days per year</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Sick Leave (SL) Quota</label>
              <input
                type="number"
                value={leaves.annual_sl}
                onChange={(e) => setLeaves({ ...leaves, annual_sl: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">10 days per year</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Maternity Leave (Weeks)</label>
              <input
                type="number"
                value={leaves.maternity_weeks}
                onChange={(e) => setLeaves({ ...leaves, maternity_weeks: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
              <span className="text-[11px] text-muted-foreground">26 weeks under Maternity Benefit Act</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Max Carryover Limit (Days)</label>
              <input
                type="number"
                value={leaves.max_carryover}
                onChange={(e) => setLeaves({ ...leaves, max_carryover: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Notifications */}
      {activeTab === 'notifications' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Automated Alerts & Dispatch Channels</h3>
              <p className="text-xs text-muted-foreground">Email and SMS notifications for payslips, approvals, and reminders</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border cursor-pointer hover:bg-accent/30 transition-colors">
              <div>
                <span className="font-semibold text-xs text-foreground block">Automatic Email Salary Slip Dispatch</span>
                <span className="text-[11px] text-muted-foreground">Send password-protected PDF payslips upon monthly payrun finalization</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.email_payslips}
                onChange={(e) => setNotifications({ ...notifications, email_payslips: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border cursor-pointer hover:bg-accent/30 transition-colors">
              <div>
                <span className="font-semibold text-xs text-foreground block">SMS Salary Credit Alert</span>
                <span className="text-[11px] text-muted-foreground">Send SMS instant notification to employee phone on disbursement date</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.sms_alerts}
                onChange={(e) => setNotifications({ ...notifications, sms_alerts: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border cursor-pointer hover:bg-accent/30 transition-colors">
              <div>
                <span className="font-semibold text-xs text-foreground block">Contract Expiry & Renewal Reminders</span>
                <span className="text-[11px] text-muted-foreground">Alert HR Managers 30 days prior to contract expiration</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.leave_approval_alerts}
                onChange={(e) => setNotifications({ ...notifications, leave_approval_alerts: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>
      )}

      {/* Tab 6: Security & Integrations */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Security, MFA & Banking Integrations</h3>
              <p className="text-xs text-muted-foreground">Corporate netbanking gateways and identity verification settings</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">HDFC / ICICI Corporate Banking API</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
              </div>
              <p className="text-muted-foreground">Enables automated bulk NEFT / RTGS / IMPS salary transfers via Direct Host-to-Host connectivity.</p>
            </div>

            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Bank Account Penny-Drop Verification</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Enabled</span>
              </div>
              <p className="text-muted-foreground">Validates employee beneficiary bank accounts and beneficiary name match before first pay disbursement.</p>
            </div>

            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Statutory Data Retention Policy</span>
                <span className="font-bold text-foreground">7 Years (Indian Companies Act)</span>
              </div>
              <p className="text-muted-foreground">Audit logs, payslips, and payroll records are cryptographically archived for mandatory statutory audits.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
