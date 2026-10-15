import React from 'react';
import { RuleEngineProvider } from '../../context/RuleEngineContext';
import { NavigationProvider, useNavigation } from '../../context/NavigationContext';

// Figma Screen Pages
import ThreadsPage from '../../pages/ThreadsPage';
import StartAThreadPage from '../../pages/StartAThreadPage';
import ConnectSourcePage from '../../pages/ConnectSourcePage';
import ConnectTargetPage from '../../pages/ConnectTargetPage';
import RulesPage from '../../pages/RulesPage';
import RunningDryRunPage from '../../pages/RunningDryRunPage';
import DryRunResultsPage from '../../pages/DryRunResultsPage';
import LiveAutoFixPage from '../../pages/LiveAutoFixPage';
import RunHistoryPage from '../../pages/RunHistoryPage';

function ScreenRenderer({ onBackToWebsite }) {
  const { currentScreen } = useNavigation();

  let ScreenComponent;
  switch (currentScreen) {
    case 'new-thread':
      ScreenComponent = StartAThreadPage;
      break;
    case 'connect-source':
      ScreenComponent = ConnectSourcePage;
      break;
    case 'connect-target':
      ScreenComponent = ConnectTargetPage;
      break;
    case 'rules':
      ScreenComponent = RulesPage;
      break;
    case 'running-dry-run':
      ScreenComponent = RunningDryRunPage;
      break;
    case 'dry-run-results':
      ScreenComponent = DryRunResultsPage;
      break;
    case 'live-auto-fix':
      ScreenComponent = LiveAutoFixPage;
      break;
    case 'history':
      ScreenComponent = RunHistoryPage;
      break;
    case 'threads':
    default:
      ScreenComponent = ThreadsPage;
      break;
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#474E61] font-sans antialiased flex flex-col relative">
      {/* Return to Website Floating Button */}
      {onBackToWebsite && (
        <button
          onClick={onBackToWebsite}
          className="fixed bottom-16 left-4 z-50 bg-white/95 backdrop-blur-md text-[#5F6678] hover:text-[#0A0F1F] hover:border-[#B7BDCE] text-[11px] font-medium px-3 py-1.5 rounded-full shadow-md border border-[#E3E6EE] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>&larr;</span> Back to Dataglow Website
        </button>
      )}

      <main className="flex-1">
        <ScreenComponent />
      </main>
    </div>
  );
}

export default function DataXPoc({ onBackToWebsite }) {
  return (
    <RuleEngineProvider>
      <NavigationProvider initialScreen="threads">
        <ScreenRenderer onBackToWebsite={onBackToWebsite} />
      </NavigationProvider>
    </RuleEngineProvider>
  );
}
