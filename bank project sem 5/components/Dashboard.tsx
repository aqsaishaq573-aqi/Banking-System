import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Customer, Account, Transaction } from '../types';
import { Users, CreditCard, ArrowRightLeft, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const StatCard = ({ title, value, icon: Icon, trend, color, subText }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
        <TrendingUp size={14} className="mr-1" /> {trend}
      </span>
      <span className="text-slate-400 ml-2">{subText}</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    customers: 0,
    accounts: 0,
    totalLiquidity: 0,
    transactions: 0,
    deposits: 0,
    withdrawals: 0
  });
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const customers = await api.customers.list();
        const accounts = await api.accounts.list();
        const transactions = await api.transactions.list();

        const totalLiquidity = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        const deposits = transactions.filter(t => t.type === 'Deposit').length;
        const withdrawals = transactions.filter(t => t.type === 'Withdrawal').length;

        setStats({
          customers: customers.length,
          accounts: accounts.length,
          totalLiquidity,
          transactions: transactions.length,
          deposits,
          withdrawals
        });

        setRecentTx(transactions.slice(0, 10));

        // Generate chart data from transactions
        const weekData = [
          { name: 'Mon', deposits: 0, withdrawals: 0 },
          { name: 'Tue', deposits: 0, withdrawals: 0 },
          { name: 'Wed', deposits: 0, withdrawals: 0 },
          { name: 'Thu', deposits: 0, withdrawals: 0 },
          { name: 'Fri', deposits: 0, withdrawals: 0 },
          { name: 'Sat', deposits: 0, withdrawals: 0 },
          { name: 'Sun', deposits: 0, withdrawals: 0 },
        ];

        transactions.forEach((txn: any) => {
          if (txn.createdAt) {
            const date = new Date(txn.createdAt);
            const dayIndex = date.getDay();
            const amount = txn.amount || 0;

            if (txn.type === 'Deposit') {
              weekData[dayIndex].deposits += amount;
            } else if (txn.type === 'Withdrawal') {
              weekData[dayIndex].withdrawals += amount;
            }
          }
        });

        setChartData(weekData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 brand-font">Executive Overview</h1>
          <p className="text-slate-500 mt-1">Real-time banking operations and liquidity metrics.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Live System</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats.customers}
          icon={Users}
          trend="+12%"
          color="bg-blue-600"
          subText="vs last week"
        />
        <StatCard
          title="Active Accounts"
          value={stats.accounts}
          icon={CreditCard}
          trend="+5%"
          color="bg-indigo-600"
          subText="new accounts"
        />
        <StatCard
          title="Total Liquidity"
          value={`$${(stats.totalLiquidity).toLocaleString()}`}
          icon={DollarSign}
          trend="+8.2%"
          color="bg-amber-500"
          subText="assets under mgmt"
        />
        <StatCard
          title="All Transactions"
          value={stats.transactions}
          icon={Activity}
          trend={`${stats.deposits} deposits, ${stats.withdrawals} withdrawals`}
          color="bg-purple-600"
          subText="processed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Financial Flow (Weekly)</h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>Deposits</div>
              <div className="flex items-center"><span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>Withdrawals</div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area type="monotone" dataKey="deposits" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDep)" />
                <Area type="monotone" dataKey="withdrawals" stroke="#f87171" strokeWidth={3} fillOpacity={1} fill="url(#colorWith)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentTx.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic">No transactions recorded yet.</div>
            ) : (
              recentTx.map((tx: any, idx: number) => (
                <div key={idx} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all cursor-default border-l-4" style={{
                  borderColor: tx.type === 'Deposit' ? '#22c55e' : tx.type === 'Withdrawal' ? '#ef4444' : '#3b82f6'
                }}>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-full transition-colors ${tx.type === 'Deposit' ? 'bg-green-100 text-green-600 group-hover:bg-green-200' :
                      tx.type === 'Withdrawal' ? 'bg-red-100 text-red-600 group-hover:bg-red-200' :
                        'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                      }`}>
                      {tx.type === 'Deposit' ? <ArrowDownRight size={18} /> :
                        tx.type === 'Withdrawal' ? <ArrowUpRight size={18} /> :
                          <ArrowRightLeft size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{tx.type}</p>
                      <p className="text-xs text-slate-400 font-mono">Ref: {tx.referenceNo || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold block ${tx.type === 'Deposit' ? 'text-green-600' : tx.type === 'Withdrawal' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                      {tx.type === 'Deposit' ? '+' : '-'}${(tx.amount || 0).toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${tx.status === 'Completed' ? 'text-green-600' : 'text-amber-600'
                      }`}>{tx.status || 'Pending'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;