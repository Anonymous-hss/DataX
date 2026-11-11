import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, ArrowRight, GitBranch, Sparkles, Shield, Cpu, Inbox, FileCode2 } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';

const DEFAULT_RECENT_SEARCHES = [
  'SAP BW → S/4HANA Clean Core',
  'gl_account',
  'Customer Master & Identity',
  'Quarantine DLQ'
];

const SEARCHABLE_MODULES = [
  { id: 'workflows', title: 'Workflows Overview', category: 'MODULE', screen: 'threads', icon: GitBranch },
  { id: 'canvas', title: 'Visual Canvas Studio', category: 'MODULE', screen: 'canvas', icon: GitBranch },
  { id: 'firewall', title: 'AI Agent & Firewall', category: 'MODULE', screen: 'ai-firewall', icon: Shield },
  { id: 'ml_certify', title: 'ML Gate & Certification', category: 'MODULE', screen: 'ml-certify', icon: Cpu },
  { id: 'quarantine', title: 'Quarantine DLQ Workbench', category: 'MODULE', screen: 'quarantine', icon: Inbox },
  { id: 'rule_gl', title: 'Rule: GL Account Format', category: 'RULE', screen: 'canvas', field: 'gl_account', icon: FileCode2 },
  { id: 'rule_email', title: 'Rule: Email RFC-5322 Syntax', category: 'RULE', screen: 'canvas', field: 'email', icon: FileCode2 },
  { id: 'rule_vendor', title: 'Rule: Vendor ID Active Check', category: 'RULE', screen: 'canvas', field: 'vendor_id', icon: FileCode2 },
  { id: 'wf_sap', title: 'SAP BW → S/4HANA Clean Core', category: 'WORKFLOW', screen: 'canvas', threadId: 'sap_bw_s4hana', icon: GitBranch },
  { id: 'wf_cust', title: 'Customer Master & Identity', category: 'WORKFLOW', screen: 'canvas', threadId: 'customer_master_reconciliation', icon: GitBranch },
  { id: 'wf_fin', title: 'Financial GL & AP Compliance', category: 'WORKFLOW', screen: 'canvas', threadId: 'financial_gl_ledger', icon: GitBranch },
  { id: 'wf_hc', title: 'Healthcare Patient Master', category: 'WORKFLOW', screen: 'canvas', threadId: 'healthcare_hipaa', icon: GitBranch },
];

export default function HeaderSearchBar({ placeholder = "Search threads, tables..." }) {
  const { navigateTo } = useNavigation();
  const { selectThread } = useRuleEngine?.() || {};

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem('datax_recent_searches');
      return stored ? JSON.parse(stored) : DEFAULT_RECENT_SEARCHES;
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  });

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Debounce keystrokes (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Global ⌘K / Ctrl+K shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search results
  const filteredResults = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return SEARCHABLE_MODULES.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.field && item.field.toLowerCase().includes(q))
    ).slice(0, 7);
  }, [debouncedQuery]);

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    setRecentSearches(prev => {
      const updated = [cleanTerm, ...prev.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem('datax_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('datax_recent_searches');
    } catch {}
  };

  const handleSelectResult = (item) => {
    saveRecentSearch(item.title);
    setIsOpen(false);
    setQuery('');
    if (item.threadId && selectThread) {
      selectThread(item.threadId);
    }
    if (item.screen) {
      navigateTo(item.screen);
    }
  };

  const handleSelectRecent = (term) => {
    setQuery(term);
    setDebouncedQuery(term);
    saveRecentSearch(term);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      } else if (query) {
        saveRecentSearch(query);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative flex-1 max-w-sm font-sans" ref={containerRef}>
      {/* Search Input Bar */}
      <div 
        className={`w-full h-9 px-3 rounded-full bg-[#F5F6FA] dark:bg-white/[0.04] border transition-all flex items-center gap-2 ${
          isOpen 
            ? 'border-[#2D55F5] ring-2 ring-[#2D55F5]/20 bg-white dark:bg-[#18181C]' 
            : 'border-[#E3E6EE] dark:border-white/[0.08] hover:border-[#CDD2DE]'
        }`}
      >
        <Search className="w-3.5 h-3.5 text-[#8E95A9] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs text-[#0A0F1F] dark:text-white placeholder-[#8E95A9] focus:outline-none"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setDebouncedQuery('');
              inputRef.current?.focus();
            }}
            className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-[#8E95A9] bg-white dark:bg-white/[0.08] px-1.5 py-0.2 rounded border border-[#E3E6EE] dark:border-white/[0.08] shrink-0">
            ⌘K
          </kbd>
        )}
      </div>

      {/* In-Bar Autocomplete Dropdown (Attached directly below input) */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-xl shadow-2xl shadow-slate-900/15 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[380px] flex flex-col no-scrollbar"
        >
          {debouncedQuery === '' ? (
            /* Recent Searches Mode */
            <div className="p-3 overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Recent searches
                </span>
                {recentSearches.length > 0 && (
                  <button
                    onClick={handleClearRecent}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                  >
                    Clear history
                  </button>
                )}
              </div>

              {recentSearches.length > 0 ? (
                <div className="space-y-1">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectRecent(term)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <span className="truncate">{term}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  No recent searches yet. Type to search workflows and rules.
                </div>
              )}
            </div>
          ) : (
            /* Live Debounced Search Results */
            <div className="p-2 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-white/[0.06]">
              {filteredResults.length > 0 ? (
                filteredResults.map((item, idx) => {
                  const Icon = item.icon || Search;
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0 text-slate-500">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.category} {item.field ? `· field: ${item.field}` : ''}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Jump →</span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No matches found for <span className="font-semibold text-slate-600">"{debouncedQuery}"</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

