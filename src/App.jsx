import React, { useState, useEffect } from 'react';
import LandingNavbar from './components/website/LandingNavbar';
import Footer from './components/common/Footer';
import Hero from './components/website/Hero';
import ProductsSection from './components/website/ProductsSection';
import HowItWorksSection from './components/website/HowItWorksSection';
import UseCasesSection from './components/website/UseCasesSection';
import BusinessLeadersSection from './components/website/BusinessLeadersSection';
import ControlSection from './components/website/ControlSection';
import BookDemoModal from './components/website/BookDemoModal';
import ErrorBoundary from './components/common/ErrorBoundary';
const DataXPoc = React.lazy(() => import('./components/poc/DataXPoc'));

export default function App() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === 'undefined') return 'website';
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash === '#website') return 'website';
    if (hash && hash !== '#' && hash !== '#/') return 'poc';
    if (path.includes('poc') || path.includes('cleanflow') || path.includes('canvas') || path.includes('threads') || path.includes('studio')) return 'poc';
    return 'website';
  });
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Sync with URL hash and pathname
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      // Only show marketing website if explicitly on #website or root path with no hash
      if (hash === '#website') {
        setActiveView('website');
      } else if (hash && hash !== '#' && hash !== '#/') {
        // Any Studio / App route (#canvas, #threads, #workflows, #templates, #connections, #runs, etc.)
        setActiveView('poc');
      } else if (
        path.includes('poc') ||
        path.includes('cleanflow') ||
        path.includes('canvas') ||
        path.includes('threads') ||
        path.includes('studio')
      ) {
        setActiveView('poc');
      } else {
        setActiveView('website');
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'poc') {
      window.location.hash = '#poc';
    } else {
      window.location.hash = '#website';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen ${activeView === 'website' ? 'bg-[#0A0F1F] text-slate-100 selection:bg-blue-500/20 selection:text-blue-300' : 'bg-[#F8FAFC] text-slate-900 selection:bg-blue-500/20 selection:text-blue-700'} flex flex-col font-sans`}>
      {/* Universal Navbar (Only on website view) */}
      {activeView === 'website' && (
        <LandingNavbar 
          setActiveView={handleViewChange} 
          onOpenDemo={() => setDemoModalOpen(true)} 
        />
      )}

      <main className="flex-1">
        <ErrorBoundary>
          {activeView === 'poc' ? (
            <React.Suspense fallback={
              <div className="min-h-screen bg-[#0A0F1F] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
            }>
              <DataXPoc onBackToWebsite={() => handleViewChange('website')} />
            </React.Suspense>
          ) : (
            <>
              <Hero 
                setActiveView={handleViewChange} 
                onOpenDemo={() => setDemoModalOpen(true)} 
              />
              <ProductsSection 
                setActiveView={handleViewChange} 
                onOpenDemo={() => setDemoModalOpen(true)} 
              />
              <HowItWorksSection />
              <UseCasesSection onOpenDemo={() => setDemoModalOpen(true)} />
              <BusinessLeadersSection />
              <ControlSection onOpenDemo={() => setDemoModalOpen(true)} />
            </>
          )}
        </ErrorBoundary>
      </main>

      {/* Universal Footer (Only on website view) */}
      {activeView === 'website' && (
        <Footer 
          setActiveView={handleViewChange} 
          onOpenDemo={() => setDemoModalOpen(true)} 
        />
      )}

      {/* Enterprise Demo Modal */}
      <BookDemoModal 
        isOpen={demoModalOpen} 
        onClose={() => setDemoModalOpen(false)} 
      />
    </div>
  );
}
