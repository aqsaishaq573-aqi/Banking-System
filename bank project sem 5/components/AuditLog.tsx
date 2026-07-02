import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Search, Shield, Clock, Loader2 } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'transactions'>('transactions');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // Fetch audit logs
        const auditData = await api.auditLogs.list();
        setLogs(auditData || []);

        // Fetch transactions
        const txnData = await api.transactions.list();
        setTransactions(txnData || []);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = transactions.filter(t =>
    t.type?.toLowerCase().includes(filter.toLowerCase()) ||
    t.referenceNo?.includes(filter) ||
    (t.fromAccountNo && t.fromAccountNo.toString().includes(filter)) ||
    (t.toAccountNo && t.toAccountNo.toString().includes(filter))
  );

  const filteredAuditLogs = logs.filter(l =>
    l.action?.toLowerCase().includes(filter.toLowerCase()) ||
    l.tableName?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Logs & Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor all transactions, deposits, and withdrawals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 font-medium border-b-2 transition ${activeTab === 'transactions'
            ? 'text-blue-600 border-blue-600'
            : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
        >
          Transactions & Withdrawals
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 font-medium border-b-2 transition ${activeTab === 'all'
            ? 'text-blue-600 border-blue-600'
            : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
        >
          All Audit Logs
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search transactions, references, accounts..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-slate-500">Loading logs...</p>
        </div>
      ) : activeTab === 'transactions' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">From Account</th>
                  <th className="px-6 py-4">To Account</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      {loading ? 'Loading...' : 'No transactions found'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {txn.createdAt ? new Date(txn.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${txn.type === 'Deposit' ? 'bg-green-100 text-green-700' :
                          txn.type === 'Withdrawal' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{txn.fromAccountNo || '-'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{txn.toAccountNo || '-'}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">${txn.amount?.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{txn.referenceNo || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${txn.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          txn.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {txn.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Table</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Record ID</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">{log.action}</td>
                      <td className="px-6 py-4 text-slate-600">{log.tableName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{log.userId || 'SYSTEM'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{log.recordId}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {log.status || 'Recorded'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-400 text-center py-4">
        Auto-refreshing every 3 seconds • {activeTab === 'transactions' ? filteredTransactions.length : filteredAuditLogs.length} records shown
      </div>
    </div>
  );
};

export default AuditLog;