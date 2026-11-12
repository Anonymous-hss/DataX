import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import WorkflowCanvasPage from '../WorkflowCanvasPage';
import { DryRunResultsModal } from '../../components/workflows/dryrun';

export default function DryRunResultsPage({ onBack, onRunLive }) {
  const { navigateTo } = useNavigation();
  const { 
    dryRunResult, 
    sourceConfig, 
    targetConfig, 
    activeRules, 
    executeLiveRun 
  } = useRuleEngine();

  const totalRows = dryRunResult?.totalChecked ?? 1420;
  const cleanCount = dryRunResult?.cleanCount ?? 1250;
  const autoFixedCount = dryRunResult?.autoFixedCount ?? 126;
  const quarantinedCount = dryRunResult?.quarantinedCount ?? 170;
  const complianceRate = dryRunResult?.passRate ? `${dryRunResult.passRate}%` : '96.9%';
  const tableName = sourceConfig?.table || (sourceConfig?.selectedTables?.[0]) || 'OPUR_C01';
  const targetTableName = targetConfig?.table || 'OPUR_C01_clean';
  const rulesCount = activeRules?.length || 5;

  const handleRunLiveClick = async () => {
    if (executeLiveRun) {
      await executeLiveRun();
    }
    if (onRunLive) {
      onRunLive();
    } else {
      navigateTo('live-auto-fix');
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)]">
      {/* Background Interactive Canvas */}
      <WorkflowCanvasPage />

      {/* Foreground Modal Dialog (SS 4) */}
      <DryRunResultsModal
        isOpen={true}
        onClose={() => navigateTo('canvas')}
        onBack={() => {
          if (onBack) onBack();
          else navigateTo('canvas');
        }}
        onReRun={() => navigateTo('running-dry-run')}
        onRunLive={handleRunLiveClick}
        totalRows={totalRows}
        cleanCount={cleanCount}
        autoFixedCount={autoFixedCount}
        quarantinedCount={quarantinedCount}
        complianceRate={complianceRate}
        tableName={tableName}
        targetTableName={targetTableName}
        rulesCount={rulesCount}
        ruleOutcomes={dryRunResult?.ruleOutcomes}
      />
    </div>
  );
}
