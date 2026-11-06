import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import WorkflowCanvasBuilder from '../components/cleanflow/WorkflowCanvasBuilder';

export default function WorkflowCanvasPage() {
  const { navigateTo } = useNavigation();

  return (
    <div className="h-[calc(100vh-4rem)] w-full p-2 sm:p-3 flex flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="flex-1 w-full h-full min-h-0 rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative bg-[#F8FAFC]">
        <WorkflowCanvasBuilder 
          onMoveToNext={() => navigateTo('running-dry-run')}
        />
      </div>
    </div>
  );
}
