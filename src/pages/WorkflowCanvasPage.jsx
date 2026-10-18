import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import DataXHeader from '../components/cleanflow/DataXHeader';
import WorkflowCanvasBuilder from '../components/cleanflow/WorkflowCanvasBuilder';

export default function WorkflowCanvasPage() {
  const { navigateTo } = useNavigation();
  const { activeThread, sourceConfig, targetConfig } = useRuleEngine();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Global Header (No PipelineFlowNodes step bar — the entire workflow IS the canvas!) */}
      <DataXHeader
        currentPage="03"
        onBack={() => navigateTo('workflows')}
        hideSubheader={true}
      />

      {/* Main Full-Height Workflow Canvas Workspace */}
      <main className="flex-1 w-full px-4 sm:px-6 py-4 flex flex-col max-w-[1560px] mx-auto">
        <div className="flex-1 w-full h-[780px] rounded-2xl overflow-hidden shadow-xs border border-slate-200">
          <WorkflowCanvasBuilder 
            onMoveToNext={() => navigateTo('running-dry-run')}
          />
        </div>
      </main>
    </div>
  );
}
