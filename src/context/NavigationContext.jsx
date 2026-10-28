import React, { createContext, useContext, useState, useEffect } from 'react';

const SCREEN_TITLES = {
  threads: 'Workflows & Threads',
  workflows: 'Workflows & Threads',
  'new-workflow': 'New Autonomous Workflow',
  'new-thread': 'New Autonomous Workflow',
  templates: 'Domain Packs & Templates',
  'domain-packs': 'Domain Packs & Templates',
  connections: 'Enterprise Data Vault & Connectors',
  canvas: 'CleanFlow Studio Visual Canvas',
  'workflow-builder': 'CleanFlow Studio Visual Canvas',
  'rules-table': 'Rule Engine & AST Validator',
  'running-dry-run': 'Executing Dual-Twin Dry Run',
  'dry-run-results': 'Dry Run Verification Outcomes',
  'live-auto-fix': 'Autonomous Live Remediation',
  quarantine: 'Quarantine Workbench & DLQ',
  audit: 'Immutable Audit Trail & Lineage',
  shadow: 'Shadow Mode Dual-Pipeline Parity Certification',
  'shadow-mode': 'Shadow Mode Dual-Pipeline Parity Certification',
  'shadow-reconciler': 'Shadow Mode Dual-Pipeline Parity Certification',
  parity: 'Shadow Mode Dual-Pipeline Parity Certification',
  roi: 'Executive ROI & Board Compliance Dossier',
  'roi-dossier': 'Executive ROI & Board Compliance Dossier',
  'executive-roi': 'Executive ROI & Board Compliance Dossier',
  settings: 'Platform Settings & RBAC',
  help: 'Help Center & Documentation',
  history: 'Pipeline Execution Telemetry',
  runs: 'Pipeline Execution Telemetry',
  login: 'Sign In',
  register: 'Sign Up',
  'legacy-poc': 'SAP BW S/4HANA Modernizer'
};

const NavigationContext = createContext(null);

export function NavigationProvider({ children, initialScreen = 'threads' }) {
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  // Sync online / offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync with window.location.hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').replace(/^\/+/, '');
      if (hash && hash !== 'poc') {
        // Normalize deep links like runs/RUN-1234 to history
        if (hash.startsWith('runs/') || hash.startsWith('run/')) {
          setCurrentScreen('history');
        } else {
          setCurrentScreen(hash);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Dynamic Document Title Sync
  useEffect(() => {
    const cleanKey = currentScreen.toLowerCase();
    const title = SCREEN_TITLES[cleanKey] || 'Enterprise Decision Intelligence';
    document.title = `DataX | ${title}`;
  }, [currentScreen]);

  const navigateTo = (screen) => {
    const clean = screen.replace('#', '').replace(/^\/+/, '');
    setCurrentScreen(clean || 'threads');
    window.location.hash = `#${clean || 'threads'}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NavigationContext.Provider value={{ currentScreen, navigateTo, isOnline }}>
      {!isOnline && (
        <div className="bg-amber-500 text-slate-900 text-xs font-bold px-4 py-2 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-md">
          <span>⚠️ Offline Mode Active: You are currently disconnected. Changes will be saved locally and synchronized once connectivity resumes.</span>
        </div>
      )}
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    return {
      currentScreen: 'threads',
      isOnline: true,
      navigateTo: (to) => {
        const clean = to.replace('#', '').replace(/^\/+/, '');
        window.location.hash = `#${clean || 'threads'}`;
      },
    };
  }
  return context;
}

export function Link({ to, children, className = '', onClick, ...props }) {
  const { navigateTo } = useNavigation();

  const handleClick = (e) => {
    e.preventDefault();
    onClick?.(e);
    navigateTo(to);
  };

  return (
    <a href={`#${to.replace('#', '').replace(/^\/+/, '')}`} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
