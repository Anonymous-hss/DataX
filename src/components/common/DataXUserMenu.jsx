import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Shield, 
  ChevronDown, 
  Building2, 
  Mail, 
  Sun, 
  Moon, 
  Laptop, 
  Volume2, 
  VolumeX, 
  Settings, 
  Key, 
  Clock, 
  Bell, 
  Users, 
  FileText, 
  TrendingUp, 
  Check, 
  Copy, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Server, 
  SlidersHorizontal 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import { 
  getStoredTheme, 
  setThemePreference, 
  isDarkMode, 
  subscribeToThemeChanges 
} from '../../services/themeService';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  playNotificationSound 
} from '../../services/soundEngine';

const ROLES_CATALOG = [
  { id: 'data_engineer', label: 'Lead Data Engineer', badge: 'DE' },
  { id: 'data_steward', label: 'Lead Data Steward', badge: 'DS' },
  { id: 'cdo', label: 'Chief Data Officer (CDO)', badge: 'EXEC' },
  { id: 'compliance_officer', label: 'Compliance & Security Auditor', badge: 'SEC' },
  { id: 'admin', label: 'Platform Administrator', badge: 'ADMIN' }
];

export default function DataXUserMenu({ compact = false }) {
  const { user, isLoaded, isSignedIn, logout, updateUser } = useAuth();
  const { navigateTo } = useNavigation();
  const { activeThread } = useRuleEngine?.() || {};

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Live preferences
  const [themeMode, setThemeMode] = useState(getStoredTheme);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [autoSave, setAutoSave] = useState(() => {
    try {
      const val = localStorage.getItem('datax_autosave_pref');
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  });

  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  // Subscribe to theme updates across the application
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(({ mode }) => {
      setThemeMode(mode);
    });
    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Viewport-aware positioning
  useEffect(() => {
    if (!dropdownOpen) return undefined;

    const updateDropdownPosition = () => {
      const anchor = menuRef.current?.getBoundingClientRect();
      if (!anchor) return;

      const width = Math.min(384, Math.max(0, window.innerWidth - 32)); // 24rem (w-96)
      const height = dropdownRef.current?.offsetHeight || 580;
      setDropdownPosition({
        top: Math.max(16, Math.min(anchor.bottom + 8, window.innerHeight - height - 16)),
        right: Math.max(16, window.innerWidth - anchor.right),
        width,
        maxHeight: Math.max(0, window.innerHeight - 32)
      });
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [dropdownOpen]);

  if (!isLoaded) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
    );
  }

  // Dynamic user data
  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Harshal Sawatkar';
  const email = user?.primaryEmailAddress?.emailAddress || user?.email || 'harshalsawatkar24@gmail.com';
  const currentRoleRaw = user?.role || 'Lead Data Engineer';
  const currentRoleObj = ROLES_CATALOG.find(r => r.id === currentRoleRaw || r.label.toLowerCase() === currentRoleRaw.toLowerCase()) || {
    id: 'data_engineer',
    label: currentRoleRaw.replace(/_/g, ' '),
    badge: 'DE'
  };
  const tenantId = user?.tenantId || 'tenant_aavil_prod_01';
  const initials = (fullName || 'HA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Handlers
  const handleCopyEmail = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    setThemePreference(mode);
    if (soundOn) playNotificationSound('pop');
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playNotificationSound('success');
  };

  const handleToggleAutoSave = () => {
    const next = !autoSave;
    setAutoSave(next);
    try {
      localStorage.setItem('datax_autosave_pref', String(next));
    } catch {}
    if (soundOn) playNotificationSound('pop');
  };

  const handleRoleSelect = (role) => {
    setRoleDropdownOpen(false);
    if (updateUser) {
      updateUser({ role: role.label });
    }
    if (soundOn) playNotificationSound('success');
  };

  const handleNavigateSettings = (tabId = 'general') => {
    try {
      localStorage.setItem('datax_settings_active_tab', tabId);
    } catch {}
    setDropdownOpen(false);
    if (navigateTo) {
      navigateTo('settings');
    } else {
      window.location.hash = '#settings';
    }
  };

  const handleNavigatePage = (pageKey) => {
    setDropdownOpen(false);
    if (navigateTo) {
      navigateTo(pageKey);
    } else {
      window.location.hash = `#${pageKey}`;
    }
  };

  return (
    <div className="relative shrink-0 font-sans" ref={menuRef}>
      {isSignedIn ? (
        <div className="flex min-w-0 items-center gap-2">
          {/* Detailed user profile trigger pill (Adaptive width to prevent navbar crowding) */}
          {!compact && (
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              className="hidden lg:flex min-w-0 items-center gap-2 px-2 py-1 rounded-full border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-all text-left cursor-pointer shadow-xs hover:shadow-sm shrink-0"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="max-w-[96px] xl:max-w-[128px] 2xl:max-w-[168px] min-w-0 leading-tight">
                <p className="truncate text-[11px] font-bold text-slate-900 dark:text-slate-100">{fullName}</p>
                <p className="hidden 2xl:block truncate text-[10px] text-slate-400 dark:text-slate-500 font-mono" title={email}>{email}</p>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* User Button / Compact Avatar for Mobile */}
          <div className={`shrink-0 flex items-center ${compact ? '' : 'lg:hidden'}`}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              className="w-8 h-8 rounded-full border border-blue-400 dark:border-blue-600 ring-2 ring-transparent hover:ring-blue-400 transition-all cursor-pointer flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs"
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={fullName} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{initials}</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (navigateTo) navigateTo('login');
            else window.location.hash = '#login';
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2D55F5] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <span>Sign In / Register</span>
        </button>
      )}

      {/* Enterprise Profile & Preferences Popover Dropdown */}
      {isSignedIn && dropdownOpen && (
        <div
          ref={dropdownRef}
          className="fixed w-84 sm:w-96 max-w-[calc(100vw-2rem)] overflow-y-auto bg-white dark:bg-[#0B1226] rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-2xl p-4 z-50 text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-[#1E293B] font-sans"
          style={{
            top: dropdownPosition?.top ?? 88,
            right: dropdownPosition?.right ?? 16,
            width: dropdownPosition?.width ?? 'min(24rem, calc(100vw - 2rem))',
            maxHeight: dropdownPosition?.maxHeight ?? 'calc(100vh - 2rem)'
          }}
        >
          {/* 1. Header / Identity & Tenant Card */}
          <div className="pb-3.5">
            <div className="flex items-start gap-3">
              {/* Avatar with Status Pulse */}
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-blue-500/30 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0B1226] rounded-full" title="Active Enterprise Session" />
              </div>

              {/* Name & Email Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{fullName}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live Prod
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate font-mono text-[11px]" title={email}>{email}</span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-1 hover:text-blue-500 rounded transition-colors cursor-pointer shrink-0"
                    title={copiedEmail ? 'Copied!' : 'Copy Email Address'}
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                </div>

                {/* Organization & Tenant Info */}
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 text-blue-500 shrink-0" />
                    AAVIL Inc
                  </span>
                  <span>•</span>
                  <span className="truncate bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                    {tenantId}
                  </span>
                </div>
              </div>
            </div>

            {/* Persona / Role Selector (Live Dynamic Switcher) */}
            <div className="mt-3 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Active Governance Persona
              </label>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {currentRoleObj.badge}
                  </span>
                  <span>{currentRoleObj.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Persona Switcher Dropdown */}
              {roleDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-xl z-20 py-1 divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100">
                  {ROLES_CATALOG.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                        currentRoleObj.id === r.id
                          ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {r.badge}
                        </span>
                        <span>{r.label}</span>
                      </div>
                      {currentRoleObj.id === r.id && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Theme & Appearance Section (The requested Light/Dark/System mode!) */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500 dark:hidden" />
                <Moon className="w-3.5 h-3.5 text-blue-400 hidden dark:block" />
                Theme & Appearance
              </span>
              <span className="text-[10px] font-mono text-slate-400 capitalize">
                {themeMode}
              </span>
            </div>

            {/* 3-way Theme Mode Segmented Controller */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* 3. Essential Workspace Preferences (Audio, Auto-Save, Telemetry) */}
          <div className="py-3 space-y-2 text-xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Workspace Preferences
            </span>

            {/* Audio Sound Effects Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-lg ${soundOn ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Studio Audio Chimes</p>
                  <p className="text-[10px] text-slate-400">Synthesized execution & alert tones</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                  soundOn ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${soundOn ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Auto-Save Pipeline Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-lg ${autoSave ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Continuous Auto-Save</p>
                  <p className="text-[10px] text-slate-400">Auto-persist canvas nodes & rules</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoSave}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                  autoSave ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${autoSave ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* 4. Platform Navigation & Settings Hub */}
          <div className="py-3 space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Platform Settings & Governance
            </span>

            <button
              type="button"
              onClick={() => handleNavigateSettings('general')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131E36] transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-blue-500" />
                <span>Account & Organization Settings</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">⌘,</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigateSettings('apikeys')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131E36] transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>API Keys & Secrets Vault</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-mono">AES-256</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigateSettings('scheduling')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131E36] transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pipeline Cron Schedules</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">0 */6 *</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigateSettings('alerts')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131E36] transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-rose-500" />
                <span>Alert Channels & Webhooks</span>
              </span>
              <span className="text-[10px] text-emerald-500 font-mono">Active</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigateSettings('team')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131E36] transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-cyan-500" />
                <span>Team & RBAC Permissions</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">3 Members</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigatePage('audit')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131E36] transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cryptographic Audit Trail</span>
              </span>
              <span className="text-[10px] text-emerald-500 font-mono">SHA-256</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigatePage('roi')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131E36] transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                <span>Executive Financial ROI</span>
              </span>
              <span className="text-[10px] text-blue-500 font-mono">$1.42M Saved</span>
            </button>
          </div>

          {/* 5. Active Infrastructure & Security Context */}
          <div className="py-2.5 px-2 bg-slate-50 dark:bg-[#0F172A]/80 rounded-xl my-1 border border-slate-200/60 dark:border-[#1E293B] text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <Server className="w-3 h-3 text-emerald-500" />
                AWS US-East-2 (Ohio)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">24ms • 99.98%</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-slate-400">Auth Engine:</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">PostgreSQL JWT (RS256)</span>
            </div>
          </div>

          {/* 6. Sign Out Button & Version Footer */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                logout({ redirectUrl: '#login' });
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of DataX Workspace</span>
            </button>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-mono">
              <span>DataX Enterprise v2.5.0-prod</span>
              <span>AAVIL Inc</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
