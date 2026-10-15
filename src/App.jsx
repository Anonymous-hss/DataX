import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Hero from './components/website/Hero';
import ProductsSection from './components/website/ProductsSection';
import ExpertiseSection from './components/website/ExpertiseSection';
import ArchitecturePipeline from './components/website/ArchitecturePipeline';
import CaseStudiesSection from './components/website/CaseStudiesSection';
import BookDemoModal from './components/website/BookDemoModal';
const DataXPoc = React.lazy(() => import('./components/poc/DataXPoc'));

export default function App() {
  const [activeView, setActiveView] = useState('poc'); // Default to DataX PoC app view
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Sync with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (
        hash === '#poc' ||
        hash === '#datax' ||
        hash === '#threads' ||
        hash === '#new-thread' ||
        hash === '#connect-source' ||
        hash === '#connect-target' ||
        hash === '#rules' ||
        hash === '#running-dry-run' ||
        hash === '#dry-run-results' ||
        hash === '#live-auto-fix' ||
        hash === '#history'
      ) {
        setActiveView('poc');
      } else if (hash === '#website') {
        setActiveView('website');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'sandbox') {
      window.location.hash = '#sandbox';
    } else if (view === 'poc') {
      window.location.hash = '#poc';
    } else {
      window.location.hash = '#website';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen ${activeView === 'website' ? 'bg-[#060a12] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300' : 'bg-[#F8FAFC] text-slate-900 selection:bg-blue-500/20 selection:text-blue-700'} flex flex-col font-sans`}>
      {/* Universal Navbar (Only show on website view, DataX app has its own dedicated top bar) */}
      {activeView === 'website' && (
        <Navbar 
          activeView={activeView} 
          setActiveView={handleViewChange} 
          onOpenDemo={() => setDemoModalOpen(true)} 
        />
      )}

      <main className="flex-1">
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
            <ExpertiseSection />
            <ArchitecturePipeline 
              setActiveView={handleViewChange} 
            />
            <CaseStudiesSection />
          </>
        )}
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
