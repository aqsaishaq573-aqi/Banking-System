import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Customer, Account, Transaction, Complaint } from '../../types';
import { Bell, CreditCard, Send, FileText, User, LogOut, ArrowUpRight, ArrowDownRight, MessageSquare, Menu, X, CheckCircle, AlertCircle, Loader2, Edit2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = ({ user, onLogout, onProfileUpdate }: { user: Customer, onLogout: () => void, onProfileUpdate: (c: Customer) => void }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<(Transaction & { otherPartyName?: string })[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [newComplaint, setNewComplaint] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Payment State
    const [transferData, setTransferData] = useState({ fromAccount: '', toAccount: '', amount: '' });
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [paymentMsg, setPaymentMsg] = useState('');

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ ...user, password: user.password || '' });
    const [profileMsg, setProfileMsg] = useState('');

    useEffect(() => {
        loadData();
        setProfileForm({ ...user, password: user.password || '' });
    }, [user.id, user]);

    const loadData = async () => {
        try {
            const accs = await api.accounts.getByCustomer(user.id);
            setAccounts(accs);

            // Get transactions per account and aggregate
            let allTxs: any[] = [];
            for (const acc of accs) {
                try {
                    const txs = await api.transactions.getByAccount(acc.accountNo);
                    allTxs = allTxs.concat(txs);
                } catch (err) {
                    // Ignore if account has no transactions
                }
            }

            // Fetch all accounts to map otherPartyName
            const allAccounts = await api.accounts.list();
            const allCustomers = await api.customers.list();
            const myAccountNos = accs.map((a: any) => a.accountNo);

            // Map transactions with otherPartyName
            const txsWithPartyName = allTxs.map((tx: any) => {
                let otherPartyName = 'Unknown';
                // Determine which account is the other party
                const otherAccountNo = myAccountNos.includes(tx.fromAccount) ? tx.toAccount : tx.fromAccount;

                if (otherAccountNo) {
                    const otherAccount = allAccounts.find((acc: any) => acc.accountNo === otherAccountNo);
                    if (otherAccount) {
                        const otherCustomer = allCustomers.find((c: any) => c.id === otherAccount.customerId);
                        if (otherCustomer) {
                            otherPartyName = otherCustomer.name;
                        }
                    }
                }

                return { ...tx, otherPartyName };
            });

            setTransactions(txsWithPartyName);

            // Get complaints (if API supports it)
            const cmps = await api.complaints.list();
            const userComplaints = cmps.filter((c: any) => c.customerId === user.id);
            setComplaints(userComplaints);

            // SYNC PROFILE: Check if Admin has updated the name/details in DB
            const latestProfile = allCustomers.find(c => c.id === user.id);

            // If the name in DB is different from current session, update session immediately
            if (latestProfile && latestProfile.name !== user.name) {
                onProfileUpdate(latestProfile);
            } else if (latestProfile && JSON.stringify(latestProfile) !== JSON.stringify(user)) {
                // Deep check for other field updates (address, contact etc updated by Admin)
                onProfileUpdate(latestProfile);
            }
        } catch (err) {
            console.error('Failed to load customer data:', err);
        }
    };

    const handleComplaintSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.complaints.create({
                customerId: user.id,
                subject: 'Customer Complaint',
                description: newComplaint,
                category: 'General'
            });
            setNewComplaint('');
            alert("Complaint submitted successfully.");
            loadData();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setPaymentStatus('processing');
        try {
            await api.transactions.transfer({
                fromAccountNo: Number(transferData.fromAccount),
                toAccountNo: Number(transferData.toAccount),
                amount: Number(transferData.amount),
                description: `Transfer to ${transferData.toAccount}`
            });
            setPaymentStatus('success');
            setPaymentMsg('Funds transferred successfully!');
            setTransferData({ fromAccount: '', toAccount: '', amount: '' });
            loadData(); // Refresh balances
        } catch (err: any) {
            setPaymentStatus('error');
            setPaymentMsg(err.message);
        }
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg('');
        try {
            const updatedUser = await api.customers.update(user.id, {
                name: profileForm.name,
                email: profileForm.email,
                contact: profileForm.contact,
                address: profileForm.address
            });

            onProfileUpdate({ ...user, ...(updatedUser as any) });
            setIsEditingProfile(false);
            setProfileMsg('Profile updated successfully!');
            setTimeout(() => setProfileMsg(''), 3000);
        } catch (err: any) {
            setProfileMsg('Error: ' + err.message);
        }
    };

    // derived stats
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const lastCredit = transactions.find(t => t.toAccount && accounts.map(a => a.accountNo).includes(t.toAccount));
    const lastDebit = transactions.find(t => t.fromAccount && accounts.map(a => a.accountNo).includes(t.fromAccount));

    const incomingTxs = transactions.filter(t => t.toAccount && accounts.map(a => a.accountNo).includes(t.toAccount));
    const outgoingTxs = transactions.filter(t => t.fromAccount && accounts.map(a => a.accountNo).includes(t.fromAccount));

    const SidebarItem = ({ id, icon: Icon, label }: any) => (
        <button
            onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-6 py-4 transition-colors ${activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-2xl`}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xl font-bold brand-font tracking-wide">NEXUS<span className="text-blue-500">BANK</span></span>
                    <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
                </div>
                <div className="py-4">
                    <SidebarItem id="dashboard" icon={CreditCard} label="My Dashboard" />
                    <SidebarItem id="accounts" icon={CreditCard} label="My Accounts" />
                    <SidebarItem id="payments" icon={Send} label="Payments & Transfer" />
                    <SidebarItem id="statement" icon={FileText} label="Account Statement" />
                    <SidebarItem id="notifications" icon={Bell} label="Notifications" />
                    <SidebarItem id="complaints" icon={MessageSquare} label="Complaints" />
                    <SidebarItem id="profile" icon={User} label="My Profile" />
                </div>
                <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
                    <button onClick={onLogout} className="flex items-center text-slate-400 hover:text-white transition-colors">
                        <LogOut size={18} className="mr-2" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600"><Menu /></button>
                    <div className="flex-1 text-right md:text-left">
                        {/* UPDATED GREETING: Shows Full Name */}
                        <h2 className="text-xl font-bold text-slate-800 brand-font">Hello, {user.name}</h2>
                    </div>
                    <div className="hidden md:block w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold ml-4">
                        {user.name.charAt(0)}
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6 animate-[fadeIn_0.3s]">
                            {/* Balance Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
                                    <p className="text-blue-200 text-sm font-medium mb-1">Total Available Balance</p>
                                    <h3 className="text-3xl font-bold">${totalBalance.toLocaleString()}</h3>
                                    <p className="text-xs text-blue-300 mt-4">Across {accounts.length} accounts</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-slate-500 text-sm">Last Credit</p>
                                        <div className="p-2 bg-green-100 rounded-full text-green-600"><ArrowDownRight size={16} /></div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">{lastCredit ? `+$${lastCredit.amount}` : '$0.00'}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{lastCredit ? new Date(lastCredit.dateTime).toLocaleDateString() : '-'}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-slate-500 text-sm">Last Debit</p>
                                        <div className="p-2 bg-red-100 rounded-full text-red-600"><ArrowUpRight size={16} /></div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">{lastDebit ? `-$${lastDebit.amount}` : '$0.00'}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{lastDebit ? new Date(lastDebit.dateTime).toLocaleDateString() : '-'}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">My Accounts</h3>
                                <div className="space-y-4">
                                    {accounts.map(acc => (
                                        <div key={acc.accountNo} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                                            <div>
                                                <p className="font-bold text-slate-700">{acc.accountType} Account</p>
                                                <p className="text-xs text-slate-500 font-mono">#{acc.accountNo}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-800">${acc.balance.toLocaleString()}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${acc.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{acc.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'accounts' && (
                        <div className="space-y-6 animate-[fadeIn_0.3s]">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">My Accounts</h3>
                                    <p className="text-slate-500 text-sm mt-1">View all your bank accounts and details</p>
                                </div>
                            </div>

                            {accounts.length === 0 ? (
                                <div className="bg-white rounded-xl p-12 text-center border border-slate-100">
                                    <CreditCard className="mx-auto text-slate-300 mb-4" size={48} />
                                    <p className="text-slate-500 text-lg">No accounts found</p>
                                    <p className="text-slate-400 text-sm mt-2">Contact support to open an account</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {accounts.map(acc => (
                                        <div key={acc.accountNo} className="bg-gradient-to-br from-slate-50 to-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <p className="text-slate-500 text-sm font-medium">Account Type</p>
                                                    <h4 className="text-xl font-bold text-slate-800">{acc.accountType} Account</h4>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${acc.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {acc.status}
                                                </span>
                                            </div>

                                            <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                                                <div>
                                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Account Number</p>
                                                    <p className="text-lg font-mono font-bold text-slate-800 mt-1">{acc.accountNo}</p>
                                                    <p className="text-xs text-slate-400 mt-1">13-digit unique identifier</p>
                                                </div>

                                                <div>
                                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Current Balance</p>
                                                    <p className="text-3xl font-bold text-blue-600 mt-1">${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-500 text-xs font-medium">Opening Date</p>
                                                    <p className="text-slate-800 font-semibold mt-1">{acc.openingDate ? new Date(acc.openingDate).toLocaleDateString() : '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs font-medium">Interest Rate</p>
                                                    <p className="text-slate-800 font-semibold mt-1">{acc.interestRate || '0'}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="max-w-2xl mx-auto animate-[fadeIn_0.3s]">
                            <h3 className="text-2xl font-bold text-slate-800 mb-6">Fund Transfer</h3>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                                <form onSubmit={handleTransfer} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">From Account (Source)</label>
                                        <select
                                            required
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={transferData.fromAccount}
                                            onChange={e => setTransferData({ ...transferData, fromAccount: e.target.value })}
                                        >
                                            <option value="">Select Account</option>
                                            {accounts.filter(a => a.status === 'Active').map(a => (
                                                <option key={a.accountNo} value={a.accountNo}>
                                                    {a.accountType} - #{a.accountNo} (${a.balance.toLocaleString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">To Account Number</label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="e.g. 1002"
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={transferData.toAccount}
                                            onChange={e => setTransferData({ ...transferData, toAccount: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                placeholder="0.00"
                                                className="w-full pl-8 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                value={transferData.amount}
                                                onChange={e => setTransferData({ ...transferData, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {paymentStatus === 'error' && (
                                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center">
                                            <AlertCircle size={16} className="mr-2" /> {paymentMsg}
                                        </div>
                                    )}
                                    {paymentStatus === 'success' && (
                                        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center">
                                            <CheckCircle size={16} className="mr-2" /> {paymentMsg}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={paymentStatus === 'processing'}
                                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:bg-slate-300"
                                    >
                                        {paymentStatus === 'processing' ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" size={18} />}
                                        {paymentStatus === 'processing' ? 'Processing Transfer...' : 'Transfer Funds'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-[fadeIn_0.3s]">
                            <h3 className="text-xl font-bold text-slate-800">Transaction Notifications</h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                    <h4 className="font-bold text-green-700 mb-4 flex items-center"><ArrowDownRight className="mr-2" /> Money Received</h4>
                                    <div className="space-y-3">
                                        {incomingTxs.length === 0 && <p className="text-slate-400 text-sm">No incoming transactions.</p>}
                                        {incomingTxs.map(tx => (
                                            <div key={tx.transId} className="p-3 bg-green-50 rounded-lg border border-green-100">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-slate-700">From: {tx.otherPartyName}</span>
                                                    <span className="font-bold text-green-600">+${tx.amount}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{new Date(tx.dateTime).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                    <h4 className="font-bold text-red-700 mb-4 flex items-center"><ArrowUpRight className="mr-2" /> Money Sent</h4>
                                    <div className="space-y-3">
                                        {outgoingTxs.length === 0 && <p className="text-slate-400 text-sm">No outgoing transactions.</p>}
                                        {outgoingTxs.map(tx => (
                                            <div key={tx.transId} className="p-3 bg-red-50 rounded-lg border border-red-100">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-slate-700">To: {tx.otherPartyName}</span>
                                                    <span className="font-bold text-red-600">-${tx.amount}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{new Date(tx.dateTime).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'complaints' && (
                        <div className="space-y-6 animate-[fadeIn_0.3s]">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Submit a Complaint</h3>
                                <form onSubmit={handleComplaintSubmit}>
                                    <textarea
                                        className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4 h-32 resize-none"
                                        placeholder="Describe your issue in detail..."
                                        required
                                        value={newComplaint}
                                        onChange={e => setNewComplaint(e.target.value)}
                                    ></textarea>
                                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
                                        Submit Ticket
                                    </button>
                                </form>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">My Tickets</h3>
                                <div className="space-y-4">
                                    {complaints.length === 0 && <p className="text-slate-400 text-sm">No active complaints.</p>}
                                    {complaints.map(c => (
                                        <div key={c.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                                                <span className="text-xs text-slate-400">{new Date(c.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-slate-800 font-medium text-sm mb-2">{c.description}</p>

                                            {/* Admin Response Section */}
                                            {c.adminResponse && (
                                                <div className="mt-3 p-3 bg-white border border-blue-100 rounded text-sm text-slate-600">
                                                    <p className="text-xs font-bold text-blue-600 mb-1 flex items-center"><CheckCircle size={12} className="mr-1" /> Support Response:</p>
                                                    {c.adminResponse}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="max-w-2xl mx-auto animate-[fadeIn_0.3s] bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mr-6">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                                        <p className="text-slate-500">Customer ID: {user.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {isEditingProfile ? <X size={18} className="mr-1" /> : <Edit2 size={18} className="mr-1" />}
                                    {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                                </button>
                            </div>

                            {isEditingProfile ? (
                                <form onSubmit={handleProfileSave} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <input
                                            type="text" required
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                            value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input
                                                type="email" required
                                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                                value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact</label>
                                            <input
                                                type="text" required
                                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                                value={profileForm.contact} onChange={e => setProfileForm({ ...profileForm, contact: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                        <input
                                            type="text" required
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                            value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                        <input
                                            type="password" required
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                            value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                                        />
                                    </div>

                                    <button type="submit" className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center">
                                        <Save size={18} className="mr-2" /> Save Changes
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                                        <div className="text-sm text-slate-500">CNIC (Read-only)</div>
                                        <div className="text-sm font-medium text-slate-800 font-mono">{user.cnic}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                                        <div className="text-sm text-slate-500">Email</div>
                                        <div className="text-sm font-medium text-slate-800">{user.email}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                                        <div className="text-sm text-slate-500">Contact</div>
                                        <div className="text-sm font-medium text-slate-800">{user.contact}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                                        <div className="text-sm text-slate-500">Address</div>
                                        <div className="text-sm font-medium text-slate-800">{user.address}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-sm text-slate-500">Member Since</div>
                                        <div className="text-sm font-medium text-slate-800">{new Date(user.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}

                            {profileMsg && (
                                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center">
                                    <CheckCircle size={16} className="mr-2" /> {profileMsg}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'statement' && (
                        <div className="space-y-6 animate-[fadeIn_0.3s]">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-slate-800">Account Statement</h3>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                            <th className="px-6 py-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {transactions.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No transactions found.</td></tr>
                                        ) : transactions.map(tx => {
                                            // Determine if Credit or Debit for current user
                                            const myAccountIds = accounts.map(a => a.accountNo);
                                            const isDebit = tx.fromAccount && myAccountIds.includes(tx.fromAccount);

                                            return (
                                                <tr key={tx.transId} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500">{new Date(tx.dateTime).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-700">
                                                        {tx.description}
                                                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                                                            Ref: {tx.transId} • {isDebit ? `To: ${tx.otherPartyName}` : `From: ${tx.otherPartyName}`}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'Deposit' ? 'bg-green-100 text-green-700' :
                                                            tx.type === 'Withdrawal' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                                                        {isDebit ? '-' : '+'}${tx.amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-slate-400 text-xs uppercase">{tx.status}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CustomerDashboard;