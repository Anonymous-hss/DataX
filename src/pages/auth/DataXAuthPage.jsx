import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Database, 
  User, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Official DataX Brand Logo matching 00.1 Sign in.svg
const DataXLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="shrink-0">
    <path 
      d="M23.2 0H8.8C3.9399 0 0 3.9399 0 8.8V23.2C0 28.0601 3.9399 32 8.8 32H23.2C28.0601 32 32 28.0601 32 23.2V8.8C32 3.9399 28.0601 0 23.2 0Z" 
      fill="#2D55F5"
    />
    <path d="M7.2 24.8L20 7.2H25.2L12.4 24.8H7.2Z" fill="white" />
    <path d="M6.8 7.2H12L15.52 12H10.32L6.8 7.2Z" fill="#D4FF3A" />
    <path d="M16.88 20H22.08L25.6 24.8H20.4L16.88 20Z" fill="#D4FF3A" />
  </svg>
);

export default function DataXAuthPage({ initialMode = 'login', onBackToWebsite }) {
  const [mode, setMode] = useState(initialMode);
  const { isSignedIn, user, login, register, logout, authError, setAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#F5F6FA] text-[#0A0F1F] flex flex-col justify-between font-sans selection:bg-[#2D55F5]/20 selection:text-[#2D55F5]">
      {/* Top Header */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <DataXLogo size={32} />
          <span className="font-bold text-[#0A0F1F] text-[18px] tracking-tight">DataX</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onBackToWebsite) {
              onBackToWebsite();
            } else {
              window.location.href = 'https://dataglow.ai';
            }
          }}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-[#0A0F1F] hover:text-[#2D55F5] transition-colors cursor-pointer"
        >
          <span>← Back to dataglow.ai</span>
        </button>
      </header>

      {/* Main Centered Sign-In Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto w-full">
        {isSignedIn ? (
          /* Already Signed In View - Clean Unified White Card */
          <div className="w-full max-w-[440px] bg-white border border-[#E3E6EE] rounded-[20px] p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto overflow-hidden border-2 border-[#2D55F5]/30 shadow-sm bg-[#EDEFF5] flex items-center justify-center">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user?.fullName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#2D55F5]/10 text-[#2D55F5] font-bold text-xl flex items-center justify-center">
                  {(user?.fullName || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Authenticated
              </div>
              <h2 className="text-xl font-bold text-[#0A0F1F]">{user?.fullName || 'Enterprise Member'}</h2>
              <p className="text-xs text-[#5F6678] font-mono">{user?.primaryEmailAddress?.emailAddress || email}</p>
              <p className="text-[11px] text-[#5F6678] font-medium">
                Workspace Role: <span className="text-[#2D55F5] font-semibold">{user?.role || 'Data Engineer'}</span>
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => { window.location.hash = '#threads'; }}
                className="w-full h-10 rounded-full bg-[#2D55F5] hover:bg-blue-600 text-white font-medium text-xs sm:text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch DataX Workspace</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => logout({ redirectUrl: '#login' })}
                className="w-full h-10 rounded-full border border-[#CDD2DE] hover:bg-[#F5F6FA] text-[#0A0F1F] font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-[#5F6678]" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Register Card */
          <div className="w-full max-w-[440px]">
            <div className="bg-white border border-[#E3E6EE] rounded-[20px] p-7 sm:p-9 shadow-sm">
              {/* Header Title & Subtitle */}
              <div className="mb-6">
                <h1 className="text-[24px] font-bold text-[#0A0F1F] tracking-tight leading-tight">
                  {mode === 'login' ? 'Sign in to DataX' : 'Create your DataX account'}
                </h1>
                <p className="text-xs sm:text-[13px] text-[#5F6678] mt-1">
                  {mode === 'login' 
                    ? 'Access your workflows and the auto-fix engine.' 
                    : 'Start building automated decision pipelines with PostgreSQL isolation.'}
                </p>
              </div>

              {/* Segmented Pill Switcher */}
              <div className="bg-[#EDEFF5] p-1 rounded-full flex mb-6 h-[37px] items-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`flex-1 h-[29px] text-xs font-semibold rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    mode === 'login' 
                      ? 'bg-white text-[#0A0F1F] shadow-sm' 
                      : 'text-[#5F6678] hover:text-[#0A0F1F]'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`flex-1 h-[29px] text-xs font-semibold rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    mode === 'register' 
                      ? 'bg-white text-[#0A0F1F] shadow-sm' 
                      : 'text-[#5F6678] hover:text-[#0A0F1F]'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Error Alert */}
              {authError && (
                <div className="mb-4 p-3 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">
                      Full name
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-[#5F6678] absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full h-10 pl-10 pr-3.5 rounded-[10px] bg-white border border-[#CDD2DE] text-xs sm:text-sm text-[#0A0F1F] placeholder:text-[#5F6678]/60 focus:outline-none focus:border-[#2D55F5] focus:ring-1 focus:ring-[#2D55F5] transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">
                    Work email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#5F6678] absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full h-10 pl-10 pr-3.5 rounded-[10px] bg-white border border-[#CDD2DE] text-xs sm:text-sm text-[#0A0F1F] placeholder:text-[#5F6678]/60 focus:outline-none focus:border-[#2D55F5] focus:ring-1 focus:ring-[#2D55F5] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#5F6678] absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 pl-10 pr-10 rounded-[10px] bg-white border border-[#CDD2DE] text-xs sm:text-sm text-[#0A0F1F] placeholder:text-[#5F6678]/60 focus:outline-none focus:border-[#2D55F5] focus:ring-1 focus:ring-[#2D55F5] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-[#5F6678] hover:text-[#0A0F1F] transition-colors focus:outline-none cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 mt-2 rounded-full bg-[#2D55F5] hover:bg-blue-600 active:scale-[0.99] text-white font-medium text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>{mode === 'login' ? 'Sign in to workspace' : 'Create workspace account'}</span>
                  )}
                </button>

                <div className="pt-2 text-center text-xs text-[#5F6678]">
                  {mode === 'login' ? (
                    <p>
                      Don't have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => switchMode('register')} 
                        className="text-[#2D55F5] hover:underline font-semibold cursor-pointer ml-0.5"
                      >
                        Register
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => switchMode('login')} 
                        className="text-[#2D55F5] hover:underline font-semibold cursor-pointer ml-0.5"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Security / Compliance Badges matching 00.1 Sign in.svg */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#5F6678]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-[#5F6678] inline-block" />
            <span>SOC 2 Type II</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#5F6678]" />
            <span>PostgreSQL</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#5F6678]" />
            <span>JWT RS256</span>
          </span>
        </div>

        {/* Copyright notice matching 00.1 Sign in.svg */}
        <div className="mt-3.5 text-center text-xs text-[#5F6678]">
          © 2026 DataGlow.ai Inc.
        </div>
      </main>
    </div>
  );
}
