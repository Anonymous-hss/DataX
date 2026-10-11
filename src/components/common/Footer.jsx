import React from 'react';
import { Sparkles, ArrowRight, Github, Twitter, Linkedin, Database, Network, ShieldCheck, Mail } from 'lucide-react';

export default function Footer({ setActiveView, onOpenDemo }) {
  return (
    <footer className="bg-[#04070d] border-t border-slate-800/80 pt-16 pb-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-cyan-900/10 via-blue-900/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/60">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-glow-cyan">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-white tracking-tight">
                DataGlow<span className="text-cyan-400">.ai</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The premier Enterprise Semantic Foundation & Decision Intelligence Platform. Powering automated ontologies, knowledge graphs, and agentic data transformation across SAP, S/4HANA, and modern Databricks Lakehouses.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a href="#" className="p-2 rounded-lg hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 1: Production Products */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold">
              Flagship Products
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#products" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  DataGlow Continuum
                </a>
              </li>
              <li>
                <button 
                  onClick={() => setActiveView('poc')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  DataX Platform (Live POC)
                </button>
              </li>
              <li>
                <a href="#products" className="hover:text-cyan-400 transition-colors">
                  Data Readiness Scoring
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-cyan-400 transition-colors">
                  Meridian Lineage Audit
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-cyan-400 transition-colors">
                  Cross-Model Consistency
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Core Expertise */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold">
              Core Expertise
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#expertise" className="hover:text-cyan-400 transition-colors">
                  Enterprise Ontologies
                </a>
              </li>
              <li>
                <a href="#expertise" className="hover:text-cyan-400 transition-colors">
                  Knowledge Graphs & GraphRAG
                </a>
              </li>
              <li>
                <a href="#expertise" className="hover:text-cyan-400 transition-colors">
                  Agentic Tool Calling Harness
                </a>
              </li>
              <li>
                <a href="#expertise" className="hover:text-cyan-400 transition-colors">
                  Semantic Entity Resolution
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-cyan-400 transition-colors">
                  SAP BW to Lakehouse Pipeline
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Enterprise & Demo */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold">
              Solutions & Proof
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={onOpenDemo} className="hover:text-cyan-400 transition-colors text-left">
                  Schedule Executive Briefing
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('poc')} className="hover:text-cyan-400 transition-colors text-left">
                  Test SAP BW Simulation
                </button>
              </li>
              <li>
                <a href="#case-studies" className="hover:text-cyan-400 transition-colors">
                  Enterprise Case Studies
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" /> SOC2 Type II Certified
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} DataGlow.ai (AAVIL Inc). All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Security Architecture</a>
            <a href="#" className="hover:text-slate-300">Trust Center</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
