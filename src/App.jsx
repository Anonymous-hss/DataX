import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Hero from './components/website/Hero';
import ProductsSection from './components/website/ProductsSection';
import ExpertiseSection from './components/website/ExpertiseSection';
import ArchitecturePipeline from './components/website/ArchitecturePipeline';
import CaseStudiesSection from './components/website/CaseStudiesSection';
import BookDemoModal from './components/website/BookDemoModal';
import DataXPoc from './components/poc/DataXPoc';

export default function App() {
  const [activeView, setActiveView] = useState('website'); // 'website' | 'poc'
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Sync with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#poc' || window.location.hash === '#datax') {
        setActiveView('poc');
      } else {
        setActiveView('website');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'poc') {
      window.location.hash = '#poc';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Universal Navbar */}
      <Navbar 
        activeView={activeView} 
        setActiveView={handleViewChange} 
        onOpenDemo={() => setDemoModalOpen(true)} 
      />

      {/* Main Body View */}
      <main className="flex-1">
        {activeView === 'website' ? (
          <div>
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
          </div>
        ) : (
          <DataXPoc 
            onBackToWebsite={() => handleViewChange('website')} 
          />
        )}
      </main>

      {/* Universal Footer */}
      <Footer 
        setActiveView={handleViewChange} 
        onOpenDemo={() => setDemoModalOpen(true)} 
      />

      {/* Enterprise Demo Modal */}
      <BookDemoModal 
        isOpen={demoModalOpen} 
        onClose={() => setDemoModalOpen(false)} 
      />

    </div>
  );
}
