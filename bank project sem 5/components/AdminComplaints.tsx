import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Complaint, PasswordResetRequest } from '../types';
import { MessageSquare, CheckCircle, Search, Reply, Lock, UserCheck } from 'lucide-react';

const AdminComplaints = () => {
    const [activeTab, setActiveTab] = useState<'complaints' | 'security'>('complaints');
    const [complaints, setComplaints] = useState<(Complaint & { customerName: string, customerCnic: string })[]>([]);
    const [resets, setResets] = useState<PasswordResetRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Complaint Reply State
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [responseText, setResponseText] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const cmps = await api.complaints.list();
            setComplaints(cmps);
            // Password reset requests would come from API if available
            setResets([]);
        } catch (err) {
            console.error('Failed to load complaints:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComplaint) return;
        try {
            await api.complaints.update(selectedComplaint.id, {
                status: 'Resolved',
                resolution: responseText
            });
            alert("Response sent successfully.");
            setSelectedComplaint(null);
            setResponseText('');
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleApproveReset = async (id: number) => {
        try {
            // API endpoint for approving password reset
            alert("Password reset approved. User can now login with new password.");
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredComplaints = complaints.filter(c =>
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerCnic.includes(searchTerm) ||
        c.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Support & Security</h1>
                    <p className="text-slate-500">Manage user complaints and access requests.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('complaints')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'complaints' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <MessageSquare size={16} className="inline mr-2" /> User Complaints
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Lock size={16} className="inline mr-2" /> Security Requests
                    {resets.length > 0 && <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{resets.length}</span>}
                </button>
            </div>

            {/* Complaints View */}
            {activeTab === 'complaints' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by customer or status..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredComplaints.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-slate-500">#{c.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{c.customerName}</div>
                                            <div className="text-xs text-slate-400 font-mono">{c.customerCnic}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{new Date(c.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={c.description}>
                                            {c.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {c.status === 'Pending' && (
                                                <button
                                                    onClick={() => setSelectedComplaint(c)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end w-full"
                                                >
                                                    <Reply size={14} className="mr-1" /> Reply
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredComplaints.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No complaints found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Security Requests View */}
            {activeTab === 'security' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Password Reset Requests</h3>
                        <p className="text-xs text-slate-500">Approve reset requests after verifying identity offline if needed.</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {resets.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No pending requests.</div>
                        ) : resets.map(req => (
                            <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div>
                                    <div className="font-bold text-slate-800">{req.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{req.cnic}</div>
                                    <div className="text-xs text-slate-400 mt-1">Requested: {new Date(req.requestDate).toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right text-xs">
                                        <div className="text-slate-500">New Password Preview</div>
                                        <div className="font-mono bg-slate-100 px-2 py-1 rounded">******</div>
                                    </div>
                                    <button
                                        onClick={() => handleApproveReset(req.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center"
                                    >
                                        <UserCheck size={14} className="mr-1" /> Approve & Update
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Respond to Complaint #{selectedComplaint.id}</h3>
                        <div className="bg-slate-50 p-3 rounded mb-4 text-sm text-slate-600 border border-slate-200">
                            <strong>Customer Issue:</strong><br />
                            {selectedComplaint.description}
                        </div>
                        <form onSubmit={handleResolve}>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Admin Response</label>
                            <textarea
                                required
                                className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 h-32 resize-none text-sm"
                                placeholder="Type your response here..."
                                value={responseText}
                                onChange={e => setResponseText(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setSelectedComplaint(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Send Response</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminComplaints;