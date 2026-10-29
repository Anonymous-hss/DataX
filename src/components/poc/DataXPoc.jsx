import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '../../context/AuthContext';
import { NavigationProvider, useNavigation } from '../../context/NavigationContext';
import { RuleEngineProvider } from '../../context/RuleEngineContext';

// Pages
import ThreadsPage from '../../pages/ThreadsPage';
import StartAThreadPage from '../../pages/StartAThreadPage';
import DomainPacksPage from '../../pages/DomainPacksPage';
import ConnectionsPage from '../../pages/ConnectionsPage';
import RulesPage from '../../pages/RulesPage';
import CleanFlowStudio from '../../pages/cleanflow/CleanFlowStudio';
import RunHistoryPage from '../../pages/RunHistoryPage';
import SapBwPocDashboard from './SapBwPocDashboard';
import DataXAuthPage from '../../pages/auth/DataXAuthPage';
import WorkflowCanvasPage from '../../pages/WorkflowCanvasPage';
import QuarantineWorkbenchPage from '../../pages/QuarantineWorkbenchPage';
import AuditLogViewerPage from '../../pages/AuditLogViewerPage';
import ShadowReconcilerPage from '../../pages/ShadowReconcilerPage';
import ExecutiveRoiPage from '../../pages/ExecutiveRoiPage';
import SettingsPage from '../../pages/SettingsPage';
import HelpCenterPage from '../../pages/HelpCenterPage';
import NotFoundPage from '../../pages/NotFoundPage';
import AiFirewallPage from '../../pages/AiFirewallPage';
import MlCertificationPage from '../../pages/MlCertificationPage';

function ScreenRenderer({ onBackToWebsite }) {
  const { currentScreen, navigateTo } = useNavigation();

  switch (currentScreen) {
    case 'login':
    case 'signin':
    case 'sign-in':
      return (
        <DataXAuthPage 
          initialMode="login" 
          onBackToWebsite={onBackToWebsite} 
        />
      );

    case 'register':
    case 'signup':
    case 'sign-up':
      return (
        <DataXAuthPage 
          initialMode="register" 
          onBackToWebsite={onBackToWebsite} 
        />
      );

    case 'new-workflow':
    case 'start-workflow':
    case 'new-thread':
    case 'start-thread':
      return (
        <StartAThreadPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );
    case 'workflows':
    case 'threads':
    case '':
    case 'home':
      return (
        <ThreadsPage 
          onOpenLegacyPoc={() => navigateTo('legacy-poc')} 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'templates':
    case 'template':
    case 'domain-packs':
    case 'domainpacks':
    case 'domains':
      return (
        <DomainPacksPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'connections':
    case 'vault':
    case 'datasources':
      return (
        <ConnectionsPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'canvas':
    case 'workflow-builder':
    case 'builder':
    case 'connect-source':
    case 'source':
    case 'generate-rules':
    case 'rules':
    case 'ai-rules':
    case 'connect-target':
    case 'target':
      return (
        <WorkflowCanvasPage 
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
          onBackToRules={() => navigateTo('connect-source')}
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

    case 'quarantine':
    case 'dlq':
    case 'quarantine-workbench':
      return (
        <QuarantineWorkbenchPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'audit':
    case 'audit-trail':
    case 'audit-logs':
    case 'lineage':
      return (
        <AuditLogViewerPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'shadow':
    case 'shadow-mode':
    case 'shadow-reconciler':
    case 'parity':
      return (
        <ShadowReconcilerPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'roi':
    case 'executive-roi':
    case 'roi-dossier':
    case 'dossier':
      return (
        <ExecutiveRoiPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'settings':
    case 'configuration':
    case 'admin':
      return (
        <SettingsPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'help':
    case 'docs':
    case 'knowledge-base':
    case 'support':
      return (
        <HelpCenterPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'history':
    case 'runs':
      return (
        <RunHistoryPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'ai-firewall':
    case 'firewall':
    case 'rag-firewall':
    case 'agent-guard':
      return (
        <AiFirewallPage 
          onSwitchToMarketing={onBackToWebsite}
        />
      );

    case 'ml-certify':
    case 'ml-certification':
    case 'ml-gate':
    case 'drift-gate':
      return (
        <MlCertificationPage 
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
        <NotFoundPage 
          attemptedScreen={currentScreen} 
          onSwitchToMarketing={onBackToWebsite} 
        />
      );
  }
}

export default function DataXPoc({ onBackToWebsite }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [authMode, setAuthMode] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('register') || hash.includes('register') || hash.includes('signup')) {
      return 'register';
    }
    return 'login';
  });

  useEffect(() => {
    const handleAuthRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('register') || hash.includes('register') || hash.includes('signup')) {
        setAuthMode('register');
      } else if (path.includes('login') || hash.includes('login') || hash.includes('signin')) {
        setAuthMode('login');
      }
    };
    window.addEventListener('hashchange', handleAuthRoute);
    window.addEventListener('popstate', handleAuthRoute);
    return () => {
      window.removeEventListener('hashchange', handleAuthRoute);
      window.removeEventListener('popstate', handleAuthRoute);
    };
  }, []);

  // Show dark enterprise session verification loader
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">
          Verifying DataX Session...
        </span>
      </div>
    );
  }

  // Force authentication before entering DataX workspace
  if (!isSignedIn) {
    return (
      <DataXAuthPage 
        initialMode={authMode} 
        onBackToWebsite={onBackToWebsite} 
      />
    );
  }

  // Authenticated: Render DataX Multi-Tenant SaaS Workspace
  return (
    <RuleEngineProvider>
      <NavigationProvider initialScreen="threads">
        <ScreenRenderer onBackToWebsite={onBackToWebsite} />
      </NavigationProvider>
    </RuleEngineProvider>
  );
}
