import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';

// Modular Subcomponents matching 00.12
import {
  NavigateFilterHeader,
  PlatformDirectoryColumn,
  WorkflowContextColumn,
  NavigateFilterFooter
} from './navigate';

export default function NavigateFilterModal({ isOpen, onClose, onOpenAdvisor }) {
  const { navigateTo } = useNavigation();
  const ruleEngine = useRuleEngine?.() || {};
  const { activeThread, selectThread } = ruleEngine;

  const [query, setQuery] = useState('');
  const [activeModuleId, setActiveModuleId] = useState('workflows');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(() => {
    return activeThread?.id || activeThread?.packKey || 'sap_bw_s4hana';
  });

  useEffect(() => {
    if (activeThread?.id || activeThread?.packKey) {
      setSelectedWorkflowId(activeThread.id || activeThread.packKey);
    }
  }, [activeThread]);

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global Keyboard Shortcut: ⌘ / or Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectModule = (item) => {
    setActiveModuleId(item.id);
    onClose();
    if (item.screen) {
      navigateTo(item.screen);
    }
  };

  const handleSelectWorkflow = (wf) => {
    setSelectedWorkflowId(wf.id);
    if (selectThread) {
      selectThread(wf.id);
    }
    onClose();
    navigateTo('canvas');
  };

  const handleClearFilters = () => {
    setQuery('');
    setActiveModuleId('workflows');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[24px] max-w-[760px] w-full shadow-2xl shadow-slate-900/15 p-6 sm:p-7 text-left font-sans relative overflow-hidden"
        >
          {/* Header & Search Bar */}
          <NavigateFilterHeader 
            query={query}
            setQuery={setQuery}
            onClose={onClose}
            inputRef={inputRef}
          />

          {/* Two-Column Directory & Workflow Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E3E6EE] dark:divide-white/[0.08] py-4">
            {/* Left Column: Platform Directory */}
            <PlatformDirectoryColumn 
              activeModuleId={activeModuleId}
              onSelectModule={handleSelectModule}
              query={query}
            />

            {/* Right Column: Workflow Context */}
            <WorkflowContextColumn 
              selectedWorkflowId={selectedWorkflowId}
              onSelectWorkflow={handleSelectWorkflow}
              query={query}
            />
          </div>

          {/* Bottom Footer Controls */}
          <NavigateFilterFooter 
            onOpenAdvisor={() => {
              onClose();
              if (onOpenAdvisor) onOpenAdvisor();
            }}
            onClearFilters={handleClearFilters}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
