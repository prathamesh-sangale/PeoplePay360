import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBankAccounts, createBankAccount, updateBankAccount, setPrimaryBankAccount, getEmployees } from '../lib/api';
import { Landmark, Plus, AlertCircle, Edit3, Star, ShieldCheck, Search } from 'lucide-react';

export default function BankDetails() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountType, setAccountType] = useState('SAVINGS');
  const [isPrimary, setIsPrimary] = useState(true);
  const [formError, setFormError] = useState('');

  const { data: bankAccounts, isLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => getBankAccounts(),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-meta'],
    queryFn: () => getEmployees(),
  });

  const createMutation = useMutation({
    mutationFn: createBankAccount,
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to register bank account.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) => updateBankAccount(id, payload),
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update bank account.');
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: number | string) => setPrimaryBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] });
    },
  });

  const resetForm = () => {
    setEmployeeId('');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setBranchName('');
    setAccountHolderName('');
    setAccountType('SAVINGS');
    setIsPrimary(true);
    setEditingAccount(null);
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    if (employees && employees.length > 0) {
      setEmployeeId(String(employees[0].id));
      setAccountHolderName(employees[0].full_name);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setEmployeeId(String(acc.employee_id));
    setBankName(acc.bank_name);
    setAccountNumber(''); // Keep empty unless entering new number
    setIfscCode(acc.ifsc_code);
    setBranchName(acc.branch_name || '');
    setAccountHolderName(acc.account_holder_name || '');
    setAccountType(acc.account_type || 'SAVINGS');
    setIsPrimary(acc.is_primary);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!employeeId) {
      setFormError('Please select an employee.');
      return;
    }
    if (!bankName.trim()) {
      setFormError('Bank name is required.');
      return;
    }
    if (!editingAccount && !accountNumber.trim()) {
      setFormError('Account number is required.');
      return;
    }
    if (!ifscCode.trim()) {
      setFormError('IFSC code is required.');
      return;
    }

    const payload: any = {
      employee_id: Number(employeeId),
      bank_name: bankName.trim(),
      ifsc_code: ifscCode.trim().toUpperCase(),
      branch_name: branchName.trim() || undefined,
      account_holder_name: accountHolderName.trim() || undefined,
      account_type: accountType,
      is_primary: isPrimary,
    };

    if (accountNumber.trim()) {
      payload.account_number = accountNumber.trim();
    }

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredAccounts = bankAccounts?.filter((b: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.employee_name?.toLowerCase().includes(term) ||
      b.employee_code?.toLowerCase().includes(term) ||
      b.bank_name?.toLowerCase().includes(term) ||
      b.ifsc_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Landmark className="text-primary" size={24} /> Bank Details & Salary Disbursement Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage employee salary accounts, IFSC routing codes, and primary bank designations with secure masking.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
        >
          <Plus size={15} /> Add Bank Account
        </button>
      </div>

      {/* Search & Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by employee, bank, or IFSC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-input bg-card text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-card p-2 rounded-xl border border-border">
          <ShieldCheck size={14} className="text-emerald-500" /> Account numbers are securely masked across all listings (e.g. XXXX XXXX 8912).
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Bank Accounts Table */}
      <div className="p-6 rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Bank Name</th>
                <th className="py-3 px-4">Masked Account Number</th>
                <th className="py-3 px-4">IFSC Code</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Primary Account</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAccounts && filteredAccounts.length > 0 ? (
                filteredAccounts.map((b: any) => (
                  <tr key={b.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {b.employee_name}
                      <div className="text-xs text-muted-foreground font-mono">
                        {b.employee_code} • {b.department}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {b.bank_name}
                      {b.branch_name && <div className="text-[11px] text-muted-foreground">{b.branch_name}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-foreground">
                      {b.masked_account_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-primary font-semibold">
                      {b.ifsc_code}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="px-2 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground border border-border">
                        {b.account_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.is_primary ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <Star size={10} className="fill-emerald-500 text-emerald-500" /> Primary Salary Account
                        </span>
                      ) : (
                        <button
                          onClick={() => setPrimaryMutation.mutate(b.id)}
                          disabled={setPrimaryMutation.isPending}
                          className="text-[11px] text-muted-foreground hover:text-primary underline font-medium"
                        >
                          Set as Primary
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition-all border border-border inline-flex items-center gap-1"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                    No bank accounts registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Landmark size={20} />
                <h3 className="text-foreground">{editingAccount ? 'Edit Bank Account' : 'Register Bank Account'}</h3>
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
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Select Employee</label>
                <select
                  value={employeeId}
                  disabled={!!editingAccount}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    const selected = employees?.find((emp: any) => String(emp.id) === e.target.value);
                    if (selected) setAccountHolderName(selected.full_name);
                  }}
                  className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                >
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.department?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="As registered in bank"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {editingAccount ? 'New Account Number (Optional)' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    required={!editingAccount}
                    placeholder={editingAccount ? 'Leave blank to keep existing' : 'e.g. 50100234567890'}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">IFSC Code (11 Chars)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Branch Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Koramangala 5th Block"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-medium"
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current Account</option>
                    <option value="SALARY">Salary Account</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryAcc"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="primaryAcc" className="font-semibold text-foreground cursor-pointer flex items-center gap-1">
                  <Star size={12} className="text-amber-500 fill-amber-500" /> Set as Primary Salary Account for Monthly Payroll
                </label>
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 shadow-sm"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingAccount ? 'Save Changes' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
