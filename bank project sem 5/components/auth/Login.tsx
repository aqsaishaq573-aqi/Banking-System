import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Lock, User, ArrowRight, Database, Eye, EyeOff, X } from 'lucide-react';

const Login = ({ onLogin }: { onLogin: (user: any, isAdmin: boolean) => void }) => {
    const [cnic, setCnic] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Forgot Password State
    const [showForgot, setShowForgot] = useState(false);
    const [resetName, setResetName] = useState('');
    const [resetCnic, setResetCnic] = useState('');
    const [resetPass, setResetPass] = useState('');
    const [resetMsg, setResetMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Hardcoded Admin Check
            if (cnic === 'admin' && password === 'admin') {
                onLogin({ name: 'System Administrator' }, true);
                navigate('/admin');
                return;
            }

            const response = await api.auth.login(cnic, password);
            if (response.user) {
                onLogin(response.user, false);
                navigate('/customer');
            } else {
                setError('Invalid CNIC or Password');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.auth.requestPasswordReset(resetName, resetCnic, resetPass);
            setResetMsg("Request sent to Admin. You will be able to login once approved.");
            setTimeout(() => { setShowForgot(false); setResetMsg(''); }, 3000);
        } catch (err: any) {
            setResetMsg("Error: " + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
                <div className="bg-slate-900 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 mb-4 text-white">
                        <Database size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white brand-font">Welcome Back</h2>
                    <p className="text-slate-400 text-sm mt-2">Sign in to access your digital banking dashboard</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CNIC / User ID</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="35202-1234567-1"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={cnic}
                                    onChange={(e) => setCnic(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="text-right mt-1">
                                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-blue-600 hover:underline">Forgot Password?</button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In Securely'}
                            {!isLoading && <ArrowRight size={18} className="ml-2" />}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account? {' '}
                        <button onClick={() => navigate('/signup')} className="text-blue-600 font-semibold hover:underline">
                            Register Now
                        </button>
                    </div>
                </div>

                {/* Forgot Password Modal */}
                {showForgot && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s]">
                        <div className="bg-white rounded-xl shadow-2xl w-full p-6 relative">
                            <button onClick={() => setShowForgot(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X /></button>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Reset Password</h3>
                            {resetMsg ? (
                                <div className="p-4 bg-blue-50 text-blue-700 text-center rounded">{resetMsg}</div>
                            ) : (
                                <form onSubmit={handleForgotSubmit} className="space-y-4">
                                    <p className="text-xs text-slate-500">Enter your identity details to request a password reset from the administrator.</p>
                                    <input
                                        required placeholder="Full Name"
                                        className="w-full p-2 border rounded text-sm"
                                        value={resetName} onChange={e => setResetName(e.target.value)}
                                    />
                                    <input
                                        required placeholder="CNIC (xxxxx-xxxxxxx-x)"
                                        className="w-full p-2 border rounded text-sm"
                                        value={resetCnic} onChange={e => setResetCnic(e.target.value)}
                                    />
                                    <input
                                        required type="password" placeholder="New Password"
                                        className="w-full p-2 border rounded text-sm"
                                        value={resetPass} onChange={e => setResetPass(e.target.value)}
                                    />
                                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700">Send Request</button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;