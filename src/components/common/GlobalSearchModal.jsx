import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, CornerDownLeft, Layers, Database, Shield, Zap, X } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

const SEARCH_CATALOG = [
  // Workflows & Pipelines
  { id: 'wf_1', title: 'SAP S/4HANA Clean Core Migration', category: 'Workflow', screen: 'threads', badge: 'Active', icon: Layers },
  { id: 'wf_2', title: 'Material Master Quality Pipeline (MARA)', category: 'Workflow', screen: 'threads', badge: 'Active', icon: Layers },
  { id: 'wf_3', title: 'Customer 360 Reconciliation Engine', category: 'Workflow', screen: 'threads', badge: 'Active', icon: Layers },
  { id: 'wf_4', title: 'Supply Chain Goods Movement (0IC_C03)', category: 'Workflow', screen: 'threads', badge: 'Active', icon: Layers },

  // Catalog Tables & Data Sources
  { id: 'tbl_1', title: '0PUR_C01 (Purchasing Data InfoCube)', category: 'Dataset', screen: 'connections', badge: '1,420 rows', icon: Database },
  { id: 'tbl_2', title: '0IC_C03 (Material Movements InfoCube)', category: 'Dataset', screen: 'connections', badge: '8,450 rows', icon: Database },
  { id: 'tbl_3', title: 'MARA (General Material Data)', category: 'Dataset', screen: 'connections', badge: '3,120 rows', icon: Database },
  { id: 'tbl_4', title: 'EKKO / EKPO (Purchasing Documents)', category: 'Dataset', screen: 'connections', badge: '2,820 rows', icon: Database },
  { id: 'tbl_5', title: 'validated_users (Clean Remediated Target)', category: 'Dataset', screen: 'connections', badge: 'Target', icon: Database },

  // Rules & Auto-Fixes
  { id: 'rule_1', title: 'Line items must have positive quantity (QUANTITY > 0)', category: 'Rule', screen: 'rules-table', badge: 'Critical', icon: Shield },
  { id: 'rule_2', title: 'Sanitize legacy plant codes and strip whitespace', category: 'Auto-Fix', screen: 'live-auto-fix', badge: 'Auto-Fix', icon: Zap },
  { id: 'rule_3', title: 'Valid ISO Currency Code Format (WAERS)', category: 'Rule', screen: 'rules-table', badge: 'Warning', icon: Shield },
  { id: 'rule_4', title: 'Inverted sign reconciliation on debit/credit balance', category: 'Auto-Fix', screen: 'live-auto-fix', badge: 'Auto-Fix', icon: Zap },

  // Navigation Screens
  { id: 'nav_1', title: 'Workflow Canvas Builder (Studio)', category: 'Page', screen: 'canvas', badge: 'Studio', icon: Layers },
  { id: 'nav_2', title: 'Quarantine Workbench & DLQ', category: 'Page', screen: 'live-auto-fix', badge: 'DLQ', icon: Shield },
  { id: 'nav_3', title: 'Execution History & Observability', category: 'Page', screen: 'history', badge: 'Telemetry', icon: Zap },
  { id: 'nav_4', title: 'Credential Vault & Connections', category: 'Page', screen: 'connections', badge: 'Vault', icon: Database }
];

export default function GlobalSearchModal({ isOpen, onClose }) {
  const { navigateTo } = useNavigation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Shortcut Listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = SEARCH_CATALOG.filter(item => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const handleSelect = (item) => {
    onClose();
    if (item.screen) {
      navigateTo(item.screen);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden relative text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative border-b border-slate-800 flex items-center px-4 bg-slate-950/60">
          <Search className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search workflows, tables, rules, quarantine..."
            className="w-full py-3.5 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-800 rounded border border-slate-700 ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching workflows, tables, or rules found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg border flex-shrink-0 ${isSelected ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500">{item.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-blue-400 font-medium">DataX Universal Search</span>
        </div>
      </div>
    </div>
  );
}
