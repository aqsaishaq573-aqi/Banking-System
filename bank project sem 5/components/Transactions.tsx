import React, { useState } from 'react';
import { api } from '../services/api';
import { ArrowRightLeft, Download, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const Transactions = () => {
  const [type, setType] = useState<'Deposit' | 'Withdrawal' | 'Transfer'>('Deposit');
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
    withdrawalMethod: 'ATM' // Default for Withdrawal
  });
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');
    setMessage('');

    try {
      if (type === 'Deposit') {
        await api.transactions.deposit({
          accountNo: Number(formData.toAccount),
          amount: Number(formData.amount),
          description: formData.description
        });
      } else if (type === 'Withdrawal') {
        await api.transactions.withdraw({
          accountNo: Number(formData.fromAccount),
          amount: Number(formData.amount),
          description: formData.description
        });
      } else if (type === 'Transfer') {
        await api.transactions.transfer({
          fromAccountNo: Number(formData.fromAccount),
          toAccountNo: Number(formData.toAccount),
          amount: Number(formData.amount),
          description: formData.description
        });
      }
      setStatus('success');
      setMessage('Transaction processed successfully!');
      setFormData({ fromAccount: '', toAccount: '', amount: '', description: '', withdrawalMethod: 'ATM' });
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Transaction failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">Transaction Processing</h1>
        <p className="text-slate-500">Securely process deposits, withdrawals, and transfers.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button onClick={() => { setType('Deposit'); setStatus('idle'); }} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center ${type === 'Deposit' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Upload size={18} className="mr-2" /> Deposit
          </button>
          <button onClick={() => { setType('Withdrawal'); setStatus('idle'); }} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center ${type === 'Withdrawal' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Download size={18} className="mr-2" /> Withdrawal
          </button>
          <button onClick={() => { setType('Transfer'); setStatus('idle'); }} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center ${type === 'Transfer' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ArrowRightLeft size={18} className="mr-2" /> Transfer
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Conditional Inputs */}
            {type === 'Transfer' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Account (Sender)</label>
                <input required type="number" placeholder="e.g. 1001" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.fromAccount} onChange={e => setFormData({ ...formData, fromAccount: e.target.value })} />
              </div>
            )}

            {type === 'Withdrawal' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Account</label>
                <input required type="number" placeholder="e.g. 1001" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.fromAccount} onChange={e => setFormData({ ...formData, fromAccount: e.target.value })} />
              </div>
            )}

            {(type === 'Deposit' || type === 'Transfer') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To Account {type === 'Transfer' ? '(Receiver)' : ''}</label>
                <input required type="number" placeholder="e.g. 1002" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.toAccount} onChange={e => setFormData({ ...formData, toAccount: e.target.value })} />
              </div>
            )}

            {/* Withdrawal Method from EERD */}
            {type === 'Withdrawal' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Withdrawal Method</label>
                <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.withdrawalMethod} onChange={e => setFormData({ ...formData, withdrawalMethod: e.target.value })}>
                  <option value="ATM">ATM (Automated Teller Machine)</option>
                  <option value="Online">Online Banking</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Branch">Branch Counter</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input required type="number" min="1" placeholder="0.00" className="w-full pl-8 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
              <input type="text" placeholder="e.g. Monthly Rent" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <button disabled={status === 'processing'} type="submit" className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center transition-all ${status === 'processing' ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}>
              {status === 'processing' ? <><Loader2 className="animate-spin mr-2" /> Processing...</> : `Confirm ${type}`}
            </button>

            {/* Feedback Messages */}
            {status === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center animate-[fadeIn_0.5s]">
                <CheckCircle className="mr-3" size={20} />
                {message}
              </div>
            )}
            {status === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center animate-[fadeIn_0.5s]">
                <AlertCircle className="mr-3" size={20} />
                {message}
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default Transactions;