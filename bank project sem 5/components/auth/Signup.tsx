import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, Shield, UserCheck, Lock } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [formData, setFormData] = useState({
        name: '', cnic: '', email: '', password: ''
    });

    // Auto-format CNIC input as user types
    const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ''); // remove non-digits
        if (val.length > 13) val = val.slice(0, 13);

        // Add dashes: 35202-1234567-1
        if (val.length > 12) {
            val = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
        } else if (val.length > 5) {
            val = `${val.slice(0, 5)}-${val.slice(5)}`;
        }

        setFormData({ ...formData, cnic: val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Basic Validation
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(formData.cnic)) {
            setErrors({ cnic: "Format must be xxxxx-xxxxxxx-x" });
            return;
        }
        if (formData.password.length < 6) {
            setErrors({ password: "Password must be at least 6 characters" });
            return;
        }

        setLoading(true);
        try {
            // Register Online Access (Verify against Admin records)
            await api.auth.registerOnlineAccess(
                formData.cnic,
                formData.name,
                formData.email,
                formData.password
            );

            setStep(2); // Success Step
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-[fadeIn_0.5s]">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h2>
                    <p className="text-slate-500 mb-6">Your online banking access has been enabled. You can now login with your credentials.</p>
                    <button onClick={() => navigate('/login')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                {/* Side Panel */}
                <div className="bg-slate-900 text-white p-8 md:w-5/12 flex flex-col justify-between">
                    <div>
                        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white mb-6 flex items-center text-sm"><ArrowLeft size={16} className="mr-1" /> Back to Home</button>
                        <h2 className="text-2xl font-bold brand-font mb-4">Online Banking Registration</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Activate digital access for your existing bank account. We will verify your identity using your CNIC and Name on record.
                        </p>
                    </div>

                    <div className="space-y-4 mt-8">
                        <div className="flex items-center space-x-3 text-sm text-slate-300">
                            <Shield size={18} className="text-blue-500" /> <span>Secure Identity Verification</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-slate-300">
                            <UserCheck size={18} className="text-blue-500" /> <span>Instant Access Activation</span>
                        </div>
                    </div>
                </div>

                {/* Form Panel */}
                <div className="p-8 md:w-7/12">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                            <h3 className="text-blue-800 font-bold text-sm mb-1">Already a customer?</h3>
                            <p className="text-blue-600 text-xs">This form is for existing account holders who want to enable online banking. New customers must visit a branch to open an account.</p>
                        </div>

                        <div>
                            <h3 className="text-slate-800 font-bold mb-4 flex items-center"><UserCheck className="mr-2 text-slate-400" size={20} /> 1. Identity Verification</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">FULL NAME (As per Bank Records)</label>
                                    <input required type="text" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">CNIC</label>
                                    <input required type="text" placeholder="35202-1234567-1"
                                        className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono ${errors.cnic ? 'border-red-500 bg-red-50' : ''}`}
                                        value={formData.cnic} onChange={handleCnicChange} maxLength={15} />
                                    {errors.cnic && <p className="text-xs text-red-500 mt-1">{errors.cnic}</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-slate-800 font-bold mb-4 flex items-center"><Lock className="mr-2 text-slate-400" size={20} /> 2. Setup Login Credentials</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">EMAIL ADDRESS</label>
                                    <input required type="email" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">CREATE PASSWORD</label>
                                    <input required type="password"
                                        className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.password ? 'border-red-500' : ''}`}
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70 shadow-lg">
                            {loading ? 'Verifying Records...' : 'Register for Online Banking'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;