import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';

// Modular Subcomponents matching 00.12 & 6.1b
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
        className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-[2px] transition-opacity flex items-start justify-end p-2 sm:p-4 md:p-6"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          className="mt-12 sm:mt-14 w-full max-w-[calc(100vw-24px)] sm:w-[680px] lg:w-[720px] max-h-[calc(100vh-70px)] sm:max-h-[min(580px,86vh)] bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-slate-900/20 p-4 sm:p-5 text-left font-sans flex flex-col overflow-hidden"
        >
          {/* Header & Search Bar */}
          <div className="shrink-0">
            <NavigateFilterHeader 
              query={query}
              setQuery={setQuery}
              onClose={onClose}
              inputRef={inputRef}
            />
          </div>

          {/* Two-Column Directory & Workflow Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E3E6EE] dark:divide-white/[0.08] py-3 flex-1 min-h-0 overflow-hidden">
            {/* Left Column: Platform Directory */}
            <div className="pr-0 md:pr-4 overflow-y-auto max-h-[min(380px,46vh)]">
              <PlatformDirectoryColumn 
                activeModuleId={activeModuleId}
                onSelectModule={handleSelectModule}
                query={query}
              />
            </div>

            {/* Right Column: Workflow Context */}
            <div className="pl-0 md:pl-4 pt-3 md:pt-0 overflow-y-auto max-h-[min(380px,46vh)]">
              <WorkflowContextColumn 
                selectedWorkflowId={selectedWorkflowId}
                onSelectWorkflow={handleSelectWorkflow}
                query={query}
              />
            </div>
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
