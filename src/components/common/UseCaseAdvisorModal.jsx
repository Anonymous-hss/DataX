import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  ChevronRight,
  Terminal,
  Bot
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import api from '../../services/apiClient';

const ROLES = [
  { id: 'ai_engineer', label: 'AI / LLM Engineer', icon: Bot },
  { id: 'ml_scientist', label: 'ML / Data Scientist', icon: Cpu },
  { id: 'data_engineer', label: 'Data & Analytics Engineer', icon: Database },
  { id: 'finance_ops', label: 'Finance & Controller', icon: ShieldCheck },
];

const STACK_TAGS = [
  'OpenAI / LangGraph',
  'Pinecone / Vector DB',
  'HuggingFace / Vertex AI',
  'MongoDB Atlas',
  'PostgreSQL / Neon',
  'Snowflake / BigQuery',
  'SAP ERP / S/4HANA',
  'Stripe / Billing',
  'AWS S3 / Parquet'
];

export default function UseCaseAdvisorModal({ isOpen, onClose }) {
  const { navigateTo } = useNavigation();
  const ruleEngine = useRuleEngine?.() || {};
  const [selectedRole, setSelectedRole] = useState('ai_engineer');
  const [selectedStack, setSelectedStack] = useState(['OpenAI / LangGraph', 'Pinecone / Vector DB']);
  const [customGoal, setCustomGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  if (!isOpen) return null;

  const toggleStackTag = (tag) => {
    setSelectedStack(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerateRecommendations = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/advisor/recommend', {
        role: selectedRole,
        stack: selectedStack,
        goal: customGoal || undefined
      });
      if (res && res.recommendations) {
        setRecommendations(res.recommendations);
      }
    } catch (err) {
      console.warn('Advisor fallback to client synthesis:', err);
      // Client-side fallback if offline
      const isAi = selectedRole === 'ai_engineer' || selectedStack.some(s => s.includes('OpenAI') || s.includes('Pinecone'));
      const isMl = selectedRole === 'ml_scientist' || selectedStack.some(s => s.includes('HuggingFace') || s.includes('Vertex'));
      
      const fallbackRecs = [];
      if (isAi) {
        fallbackRecs.push({
          id: 'ai_rag_firewall',
          pillar: 'AI_FIREWALL',
          badge: 'Pillar 2 · GenAI Trust',
          title: 'AI Agent & RAG Pre-Embedding Data Firewall',
          tagline: 'Stop hidden prompt injections, leaked credentials, and hallucinated $50k tool calls.',
          theRisk: 'Enterprise RAG vector databases get poisoned with indirect prompt injections from uploaded vendor PDFs. Customer-support agents hallucinate massive refunds or run destructive SQL queries.',
          howDataXSolvesIt: [
            '1. Pre-Embedding Scan: Detects system-prompt overrides & auto-redacts API keys/SSNs in <25ms before vectorization.',
            '2. Synchronous Agent Guard: Intercepts tool calls like refund_amount or SQL query, enforcing strict financial ceilings and read-only AST guards.',
            '3. Human-in-the-Loop Gate: High-dollar or ambiguous transactions are automatically paused for human sign-off.'
          ],
          route: 'ai-firewall',
          actionLabel: 'Launch AI Firewall Studio'
        });
      }
      if (isMl || !isAi) {
        fallbackRecs.push({
          id: 'ml_dataset_certification',
          pillar: 'ML_CERTIFY',
          badge: 'Pillar 3 · ML Trust',
          title: 'ML Training & LLM Fine-Tuning Dataset Certification Gate',
          tagline: 'Detect target leakage, distribution shift, and memorized secrets before wasting $20k on GPU training.',
          theRisk: 'Training models on dirty datasets causes catastrophic post-deployment failures: target leakage features (r >= 0.90) artificially inflate validation accuracy, and distribution drift destroys live inference.',
          howDataXSolvesIt: [
            '1. Real PSI Covariate Drift: Computes 10-bucket quantile Population Stability Index to catch feature shifts.',
            '2. Automatic Target Leakage Scanner: Flags features that suspiciously predict the label post-event.',
            '3. Cryptographic Governance Dossier: Issues an EU AI Act & SR 11-7 release card with SHA-256 seal.'
          ],
          route: 'ml-certify',
          actionLabel: 'Launch ML Certification Studio'
        });
      }
      fallbackRecs.push({
        id: 'financial_clean_core',
        pillar: 'DATA_PIPELINE',
        badge: 'Pillar 1 · Data Pipelines',
        title: 'Autonomous Database Clean-Core & Migration Gate',
        tagline: 'Migrate and sync data between MongoDB, Postgres, Snowflake & ERP with zero dirty records.',
        theRisk: 'Raw operational databases contain negative numbers, broken foreign keys, invalid emails, and unvalidated status transitions that break downstream ledgers.',
        howDataXSolvesIt: [
          '1. In-Memory Vectorized AST: Compiles and evaluates business rules in <50ms using DuckDB.',
          '2. Autonomous Auto-Fix: Normalizes whitespace, casing, and inverted signs deterministically.',
          '3. Durable DLQ: Quarantines non-compliant records for data steward review.'
        ],
        route: 'canvas',
        actionLabel: 'Open Canvas Pipeline'
      });
      setRecommendations(fallbackRecs.slice(0, 3));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchBlueprint = (rec) => {
    onClose();
    if (rec.route === 'ai-firewall') {
      navigateTo('ai-firewall');
    } else if (rec.route === 'ml-certify') {
      navigateTo('ml-certify');
    } else if (rec.route === 'shadow') {
      navigateTo('shadow');
    } else {
      navigateTo('canvas');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2D55F5] to-purple-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg tracking-tight text-white">
                  DataX Use-Case Discovery Advisor
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-blue-200 border border-white/20">
                  AI Solution Guide
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tell us your role and tools — we will map exact DataX protection blueprints and ROI to your architecture.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {!recommendations ? (
            <div className="space-y-5">
              {/* Step 1: Select Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. What is your primary responsibility?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#2D55F5] shadow-xs ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[#2D55F5]' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#2D55F5]' : 'text-slate-800'}`}>
                          {r.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Stack Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  2. Select tools in your production stack:
                </label>
                <div className="flex flex-wrap gap-2">
                  {STACK_TAGS.map(tag => {
                    const isChecked = selectedStack.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleStackTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                          isChecked
                            ? 'bg-[#2D55F5] text-white border-[#2D55F5] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {isChecked ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Optional Natural Language Goal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  3. Describe your goal or current data headache in plain English (Optional):
                </label>
                <textarea
                  rows={3}
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="e.g. We have a RAG chatbot reading customer support PDFs and issuing refunds, but we worry about prompt injections and hallucinated refund limits..."
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2D55F5] transition-all"
                />
              </div>

              {/* Action Trigger */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateRecommendations}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-2xl bg-[#2D55F5] hover:bg-[#1E44E0] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'Analyzing Architecture...' : 'Synthesize Tailored Blueprints'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ) : (
            /* Recommendations View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Recommended Solutions for Your Architecture
                  </h4>
                  <p className="text-xs text-slate-500">
                    Based on your role ({selectedRole.replace('_', ' ')}) and stack ({selectedStack.slice(0, 3).join(', ')}...)
                  </p>
                </div>
                <button
                  onClick={() => setRecommendations(null)}
                  className="text-xs font-semibold text-[#2D55F5] hover:underline cursor-pointer"
                >
                  ← Edit Inputs
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#2D55F5] border border-blue-200">
                          {rec.badge}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 tracking-tight leading-snug">
                        {rec.title}
                      </h5>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {rec.tagline}
                      </p>

                      {/* The Risk Warning */}
                      <div className="mt-3.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 leading-snug">
                        <div className="font-bold flex items-center gap-1 text-amber-800 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>The Silent Failure Risk:</span>
                        </div>
                        <p>{rec.theRisk}</p>
                      </div>

                      {/* How DataX Solves It */}
                      <div className="mt-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          How DataX Solves It:
                        </span>
                        {rec.howDataXSolvesIt.map((step, idx) => (
                          <div key={idx} className="text-[11px] text-slate-700 leading-snug flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Launch Action */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleLaunchBlueprint(rec)}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#2D55F5] hover:bg-[#1E44E0] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{rec.actionLabel}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
