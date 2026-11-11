import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import WorkflowCanvasBuilder from '../components/cleanflow/WorkflowCanvasBuilder';

export default function WorkflowCanvasPage() {
  const { navigateTo } = useNavigation();

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden bg-[#F8FAFC] font-sans">
      <WorkflowCanvasBuilder 
        onMoveToNext={() => navigateTo('running-dry-run')}
      />
    </div>
  );
}
