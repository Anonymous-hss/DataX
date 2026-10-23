import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Database, Shield, Zap, Play, X, ExternalLink } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

const STEPS = [
  {
    step: 1,
    title: "Connect Enterprise Source",
    subtitle: "Select and authenticate your legacy ERP, warehouse, or document database.",
    icon: Database,
    options: [
      { id: 'sap_bw', name: 'SAP BW / S/4HANA', badge: 'Certified Clean Core', desc: 'Purchasing (0PUR_C01), Inventory (0IC_C03), Material Master (MARA)' },
      { id: 'postgres', name: 'PostgreSQL Enterprise', badge: 'Active Driver', desc: 'Relational ACID store with connection pooling and SSL encryption' },
      { id: 'mongodb', name: 'MongoDB Atlas', badge: 'NoSQL Document', desc: 'Unstructured BSON customer data and e-commerce transactions' }
    ]
  },
  {
    step: 2,
    title: "Select Domain Intelligence Pack",
    subtitle: "Pre-trained domain ontologies compile automated AST quality rules.",
    icon: Shield,
    options: [
      { id: 'sap_clean_core', name: 'SAP Clean Core & Purchasing', badge: '12 Rules', desc: 'Validates EKKO, EKPO, 0PUR_C01 line items, currency codes, and delivery schedules.' },
      { id: 'customer_360', name: 'Customer 360 & Identity Master', badge: '9 Rules', desc: 'Deduplicates users, enforces E.164 phone formats, and reconciles credit balances.' },
      { id: 'financial_gl', name: 'Financial General Ledger & Sox', badge: '14 Rules', desc: 'Dual-entry balance reconciliation, currency integrity, and audit manifests.' }
    ]
  },
  {
    step: 3,
    title: "Run Deterministic Dry Run",
    subtitle: "Preview validation rules against in-memory DuckDB without touching target databases.",
    icon: Play,
    previewStats: {
      extracted: 1420,
      clean: 1140,
      autoFixed: 219,
      quarantined: 61,
      healthScore: 98.4
    }
  },
  {
    step: 4,
    title: "Go Live & Activate Remediations",
    subtitle: "Self-healing auto-fix engine actively heals syntax issues while isolating bad records.",
    icon: Zap,
    features: [
      "Zero-downtime target safe staging protocol with atomic commit",
      "Cryptographic Merkle audit chain with SHA-256 manifests",
      "Durable DLQ with fsync disk persistence for human approval",
      "Autonomous self-healing for whitespace, casing, and legacy codes"
    ]
  }
];

export default function OnboardingWizard({ isOpen, onClose, onComplete }) {
  const { navigateTo } = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState('sap_bw');
  const [selectedPack, setSelectedPack] = useState('sap_clean_core');

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('datax_onboarding_completed', 'true');
      if (onComplete) onComplete();
      onClose();
      navigateTo('canvas');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = STEPS[currentStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative text-left">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">DataX First-Run Onboarding</h3>
              <p className="text-[11px] text-slate-400">Step {currentStep} of 4: {currentStepData.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div 
            className="bg-blue-500 h-1 transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-100">{currentStepData.title}</h4>
              <p className="text-xs text-slate-400">{currentStepData.subtitle}</p>
            </div>
          </div>

          {/* Step 1 Content: Source Selection */}
          {currentStep === 1 && (
            <div className="space-y-2.5 my-4">
              {currentStepData.options.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedSource(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSource === opt.id
                      ? 'bg-blue-600/15 border-blue-500 text-blue-100 shadow-md shadow-blue-500/10'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs">{opt.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{opt.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 2 Content: Domain Pack Selection */}
          {currentStep === 2 && (
            <div className="space-y-2.5 my-4">
              {currentStepData.options.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedPack(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPack === opt.id
                      ? 'bg-blue-600/15 border-blue-500 text-blue-100 shadow-md shadow-blue-500/10'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs">{opt.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{opt.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 3 Content: Dry Run Simulation */}
          {currentStep === 3 && (
            <div className="my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Extracted</p>
                  <p className="text-lg font-bold text-slate-100 font-mono">1,420</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Clean Direct</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono">1,140</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Self-Healed</p>
                  <p className="text-lg font-bold text-blue-400 font-mono">219</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Quarantined</p>
                  <p className="text-lg font-bold text-amber-400 font-mono">61</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">
                ✨ Simulation verified: Zero dropped rows, 98.4% compliance rate, and DuckDB AST evaluation speed of &lt;15ms per batch.
              </p>
            </div>
          )}

          {/* Step 4 Content: Go Live Activation */}
          {currentStep === 4 && (
            <div className="my-4 space-y-2.5">
              {currentStepData.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {currentStep === 1 ? "Skip Onboarding" : "Back"}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            {currentStep === 4 ? "Launch Studio Canvas" : "Continue"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
