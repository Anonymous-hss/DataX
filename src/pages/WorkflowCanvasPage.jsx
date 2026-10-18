import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import DataXHeader from '../components/cleanflow/DataXHeader';
import WorkflowCanvasBuilder from '../components/cleanflow/WorkflowCanvasBuilder';

export default function WorkflowCanvasPage() {
  const { navigateTo } = useNavigation();
  const { activeThread, sourceConfig, targetConfig } = useRuleEngine();

  return (
    <div className="fixed inset-0 h-screen w-screen max-h-screen max-w-full overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Global Header (No PipelineFlowNodes step bar — the entire workflow IS the canvas!) */}
      <div className="shrink-0">
        <DataXHeader
          currentPage="03"
          onBack={() => navigateTo('workflows')}
          hideSubheader={true}
        />
      </div>

      {/* Main Full-Height Workflow Canvas Workspace - Always fits window exactly */}
      <main className="flex-1 w-full min-h-0 p-2 sm:p-3 flex flex-col overflow-hidden">
        <div className="flex-1 w-full h-full min-h-0 rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative bg-[#F8FAFC]">
          <WorkflowCanvasBuilder 
            onMoveToNext={() => navigateTo('running-dry-run')}
          />
        </div>
      </main>
    </div>
  );
}

