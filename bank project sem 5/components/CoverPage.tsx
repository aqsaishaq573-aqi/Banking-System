import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Globe, CreditCard } from 'lucide-react';

const CoverPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <nav className="absolute top-0 w-full z-20 px-8 py-6 flex justify-between items-center">
        <div className="text-white text-2xl font-bold tracking-wider brand-font">NEXUS<span className="text-blue-400">BANK</span></div>
        <div className="space-x-4">
          <button onClick={() => navigate('/login')} className="px-6 py-2 text-white font-medium hover:text-blue-200 transition-colors">Login</button>
          <button onClick={() => navigate('/signup')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-lg hover:shadow-blue-500/30">
            Open Account
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative flex-1 flex items-center justify-center text-center px-4 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=1920&auto=format&fit=crop"
            alt="Banking Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/70"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-[fadeIn_0.8s_ease-out]">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Banking for the <br /><span className="text-blue-400">Modern World</span>
          </h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto font-light">
            Experience secure, seamless, and intelligent banking solutions tailored to your lifestyle. Join over 2 million customers trusting Nexus Bank.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-all flex items-center shadow-xl">
              Get Started <ArrowRight className="ml-2" />
            </button>
            <button onClick={() => navigate('/login')} className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all">
              Online Banking Login
            </button>
          </div>
        </div>
      </div>

      {/* Features Strip */}
      <div className="bg-white py-12 px-6 relative z-10 shadow-2xl -mt-20 max-w-6xl mx-auto rounded-xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="p-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Secure Transactions</h3>
          <p className="text-slate-500 text-sm">Enterprise-grade encryption and real-time fraud monitoring.</p>
        </div>
        <div className="p-4 border-l border-r border-slate-100">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Global Access</h3>
          <p className="text-slate-500 text-sm">Manage your funds from anywhere in the world, 24/7.</p>
        </div>
        <div className="p-4">
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Smart Accounts</h3>
          <p className="text-slate-500 text-sm">Savings, Current, and Fixed deposits tailored to your needs.</p>
        </div>
      </div>

      <div className="bg-slate-50 h-24"></div> {/* Spacer */}
    </div>
  );
};

export default CoverPage;