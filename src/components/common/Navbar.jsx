
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Database, 
  Workflow, 
  Network, 
  ArrowRight, 
  Menu, 
  X, 
  ChevronDown, 
  Layers, 
  Cpu,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ activeView, setActiveView, onOpenDemo }) {
  const { isSignedIn, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdown, setProductsDropdown] = useState(false);
  const [expertiseDropdown, setExpertiseDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    if (activeView !== 'website') {
      setActiveView('website');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
    setProductsDropdown(false);
    setExpertiseDropdown(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#070b14]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl py-3.5' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveView('website')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-glow-cyan transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
              <div className="absolute -inset-0.5 rounded-xl bg-cyan-400/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-1.5">
                DataGlow<span className="text-cyan-400">.ai</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block -mt-1 font-semibold">
                Enterprise Semantic AI
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            
            {/* Products Dropdown */}
            <div className="relative" onMouseLeave={() => setProductsDropdown(false)}>
              <button 
                onMouseEnter={() => setProductsDropdown(true)}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50 flex items-center gap-1.5 transition-colors"
              >
                Products
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {productsDropdown && (
                <div 
                  onMouseEnter={() => setProductsDropdown(true)}
                  className="absolute top-full left-0 w-80 mt-1 p-2 rounded-2xl glass-panel shadow-2xl border border-slate-700/80 bg-[#0a1020]/95 animate-fadeIn"
                >
                  {/* Product 1: DataGlow Continuum */}
                  <div 
                    onClick={() => scrollTo('products')}
                    className="p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          DataGlow Continuum
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">v3.2</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Enterprise Data Readiness, Quality Index, Lineage & Drift Forecasting.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product 2: DataX */}
                  <div 
                    onClick={() => { setActiveView('poc'); setProductsDropdown(false); }}
                    className="p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors group mt-1"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20">
                        <Workflow className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          DataX Platform
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">Live POC</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Decision Intelligence: SAP BW → Intelligence Engine → S/4HANA → Databricks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expertise Dropdown */}
            <div className="relative" onMouseLeave={() => setExpertiseDropdown(false)}>
              <button 
                onMouseEnter={() => setExpertiseDropdown(true)}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50 flex items-center gap-1.5 transition-colors"
              >
                Expertise
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {expertiseDropdown && (
                <div 
                  onMouseEnter={() => setExpertiseDropdown(true)}
                  className="absolute top-full left-0 w-80 mt-1 p-2 rounded-2xl glass-panel shadow-2xl border border-slate-700/80 bg-[#0a1020]/95 animate-fadeIn"
                >
                  <div 
                    onClick={() => scrollTo('expertise')}
                    className="p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Network className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Ontologies & Knowledge Graphs</div>
                        <p className="text-xs text-slate-400 mt-0.5">Enterprise semantic fabric, entity linking & GraphRAG.</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => scrollTo('expertise')}
                    className="p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors mt-1"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Agentic Harness & Tool Calling</div>
                        <p className="text-xs text-slate-400 mt-0.5">Autonomous goal-oriented reasoning with verified tools.</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => scrollTo('architecture')}
                    className="p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors mt-1"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">SAP to Databricks Modernization</div>
                        <p className="text-xs text-slate-400 mt-0.5">Bridging legacy BW/ECC to S/4HANA & Delta Lake.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => scrollTo('architecture')} 
              className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              Pipeline Architecture
            </button>

            <button 
              onClick={() => scrollTo('case-studies')} 
              className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              Enterprise Impact
            </button>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {isSignedIn ? (
              <button
                type="button"
                onClick={() => setActiveView('poc')}
                className="w-8 h-8 rounded-full border border-slate-700 hover:border-cyan-400 bg-gradient-to-tr from-cyan-600 to-blue-600 text-white text-xs font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title={`${user?.fullName || 'User'} (${user?.email || ''})`}
              >
                {(user?.fullName || 'U').slice(0, 2).toUpperCase()}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#login';
                  setActiveView('poc');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg border border-slate-700/80 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                Sign in
              </button>
            )}

            <button 
              onClick={onOpenDemo}
              className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white rounded-xl border border-slate-700/80 hover:bg-slate-800/60 transition-all"
            >
              Book Demo
            </button>

            <button 
              onClick={() => setActiveView(activeView === 'poc' ? 'website' : 'poc')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-glow-cyan ${
                activeView === 'poc'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500'
              }`}
            >
              {activeView === 'poc' ? (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  View Company Website
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current text-white" />
                  Launch DataX POC
                  <span className="px-1.5 py-0.2 bg-white/25 rounded text-[10px] font-mono">Live</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <button 
              onClick={() => setActiveView(activeView === 'poc' ? 'website' : 'poc')}
              className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 text-slate-950 rounded-lg flex items-center gap-1.5"
            >
              {activeView === 'poc' ? 'Website' : 'DataX POC'}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a1020]/98 border-b border-slate-800 px-4 pt-3 pb-6 mt-2 space-y-3">
          <button 
            onClick={() => scrollTo('products')}
            className="w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Products (Continuum & DataX)
          </button>
          <button 
            onClick={() => scrollTo('expertise')}
            className="w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Ontologies & Knowledge Graphs
          </button>
          <button 
            onClick={() => scrollTo('architecture')}
            className="w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Enterprise Pipeline (SAP BW → Databricks)
          </button>
          <button 
            onClick={() => scrollTo('case-studies')}
            className="w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Enterprise Impact
          </button>
          <div className="pt-2 flex flex-col gap-2">
            <button 
              onClick={() => { setActiveView('poc'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-cyan-500 text-slate-950 shadow-glow-cyan"
            >
              Launch Live DataX POC
            </button>
            <button 
              onClick={() => { onOpenDemo(); setMobileMenuOpen(false); }}
              className="w-full py-2.5 text-center text-sm font-semibold rounded-xl border border-slate-700 text-white"
            >
              Book an Enterprise Demo
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
