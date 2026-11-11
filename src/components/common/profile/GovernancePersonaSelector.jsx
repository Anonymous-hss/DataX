import React from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const ROLES_CATALOG = [
  { id: 'data_engineer', label: 'Lead Data Engineer', badge: 'DE' },
  { id: 'data_steward', label: 'Lead Data Steward', badge: 'DS' },
  { id: 'cdo', label: 'Chief Data Officer (CDO)', badge: 'EXEC' },
  { id: 'compliance_officer', label: 'Compliance & Security Auditor', badge: 'SEC' },
  { id: 'admin', label: 'Platform Administrator', badge: 'ADMIN' }
];

/**
 * GovernancePersonaSelector - Role Switcher & Persona Card (00.6)
 */
export default function GovernancePersonaSelector({
  currentRoleObj,
  roleDropdownOpen,
  setRoleDropdownOpen,
  onSelectRole
}) {
  return (
    <div className="p-4 space-y-2">
      <span className="block text-[11px] font-bold tracking-wider text-[#5F6678] dark:text-slate-400 uppercase">
        Governance Persona
      </span>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          className="w-full flex items-center justify-between py-1 hover:bg-[#F5F6FA] dark:hover:bg-white/[0.04] -mx-1.5 px-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded-[6px] bg-[#F5F6FA] dark:bg-white/[0.08] text-[#5F6678] dark:text-slate-300 text-[10px] font-mono font-bold border border-[#CDD2DE]/60 dark:border-white/[0.08]">
              {currentRoleObj.badge}
            </span>
            <span className="text-xs font-semibold text-[#0A0F1F] dark:text-white truncate">
              {currentRoleObj.label}
            </span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-[#5F6678] transition-transform duration-200 shrink-0 ${
              roleDropdownOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {roleDropdownOpen && (
          <div className="mt-2 space-y-1 bg-[#F5F6FA] dark:bg-black/30 p-1.5 rounded-xl border border-[#E3E6EE] dark:border-white/[0.08]">
            {ROLES_CATALOG.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => onSelectRole(role)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  currentRoleObj.id === role.id 
                    ? 'bg-white dark:bg-white/[0.08] text-[#2D55F5] dark:text-blue-400 font-bold shadow-xs' 
                    : 'text-[#0A0F1F] dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#EDEFF5] dark:bg-white/[0.08] text-[#5F6678] dark:text-slate-300">
                    {role.badge}
                  </span>
                  <span>{role.label}</span>
                </div>
                {currentRoleObj.id === role.id && (
                  <Check className="w-3.5 h-3.5 text-[#2D55F5]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
