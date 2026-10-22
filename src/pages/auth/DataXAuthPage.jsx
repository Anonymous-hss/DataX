import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  Database, 
  Building2, 
  User, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Mail,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DataXLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
    <rect width="64" height="64" rx="16" fill="#2D55F5" />
    <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
    <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#D4FF3A" />
    <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#D4FF3A" />
  </svg>
);

export default function DataXAuthPage({ initialMode = 'login', onBackToWebsite }) {
  const [mode, setMode] = useState(initialMode);
  const { isSignedIn, user, login, register, logout, authError, setAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('register') || hash.includes('signup') || hash.includes('sign-up')) {
        setMode('register');
      } else if (hash.includes('login') || hash.includes('signin') || hash.includes('sign-in')) {
        setMode('login');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    if (setAuthError) setAuthError(null);
    window.location.hash = `#${newMode}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (setAuthError) setAuthError(null);

    try {
      if (mode === 'login') {
        const res = await login({ email, password });
        if (res.success) {
          window.location.hash = '#threads';
        }
      } else {
        const res = await register({ email, password, fullName });
        if (res.success) {
          window.location.hash = '#threads';
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Dynamic ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between max-w-7xl mx-auto border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <DataXLogo size={34} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg tracking-tight">DataX</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PostgreSQL Enterprise Auth
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Autonomous Decision Platform</p>
          </div>
        </div>

        {onBackToWebsite && (
          <button
            type="button"
            onClick={onBackToWebsite}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to dataglow.ai</span>
          </button>
        )}
      </header>

      {/* Main Auth Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10 max-w-lg mx-auto w-full">
        {isSignedIn ? (
          /* Already Signed In View */
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto overflow-hidden border-2 border-blue-500/50 shadow-lg bg-slate-800 flex items-center justify-center">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user?.fullName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-600/30 text-blue-400 font-bold text-xl flex items-center justify-center">
                  {(user?.fullName || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
              </div>
              <h2 className="text-xl font-bold text-white">{user?.fullName || 'Enterprise Member'}</h2>
              <p className="text-xs text-slate-400 font-mono">{user?.primaryEmailAddress?.emailAddress}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                Role: <span className="text-blue-400 font-bold">{user?.role || 'Data Engineer'}</span>
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => { window.location.hash = '#threads'; }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch DataX Workspace</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => logout({ redirectUrl: '#login' })}
                className="w-full py-2 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Forms */
          <div className="w-full max-w-md">
            <div className="text-center mb-5 space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {mode === 'login' ? 'Sign in to DataX' : 'Create your DataX account'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {mode === 'login' 
                  ? 'Access your enterprise data threads and autonomous auto-fix engine.' 
                  : 'Start building automated decision pipelines with PostgreSQL isolation.'}
              </p>
            </div>

            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-[#2D55F5] text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-[#2D55F5] text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Custom Dark Theme JWT Auth Card */}
            <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-2xl p-6 backdrop-blur-xl space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl text-xs pl-9 pr-3 py-2.5 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">Enterprise Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl text-xs pl-9 pr-3 py-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl text-xs pl-9 pr-3 py-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>



              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-[#2D55F5] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl py-2.5 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Enterprise Account'}</span>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                {mode === 'login' ? (
                  <p>
                    Don't have an enterprise account?{' '}
                    <button type="button" onClick={() => switchMode('register')} className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                      Register
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('login')} className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Enterprise Security Markers */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            SOC 2 Type II
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-500" />
            PostgreSQL DB
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-400" />
            JWT 256-Bit
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-600 border-t border-slate-800/40">
        <p>© 2026 DataGlow.ai Inc. DataX Decision Engine · All rights reserved.</p>
      </footer>
    </div>
  );
}
