import React from 'react';
import { 
  GitBranch, 
  Shield, 
  Cpu, 
  Plug, 
  LayoutGrid, 
  Layers, 
  Inbox, 
  Eye, 
  Activity, 
  Lock, 
  FileText, 
  SlidersHorizontal 
} from 'lucide-react';

export const DIRECTORY_SECTIONS = [
  {
    group: 'PLATFORM',
    items: [
      { id: 'workflows', label: 'Workflows', icon: GitBranch, screen: 'threads', badge: '5' },
      { id: 'ai_firewall', label: 'AI Firewall', icon: Shield, screen: 'ai-firewall' },
      { id: 'ml_certify', label: 'ML Certify', icon: Cpu, screen: 'ml-certify' },
      { id: 'connections', label: 'Connections', icon: Plug, screen: 'connections', badge: '5' }
    ]
  },
  {
    group: 'OPERATIONS',
    items: [
      { id: 'canvas', label: 'Visual Canvas', icon: LayoutGrid, screen: 'canvas' },
      { id: 'templates', label: 'Domain Templates', icon: Layers, screen: 'templates', badge: '10' },
      { id: 'quarantine', label: 'Quarantine', icon: Inbox, screen: 'quarantine', badge: '50' },
      { id: 'shadow_parity', label: 'Shadow Parity', icon: Eye, screen: 'shadow' },
      { id: 'telemetry', label: 'Run Telemetry', icon: Activity, screen: 'history' }
    ]
  },
  {
    group: 'GOVERNANCE',
    items: [
      { id: 'audit_ledger', label: 'Audit Ledger', icon: Lock, screen: 'audit' },
      { id: 'executive_roi', label: 'Executive ROI', icon: FileText, screen: 'roi' },
      { id: 'settings', label: 'Settings & RBAC', icon: SlidersHorizontal, screen: 'settings' }
    ]
  }
];

/**
 * PlatformDirectoryColumn - Left column directory tree (00.12)
 */
export default function PlatformDirectoryColumn({
  activeModuleId,
  onSelectModule,
  query
}) {
  const filteredSections = DIRECTORY_SECTIONS.map(sec => {
    if (!query) return sec;
    const items = sec.items.filter(it => 
      it.label.toLowerCase().includes(query.toLowerCase()) ||
      sec.group.toLowerCase().includes(query.toLowerCase())
    );
    return { ...sec, items };
  }).filter(sec => sec.items.length > 0);

  return (
    <div className="space-y-3.5 pr-2">
      {filteredSections.map(sec => (
        <div key={sec.group} className="space-y-1">
          <h3 className="text-[10px] font-bold tracking-wider text-[#5F6678] dark:text-slate-400 uppercase px-2 mb-1">
            {sec.group}
          </h3>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {sec.items.map(item => {
              const Icon = item.icon;
              const isSelected = activeModuleId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectModule(item)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F0F4FF] dark:bg-blue-950/30 text-[#2D55F5] dark:text-blue-400'
                      : 'text-[#0A0F1F] dark:text-slate-200 hover:bg-[#F5F6FA] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#2D55F5]' : 'text-[#5F6678] dark:text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                      isSelected 
                        ? 'bg-blue-100/70 text-[#2D55F5] dark:bg-blue-900/50 dark:text-blue-300' 
                        : 'bg-[#EDEFF5] dark:bg-white/[0.08] text-[#5F6678] dark:text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
