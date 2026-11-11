import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { 
  getStoredTheme, 
  setThemePreference, 
  subscribeToThemeChanges 
} from '../../services/themeService';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  playNotificationSound 
} from '../../services/soundEngine';

// Modular Profile Subcomponents (00.6)
import {
  ProfileHeader,
  GovernancePersonaSelector,
  AppearanceThemeSelector,
  WorkspacePreferences,
  PlatformSettings,
  EnvironmentInfo,
  SignOutButton,
  ROLES_CATALOG
} from './profile';

export default function DataXUserMenu({ compact = false }) {
  const { user, isLoaded, isSignedIn, logout, updateUser } = useAuth();
  const { navigateTo } = useNavigation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  const tenantId = user?.tenantId || 'tenant_enterprise';
  const initials = (fullName || 'HS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Handlers
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
          {/* Avatar button trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#2D55F5]/30 transition-all cursor-pointer"
            title="Profile & workspace preferences"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0A0F1F] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm border border-[#CDD2DE]/40">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </button>
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

      {/* Official 00.6 Profile & Workspace Menu Dropdown Popover */}
      <AnimatePresence>
        {isSignedIn && dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-[300px] sm:w-[320px] max-h-[calc(100vh-75px)] sm:max-h-[min(540px,84vh)] overflow-y-auto bg-white dark:bg-[#18181C] rounded-2xl border border-[#E3E6EE] dark:border-white/[0.08] shadow-2xl shadow-slate-900/15 z-50 divide-y divide-[#E3E6EE]/80 dark:divide-white/[0.06] text-left font-sans"
          >
            {/* 1. Header / User Identity */}
            <ProfileHeader 
              fullName={fullName}
              email={email}
              tenantId={tenantId}
              initials={initials}
              imageUrl={user?.imageUrl}
            />

            {/* 2. Governance Persona */}
            <GovernancePersonaSelector 
              currentRoleObj={currentRoleObj}
              roleDropdownOpen={roleDropdownOpen}
              setRoleDropdownOpen={setRoleDropdownOpen}
              onSelectRole={handleRoleSelect}
            />

            {/* 3. Appearance (Smooth Theme Switcher) */}
            <AppearanceThemeSelector 
              themeMode={themeMode}
              onThemeChange={handleThemeChange}
            />

            {/* 4. Workspace Preferences */}
            <WorkspacePreferences 
              soundOn={soundOn}
              onToggleSound={handleToggleSound}
              autoSave={autoSave}
              onToggleAutoSave={handleToggleAutoSave}
            />

            {/* 5. Platform Settings */}
            <PlatformSettings 
              onNavigateSettings={handleNavigateSettings}
              onNavigatePage={handleNavigatePage}
            />

            {/* 6. Environment */}
            <EnvironmentInfo />

            {/* 7. Sign Out */}
            <SignOutButton 
              onSignOut={() => logout({ redirectUrl: '#login' })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
