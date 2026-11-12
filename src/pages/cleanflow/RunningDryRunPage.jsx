import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import WorkflowCanvasPage from '../WorkflowCanvasPage';
import { RunningDryRunModal } from '../../components/workflows/dryrun';

export default function RunningDryRunPage({ onComplete, onCancel }) {
  const { navigateTo } = useNavigation();
  const { dryRunResult, sourceConfig, activeRules } = useRuleEngine();

  const totalRows = dryRunResult?.totalChecked || sourceConfig?.totalRows || 1420;
  const tableName = sourceConfig?.table || (sourceConfig?.selectedTables?.[0]) || 'OPUR_C01';
  const rulesCount = activeRules?.length || 5;

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)]">
      {/* Background Interactive Canvas */}
      <WorkflowCanvasPage />

      {/* Foreground Modal Dialog (SS 3) */}
      <RunningDryRunModal
        isOpen={true}
        onComplete={() => {
          if (onComplete) onComplete();
          else navigateTo('dry-run-results');
        }}
        onCancel={() => {
          if (onCancel) onCancel();
          else navigateTo('canvas');
        }}
        onClose={() => navigateTo('canvas')}
        totalRows={totalRows}
        tableName={tableName}
        rulesCount={rulesCount}
      />
    </div>
  );
}
