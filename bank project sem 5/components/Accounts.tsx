import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Account, Customer } from '../types';
import { CreditCard, Plus, Loader2, Filter, Search, X, CheckCircle, AlertCircle } from 'lucide-react';

const Accounts = () => {
  const [accounts, setAccounts] = useState<(Account & { customerName?: string, customerCnic?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    contact: '',
    email: '',
    address: '',
    dob: '',
    accountType: 'Savings',
    initialDeposit: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const accs = await api.accounts.list();
      const custs = await api.customers.list();

      const enrichedAccounts = accs.map(acc => {
        const customer = custs.find(c => c.id === acc.customerId);
        return {
          ...acc,
          customerName: customer?.name || 'Unknown',
          customerCnic: customer?.cnic || ''
        };
      });

      setAccounts(enrichedAccounts);
    } catch (err: any) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = accounts.filter(a => {
    const matchesType = filterType === 'All' || a.accountType === filterType;
    const matchesSearch =
      a.accountNo.toString().includes(searchTerm) ||
      (a.customerCnic && a.customerCnic.includes(searchTerm));
    return matchesType && matchesSearch;
  });

  // --- Handlers ---

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.slice(0, 13);
    if (val.length > 12) val = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
    else if (val.length > 5) val = `${val.slice(0, 5)}-${val.slice(5)}`;
    setFormData({ ...formData, cnic: val });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent numbers
    const val = e.target.value;
    if (!/\d/.test(val) && val.length <= 30) {
      setFormData({ ...formData, name: val });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation Rules
    if (formData.name.trim().length === 0) {
      setFormError("Name is required."); return;
    }
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(formData.cnic)) {
      setFormError("CNIC must be in format 12345-1234567-1"); return;
    }
    const contactRegex = /^\d{11}$/;
    if (!contactRegex.test(formData.contact)) {
      setFormError("Contact must be exactly 11 digits."); return;
    }
    if (Number(formData.initialDeposit) < 0) {
      setFormError("Initial deposit cannot be negative."); return;
    }

    try {
      // Create Customer and Account via API
      const newCust = await api.customers.create({
        name: formData.name,
        cnic: formData.cnic,
        contact: formData.contact,
        email: formData.email,
        address: formData.address,
        dob: formData.dob,
        accountType: formData.accountType as any,
        initialDeposit: Number(formData.initialDeposit) || 0
      });

      setIsAddModalOpen(false);
      setFormData({ name: '', cnic: '', contact: '', email: '', address: '', dob: '', accountType: 'Savings', initialDeposit: '' });
      alert("Account and Customer Profile created successfully.");
      loadData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Accounts</h1>
          <p className="text-slate-500">Master list of all banking accounts.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm font-medium transition-colors"
        >
          <Plus size={18} className="mr-2" />
          New Account
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row border-b border-slate-100">
          <div className="flex flex-1">
            {['All', 'Savings', 'Current'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${filterType === type
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                placeholder="Search Account # or CNIC..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Account No</th>
                <th className="px-6 py-4 border-b border-slate-100">Customer</th>
                <th className="px-6 py-4 border-b border-slate-100">Type</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No accounts found matching criteria.</td></tr>
              ) : filtered.map((acc) => (
                <tr key={acc.accountNo} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">ACC-{acc.accountNo}</td>
                  <td className="px-6 py-4 text-slate-800 font-medium">
                    {acc.customerName}
                    <div className="text-xs text-slate-400 font-mono">{acc.customerCnic}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${acc.accountType === 'Savings' ? 'bg-indigo-100 text-indigo-700' :
                      acc.accountType === 'Current' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                      {acc.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center text-sm ${acc.status === 'Active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {acc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                    ${acc.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW ACCOUNT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Open New Account</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded flex items-center border border-red-100">
                  <AlertCircle size={16} className="mr-2" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Details</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name (Letters Only, Max 30)</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. John Doe"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={handleNameChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNIC (xxxxx-xxxxxxx-x)</label>
                  <input
                    required
                    type="text"
                    placeholder="35202-1234567-1"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={formData.cnic}
                    onChange={handleCnicChange}
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact (11 Digits)</label>
                  <input
                    required
                    type="text"
                    placeholder="03001234567"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    placeholder="user@example.com"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                  <input
                    required
                    type="text"
                    placeholder="House #, Street, City"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    required
                    type="date"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>

                <div className="col-span-2 mt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Configuration</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
                  <select
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.accountType}
                    onChange={e => setFormData({ ...formData, accountType: e.target.value })}
                  >
                    <option value="Savings">Savings Account</option>
                    <option value="Current">Current Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Deposit ($)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="0.00"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={formData.initialDeposit}
                    onChange={e => setFormData({ ...formData, initialDeposit: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-2 p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                <strong>Note:</strong> Savings accounts with less than $10 initial deposit will be created as <strong>Inactive</strong>.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Accounts;