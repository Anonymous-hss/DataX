import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine, isCredentialConfigured } from '../../context/RuleEngineContext';
import DataXHeader from '../../components/cleanflow/DataXHeader';
import PipelineFlowNodes from '../../components/cleanflow/PipelineFlowNodes';
import TestInSandboxPage from './TestInSandboxPage';
import ConnectTargetPage from './ConnectTargetPage';
import RunningDryRunPage from './RunningDryRunPage';
import DryRunResultsPage from './DryRunResultsPage';
import LiveWithAutoFixPage from './LiveWithAutoFixPage';

export default function CleanFlowStudio({ initialPage = '05', onSwitchToMarketing, onBackToRules }) {
  const { navigateTo } = useNavigation();
  const { sourceConfig, targetConfig } = useRuleEngine();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);

  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
    }
  }, [initialPage]);

  const changePage = (pageId) => {
    setWarningMessage(null);

    // Require credentials before running dry run or live
    if (pageId === '06_07' || pageId === '07' || pageId === '08') {
      const hasSrc = isCredentialConfigured ? isCredentialConfigured(sourceConfig) : Boolean(sourceConfig?.host || sourceConfig?.connectionUri);
      const hasTgt = (isCredentialConfigured && isCredentialConfigured(targetConfig)) ||
        Boolean(targetConfig?.host || targetConfig?.connectionUri) ||
        Boolean(sourceConfig?.host || sourceConfig?.connectionUri);

      if (!hasSrc) {
        setWarningMessage('Source database credentials required before proceeding.');
        navigateTo('connect-source');
        return;
      }
      if (!hasTgt && pageId !== '06_07') {
        setWarningMessage('Target database credentials required before proceeding.');
        navigateTo('connect-target');
        return;
      }
    }

    setCurrentPage(pageId);
    if (pageId === '03') navigateTo('connect-source');
    else if (pageId === '04') navigateTo('generate-rules');
    else if (pageId === '05') navigateTo('test-in-sandbox');
    else if (pageId === '06') navigateTo('connect-target');
    else if (pageId === '06_07') navigateTo('running-dry-run');
    else if (pageId === '07') navigateTo('dry-run-results');
    else if (pageId === '08') navigateTo('live-auto-fix');
  };

  const handleBack = () => {
    if (currentPage === '08') changePage('07');
    else if (currentPage === '07') changePage('06');
    else if (currentPage === '06_07') changePage('06');
    else if (currentPage === '06') changePage('05');
    else if (onBackToRules) onBackToRules();
    else navigateTo('rules');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col antialiased selection:bg-blue-500/20 selection:text-blue-700">
      
      {/* Top Header & Subheader */}
      <DataXHeader
        currentPage={currentPage}
        onNavigate={(pageId) => changePage(pageId)}
        onBack={handleBack}
        onDryRun={() => changePage('06_07')}
        onRunLive={() => changePage('08')}
        onSwitchToMarketing={onSwitchToMarketing}
        hideSubheader={currentPage === '08'}
      />

      {/* 3-Node Pipeline Graph (Page 08 has its own live nodes) */}
      {currentPage !== '08' && (
        <PipelineFlowNodes
          currentStep={currentPage}
          onNavigate={(pageId) => changePage(pageId)}
        />
      )}

      {/* Main Workspace Body for the 4 Distinct Pages */}
      <main className={`flex-1 w-full ${currentPage === '08' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 py-4'}`}>
        <AnimatePresence mode="wait">
          {currentPage === '05' && (
            <TestInSandboxPage
              key="page-05"
              onNext={() => changePage('06')}
              onBackToRules={handleBack}
            />
          )}

          {currentPage === '06' && (
            <ConnectTargetPage
              key="page-06"
              onSaveAndDryRun={() => changePage('06_07')}
              onCancel={() => changePage('05')}
            />
          )}

          {currentPage === '06_07' && (
            <RunningDryRunPage
              key="page-06-07"
              onComplete={() => changePage('07')}
              onCancel={() => changePage('06')}
            />
          )}

          {currentPage === '07' && (
            <DryRunResultsPage
              key="page-07"
              onBack={() => changePage('06')}
              onRunLive={() => changePage('08')}
            />
          )}

          {currentPage === '08' && (
            <LiveWithAutoFixPage
              key="page-08"
              onBack={() => changePage('07')}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Run Live Confirmation Modal */}
      <AnimatePresence>
        {liveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-display">Live Pipeline Active</h3>
                <p className="text-xs text-slate-500">
                  DataX is streaming clean records to <span className="font-mono text-slate-800 font-semibold">raw_source_users_clean</span> in <span className="font-semibold text-slate-800">reconciled_db</span>.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Database:</span>
                  <span className="font-semibold text-slate-800">reconciled_db (PostgreSQL 15)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Auto-fix status:</span>
                  <span className="text-blue-600 font-semibold">Enabled (5 rules)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quarantine Ledger:</span>
                  <span className="text-amber-600 font-semibold">quarantined_records</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLiveModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setLiveModalOpen(false);
                    navigateTo('live-auto-fix');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  View Live Dispatch →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
