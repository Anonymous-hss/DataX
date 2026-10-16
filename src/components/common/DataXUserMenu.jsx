import React, { useState, useRef, useEffect } from 'react';
import { useUser, useClerk, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { User, LogOut, Shield, ChevronDown, Check, Building2, Mail } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export default function DataXUserMenu({ compact = false }) {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { navigateTo } = useNavigation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
    );
  }

  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Enterprise User';
  const email = user?.primaryEmailAddress?.emailAddress || 'user@company.com';
  const tenantId = user?.id ? `tenant_${user.id.slice(0, 8)}` : 'tenant_enterprise';

  return (
    <div className="relative" ref={menuRef}>
      <SignedIn>
        <div className="flex items-center gap-2">
          {/* Detailed user profile pill (hidden on small screens if compact) */}
          {!compact && (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer shadow-2xs"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0">
                <img 
                  src={user?.imageUrl} 
                  alt={fullName} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerText = fullName.slice(0, 2).toUpperCase();
                  }}
                />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold text-slate-800 line-clamp-1 max-w-[110px]">{fullName}</p>
                <p className="text-[10px] text-slate-400 font-mono line-clamp-1 max-w-[110px]">{email}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
          )}

          {/* Clerk Official User Button with custom styling */}
          <div className="shrink-0 flex items-center">
            <UserButton
              afterSignOutUrl="/datax/#login"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 rounded-full border border-slate-300 ring-2 ring-transparent hover:ring-blue-400 transition-all cursor-pointer',
                  userButtonPopoverCard: 'shadow-2xl rounded-2xl border border-slate-200 p-2'
                }
              }}
            />
          </div>
        </div>

        {/* Custom SaaS User Details Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100">
            {/* Header / Identity */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 px-1">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                <img 
                  src={user?.imageUrl} 
                  alt={fullName} 
                  className="w-full h-full object-cover"
                />
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
                  <Building2 className="w-3.5 h-3.5" /> Workspace
                </span>
                <span className="font-semibold text-slate-800">Production SaaS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Tenant ID
                </span>
                <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {tenantId}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  openUserProfile?.();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Manage Clerk Account
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  signOut({ redirectUrl: '/datax/#login' });
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </SignedIn>

      <SignedOut>
        <button
          onClick={() => navigateTo('login')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2D55F5] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <span>Sign In / Register</span>
        </button>
      </SignedOut>
    </div>
  );
}
