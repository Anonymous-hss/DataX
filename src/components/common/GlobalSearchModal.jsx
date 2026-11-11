import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../../context/NavigationContext';

// Exact Workflow Branch Icon from Figma Design (00.4)
const WorkflowBranchIcon = ({ className = "text-[#5F6678]" }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="4" cy="4.5" r="2" />
    <circle cx="12" cy="4.5" r="2" />
    <circle cx="4" cy="12" r="2" />
    <path d="M4 6.5V10" />
    <path d="M12 6.5C12 9 4 9 4 10" />
  </svg>
);

// Exact Dataset Table Icon from Figma Design (00.4)
const DatasetTableIcon = ({ className = "text-[#5F6678]" }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M2 6.5H14" />
    <path d="M7.5 6.5V14" />
  </svg>
);

const SEARCH_CATALOG = [
  // Workflows Group
  {
    id: 'wf_1',
    group: 'WORKFLOWS',
    title: 'SAP S/4HANA Clean Core Migration',
    screen: 'canvas',
    badge: 'Active',
    type: 'workflow'
  },
  {
    id: 'wf_2',
    group: 'WORKFLOWS',
    title: 'Material Master Quality Pipeline (MARA)',
    screen: 'canvas',
    badge: 'Active',
    type: 'workflow'
  },
  {
    id: 'wf_3',
    group: 'WORKFLOWS',
    title: 'Customer 360 Reconciliation Engine',
    screen: 'canvas',
    badge: 'Active',
    type: 'workflow'
  },
  {
    id: 'wf_4',
    group: 'WORKFLOWS',
    title: 'Supply Chain Goods Movement (OIC_CO3)',
    screen: 'canvas',
    badge: 'Active',
    type: 'workflow'
  },

  // Datasets Group
  {
    id: 'ds_1',
    group: 'DATASETS',
    title: 'OPUR_CO1 · Purchasing data InfoCube',
    screen: 'connections',
    badge: '1,420 rows',
    type: 'dataset'
  },
  {
    id: 'ds_2',
    group: 'DATASETS',
    title: 'OIC_C03 · Material movements InfoCube',
    screen: 'connections',
    badge: '8,450 rows',
    type: 'dataset'
  },
  {
    id: 'ds_3',
    group: 'DATASETS',
    title: 'MARA · General material data',
    screen: 'connections',
    badge: '3,120 rows',
    type: 'dataset'
  },
  {
    id: 'ds_4',
    group: 'DATASETS',
    title: 'EKKO / EKPO · Purchasing documents',
    screen: 'connections',
    badge: '2,820 rows',
    type: 'dataset'
  }
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
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SEARCH_CATALOG;
    return SEARCH_CATALOG.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    );
  }, [query]);

  // Group items
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach(item => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, [filteredItems]);

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
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 p-4 bg-slate-900/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div 
            className="bg-white border border-[#E3E6EE] rounded-[20px] max-w-[620px] w-full shadow-2xl shadow-slate-900/10 overflow-hidden relative text-left"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top Search Header Input */}
            <div className="relative border-b border-[#E3E6EE]/80 flex items-center px-5 py-3.5 bg-white">
              <Search className="w-4 h-4 text-[#5F6678] mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search workflows, tables, rules, quarantine..."
                className="w-full bg-transparent text-sm sm:text-[15px] text-[#0A0F1F] placeholder:text-[#5F6678]/70 focus:outline-none font-sans"
              />
              {query && (
                <button 
                  type="button"
                  onClick={() => setQuery('')} 
                  className="p-1 text-[#5F6678] hover:text-[#0A0F1F] transition-colors cursor-pointer mr-2"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-2 py-0.5 text-xs font-mono text-[#5F6678] bg-[#F5F6FA] hover:bg-[#E3E6EE] border border-[#E3E6EE] rounded-[6px] select-none transition-colors cursor-pointer"
              >
                Esc
              </button>
            </div>

            {/* Results Groups */}
            <div className="p-3 max-h-[460px] overflow-y-auto space-y-3">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5F6678]">
                  No matching workflows or datasets found for "{query}".
                </div>
              ) : (
                Object.entries(groupedItems).map(([groupName, items]) => (
                  <div key={groupName} className="space-y-1">
                    <h3 className="text-[11px] font-bold tracking-wider text-[#5F6678] uppercase px-3 pt-1 pb-1">
                      {groupName}
                    </h3>
                    <div className="space-y-0.5">
                      {items.map(item => {
                        const globalIndex = filteredItems.findIndex(fi => fi.id === item.id);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#F0F4FF] text-[#2D55F5]'
                                : 'text-[#0A0F1F] hover:bg-[#F5F6FA]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {item.type === 'workflow' ? (
                                <WorkflowBranchIcon 
                                  className={`shrink-0 ${isSelected ? 'text-[#2D55F5]' : 'text-[#5F6678]'}`} 
                                />
                              ) : (
                                <DatasetTableIcon 
                                  className={`shrink-0 ${isSelected ? 'text-[#2D55F5]' : 'text-[#5F6678]'}`} 
                                />
                              )}
                              <span className={`truncate text-sm font-medium ${isSelected ? 'text-[#2D55F5]' : 'text-[#0A0F1F]'}`}>
                                {item.title}
                              </span>
                            </div>

                            <div className="flex items-center shrink-0 ml-3">
                              {item.badge === 'Active' ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#34D399]/40 text-[#22845E] text-xs font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="text-xs font-mono text-[#5F6678]">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Keyboard Shortcuts Footer */}
            <div className="px-5 py-3 border-t border-[#E3E6EE]/80 bg-[#FAFAFC] flex items-center gap-5 text-xs text-[#5F6678] select-none rounded-b-[20px]">
              <span className="flex items-center gap-1">
                <span>↑↓</span>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <span>↵</span>
                <span>Open</span>
              </span>
              <span className="flex items-center gap-1">
                <span>Esc</span>
                <span>Close</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
