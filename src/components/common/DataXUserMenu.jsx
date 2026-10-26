import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Shield, ChevronDown, Building2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

export default function DataXUserMenu({ compact = false }) {
  const { user, isLoaded, isSignedIn, logout } = useAuth();
  const { navigateTo } = useNavigation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return undefined;

    const updateDropdownPosition = () => {
      const anchor = menuRef.current?.getBoundingClientRect();
      if (!anchor) return;

      const width = Math.min(288, Math.max(0, window.innerWidth - 32));
      const height = dropdownRef.current?.offsetHeight || 260;
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
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
    );
  }

  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Enterprise User';
  const email = user?.primaryEmailAddress?.emailAddress || user?.email || 'user@dataglow.ai';
  const tenantId = user?.tenantId || 'tenant_enterprise';
  const initials = (fullName || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="relative shrink-0" ref={menuRef}>
      {isSignedIn ? (
        <div className="flex min-w-0 items-center gap-2">
          {/* Detailed user profile pill */}
          {!compact && (
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              className="hidden lg:flex min-w-0 max-w-[calc(100vw-2rem)] items-center gap-2 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer shadow-2xs"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="w-48 min-w-0 leading-tight">
                <p className="truncate text-[11px] font-semibold text-slate-800">{fullName}</p>
                <p className="truncate text-[10px] text-slate-400 font-mono" title={email}>{email}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
          )}

          {/* User Button / Avatar */}
          <div className={`shrink-0 flex items-center ${compact ? '' : 'lg:hidden'}`}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              className="w-8 h-8 rounded-full border border-slate-300 ring-2 ring-transparent hover:ring-blue-400 transition-all cursor-pointer flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2D55F5] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <span>Sign In / Register</span>
        </button>
      )}

      {/* Custom SaaS User Details Dropdown */}
      {isSignedIn && dropdownOpen && (
        <div
          ref={dropdownRef}
          className="fixed w-72 max-w-[calc(100vw-2rem)] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: dropdownPosition?.top ?? 88,
            right: dropdownPosition?.right ?? 16,
            width: dropdownPosition?.width ?? 'min(18rem, calc(100vw - 2rem))',
            maxHeight: dropdownPosition?.maxHeight ?? 'calc(100vh - 2rem)'
          }}
        >
          {/* Header / Identity */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 px-1">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-blue-50 text-blue-600 text-sm font-bold flex items-center justify-center shrink-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{fullName}</p>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                {email}
              </p>
            </div>
          </div>

          {/* Tenant & Workspace Metadata */}
          <div className="py-2.5 px-1 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Role
              </span>
              <span className="font-semibold text-slate-800 capitalize">{user?.role || 'Data Engineer'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Auth Engine
              </span>
              <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                PostgreSQL JWT
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                logout({ redirectUrl: '#login' });
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
