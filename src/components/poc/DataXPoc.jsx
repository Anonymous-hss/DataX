import React, { Suspense, lazy } from 'react';
import { NavigationProvider, useNavigation } from '../../context/NavigationContext';
import { RuleEngineProvider } from '../../context/RuleEngineContext';

// Pages
import ThreadsPage from '../../pages/ThreadsPage';
import StartAThreadPage from '../../pages/StartAThreadPage';
import ConnectSourcePage from '../../pages/ConnectSourcePage';
import GenerateRulesPage from '../../pages/GenerateRulesPage';
import RulesPage from '../../pages/RulesPage';
import CleanFlowStudio from '../../pages/cleanflow/CleanFlowStudio';
import LiveAutoFixPage from '../../pages/LiveAutoFixPage';
import RunHistoryPage from '../../pages/RunHistoryPage';
import SapBwPocDashboard from './SapBwPocDashboard';

function ScreenRenderer({ onBackToWebsite }) {
  const { currentScreen, navigateTo } = useNavigation();

  switch (currentScreen) {
    case 'new-thread':
    case 'start-thread':
      return (
        <StartAThreadPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );
    case 'threads':
      return (
        <ThreadsPage 
          onOpenLegacyPoc={() => navigateTo('legacy-poc')} 
          onSwitchToMarketing={onBackToWebsite}
        />
      );


    case 'connect-source':
    case 'source':
      return (
        <ConnectSourcePage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'generate-rules':
    case 'rules':
    case 'ai-rules':
      return (
        <GenerateRulesPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'rules-table':
    case 'rules-engine':
      return (
        <RulesPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'test-in-sandbox':
    case 'sandbox':
      return (
        <CleanFlowStudio 
          initialPage="05" 
          onSwitchToMarketing={onBackToWebsite} 
          onBackToRules={() => navigateTo('generate-rules')}
        />
      );

    case 'connect-target':
    case 'target':
      return (
        <CleanFlowStudio 
          initialPage="06" 
          onSwitchToMarketing={onBackToWebsite} 
          onBackToRules={() => navigateTo('generate-rules')}
        />
      );

    case 'running-dry-run':
      return (
        <CleanFlowStudio 
          initialPage="06_07" 
          onSwitchToMarketing={onBackToWebsite} 
          onBackToRules={() => navigateTo('generate-rules')}
        />
      );

    case 'dry-run-results':
      return (
        <CleanFlowStudio 
          initialPage="07" 
          onSwitchToMarketing={onBackToWebsite} 
          onBackToRules={() => navigateTo('generate-rules')}
        />
      );

    case 'live-auto-fix':
    case 'live':
      return (
        <CleanFlowStudio 
          initialPage="08" 
          onSwitchToMarketing={onBackToWebsite} 
          onBackToRules={() => navigateTo('generate-rules')}
        />
      );

    case 'history':
    case 'runs':
      return (
        <RunHistoryPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'legacy-poc':
      return (
        <SapBwPocDashboard 
          onBackToWebsite={onBackToWebsite} 
          onBackToThreads={() => navigateTo('threads')}
          onOpenSandbox={() => navigateTo('test-in-sandbox')}
        />
      );

    default:
      return (
        <ThreadsPage 
          onOpenLegacyPoc={() => navigateTo('legacy-poc')} 
          onSwitchToMarketing={onBackToWebsite}
        />
      );
  }
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
