import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Customer } from '../types';
import { Search, UserPlus, Loader2, X, Edit2, Trash2, ShieldAlert, AlertCircle } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<{ [key: number]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', cnic: '', contact: '', email: '', address: '', dob: '', initialAccountType: 'Savings', initialDeposit: ''
  });
  const [addFormError, setAddFormError] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete/Close Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteCnicInput, setDeleteCnicInput] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.customers.list();
      setCustomers(data);

      // Fetch accounts for each customer
      const accountsMap: { [key: number]: any[] } = {};
      for (const customer of data) {
        try {
          const accounts = await api.accounts.getByCustomer(customer.id);
          accountsMap[customer.id] = accounts;
        } catch (err) {
          accountsMap[customer.id] = [];
        }
      }
      setCustomerAccounts(accountsMap);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnic.includes(searchTerm)
  );

  // --- Input Handlers with Validation & Formatting ---

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (val.length > 13) val = val.slice(0, 13);

    // Auto-format: 35202-1234567-1
    if (val.length > 12) {
      val = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
    } else if (val.length > 5) {
      val = `${val.slice(0, 5)}-${val.slice(5)}`;
    }

    setAddForm({ ...addForm, cnic: val });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only letters and spaces, max 30 chars
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val) && val.length <= 30) {
      setAddForm({ ...addForm, name: val });
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits, max 11
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setAddForm({ ...addForm, contact: val });
  };

  // --- Submit Handlers ---

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError('');

    // STRICT VALIDATION RULES
    if (addForm.name.trim().length === 0) {
      setAddFormError("Name is required."); return;
    }
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(addForm.cnic)) {
      setAddFormError("CNIC must be in format xxxxx-xxxxxxx-x"); return;
    }
    const contactRegex = /^\d{11}$/;
    if (!contactRegex.test(addForm.contact)) {
      setAddFormError("Contact must be exactly 11 digits."); return;
    }
    if (Number(addForm.initialDeposit) < 0) {
      setAddFormError("Initial deposit cannot be negative."); return;
    }

    try {
      // Create Customer and linked account via API
      const result = await api.customers.create({
        name: addForm.name,
        cnic: addForm.cnic,
        contact: addForm.contact,
        email: addForm.email,
        address: addForm.address,
        dob: addForm.dob,
        accountType: addForm.initialAccountType as any,
        initialDeposit: Number(addForm.initialDeposit) || 0
      });

      setIsAddModalOpen(false);
      setAddForm({ name: '', cnic: '', contact: '', email: '', address: '', dob: '', initialAccountType: 'Savings', initialDeposit: '' });
      alert("Customer and Account created successfully!");
      fetchCustomers();
    } catch (err: any) {
      setAddFormError(err.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await api.customers.update(editingCustomer.id, {
        name: editingCustomer.name,
        address: editingCustomer.address,
        contact: editingCustomer.contact,
        email: editingCustomer.email
      });
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToDelete) return;
    setDeleteError('');

    try {
      await api.customers.delete(customerToDelete.id);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      setDeleteCnicInput('');
      alert("Relationship closed successfully. All accounts have been closed.");
      fetchCustomers();
    } catch (err: any) {
      setDeleteError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500">Manage customer identities and KYC records.</p>
        </div>
        <button
          onClick={() => { setIsAddModalOpen(true); setAddFormError(''); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all"
        >
          <UserPlus size={18} className="mr-2" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or CNIC..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">ID</th>
                <th className="px-6 py-4 border-b border-slate-100">Name</th>
                <th className="px-6 py-4 border-b border-slate-100">CNIC</th>
                <th className="px-6 py-4 border-b border-slate-100">Account Numbers</th>
                <th className="px-6 py-4 border-b border-slate-100">Contact</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    Loading data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 font-mono text-sm">{customer.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{customer.name}</div>
                          <div className="text-xs text-slate-400">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 bg-slate-50 rounded w-max my-2">{customer.cnic}</td>
                    <td className="px-6 py-4 text-sm">
                      {customerAccounts[customer.id] && customerAccounts[customer.id].length > 0 ? (
                        <div className="space-y-1">
                          {customerAccounts[customer.id].map((acc, idx) => (
                            <div key={idx} className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {acc.accountNo}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No accounts</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.contact}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => { setEditingCustomer(customer); setIsEditModalOpen(true); }} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Edit Customer">
                        <Edit2 size={16} />
                      </button>
                      {customer.status === 'Active' && (
                        <button onClick={() => { setCustomerToDelete(customer); setIsDeleteModalOpen(true); }} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Close Relationship">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
          Showing {filtered.length} records
        </div>
      </div>

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-[fadeIn_0.2s]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Onboard New Customer</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6">
              {addFormError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded flex items-center border border-red-100">
                  <AlertCircle size={16} className="mr-2" /> {addFormError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Details</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name (Letters Only, Max 30)</label>
                  <input
                    required
                    placeholder="e.g. John Doe"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={addForm.name}
                    onChange={handleNameChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNIC (xxxxx-xxxxxxx-x)</label>
                  <input
                    required
                    placeholder="35202-1234567-1"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={addForm.cnic}
                    onChange={handleCnicChange}
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact (11 Digits)</label>
                  <input
                    required
                    placeholder="03001234567"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={addForm.contact}
                    onChange={handleContactChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                  <input
                    required
                    placeholder="Address"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={addForm.address}
                    onChange={e => setAddForm({ ...addForm, address: e.target.value })}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    required
                    type="date"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={addForm.dob}
                    onChange={e => setAddForm({ ...addForm, dob: e.target.value })}
                  />
                </div>

                <div className="col-span-2 mt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Initial Account Setup</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
                  <select
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={addForm.initialAccountType}
                    onChange={e => setAddForm({ ...addForm, initialAccountType: e.target.value })}
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
                    placeholder="Initial Deposit"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={addForm.initialDeposit}
                    onChange={e => setAddForm({ ...addForm, initialDeposit: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-2 p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                <strong>Note:</strong> Savings accounts require $10 min deposit to be Active. Current accounts can be opened with $0.
              </div>

              <div className="col-span-2 pt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow">Create Customer & Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-[fadeIn_0.2s]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Edit Customer Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-bold mb-1">Name</label>
                <input className="w-full border p-2 rounded" value={editingCustomer.name} onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-bold mb-1">Address</label>
                <input className="w-full border p-2 rounded" value={editingCustomer.address} onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 font-bold mb-1">Contact</label>
                  <input className="w-full border p-2 rounded" value={editingCustomer.contact} onChange={e => setEditingCustomer({ ...editingCustomer, contact: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-bold mb-1">Email</label>
                  <input className="w-full border p-2 rounded" value={editingCustomer.email} onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL (Strict Rules) */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s]">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <ShieldAlert className="text-red-600" size={24} />
              <h3 className="font-bold text-lg text-red-700">Close Customer Relationship</h3>
            </div>
            <form onSubmit={handleDeleteSubmit} className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">
                You are about to mark <strong>{customerToDelete.name}</strong> as Inactive and close all associated accounts.
                This action requires strict verification.
              </p>

              <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 space-y-1">
                <p><strong>Rule 1:</strong> Balance must be 0.00 in all accounts.</p>
                <p><strong>Rule 2:</strong> Identity Verification required (Re-enter CNIC).</p>
                <p><strong>Rule 3:</strong> Records will be archived (Soft Delete).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Identity (Enter CNIC)</label>
                <input
                  required
                  placeholder="e.g. 35202-1234567-1"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-red-500"
                  value={deleteCnicInput}
                  onChange={e => setDeleteCnicInput(e.target.value)}
                />
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 whitespace-pre-wrap">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setDeleteError(''); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold">Verify & Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;