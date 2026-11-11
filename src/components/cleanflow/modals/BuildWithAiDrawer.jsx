import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Database, 
  PenTool, 
  Layers, 
  AlertTriangle, 
  Lock, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  Pause, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal 
} from 'lucide-react';
import api from '../../../services/apiClient';

export default function BuildWithAiDrawer({
  isOpen,
  onClose,
  onApplyToCanvas,
  onPreviewDraft,
  existingNodes = []
}) {
  const [step, setStep] = useState('describe'); // 'describe' | 'analysing' | 'review'
  const [prompt, setPrompt] = useState(
    'Move customer records from MongoDB Atlas into PostgreSQL. Fix email syntax to RFC-5322, normalise phone numbers, remove duplicates by email, and send anything that can\'t be fixed to quarantine for review.'
  );
  const [selectedSource, setSelectedSource] = useState('MongoDB Atlas · customers');
  const [selectedTarget, setSelectedTarget] = useState('PostgreSQL · crm.customers');
  const [selectedDomainPack, setSelectedDomainPack] = useState('Customer 360 · 5 rules');
  const [refinementText, setRefinementText] = useState('');
  const [editingSuggestionId, setEditingSuggestionId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Editable rules state within N5
  const [ruleChecklist, setRuleChecklist] = useState([
    { id: 'r1', name: 'Email syntax · RFC-5322', desc: 'Auto-fix common typos, quarantine the rest', badge: 'Your prompt', checked: true },
    { id: 'r2', name: 'Phone format · E.164', desc: 'Auto-fix', badge: 'Your prompt', checked: true },
    { id: 'r3', name: 'De-duplicate by email', desc: 'Keep the most recently updated record', badge: 'Your prompt', checked: true },
    { id: 'r4', name: 'Name casing · Title Case', desc: 'In the pack, not in your prompt', badge: 'Pack only', checked: false }
  ]);
  const [selectedModel, setSelectedModel] = useState('gpt-5-mini');
  const [onFailureAction, setOnFailureAction] = useState('Send to quarantine');

  const handleStartDraft = async () => {
    setStep('analysing');
    setIsAnalysing(true);

    try {
      const res = await api.post('/workflow/ai-draft', {
        prompt,
        source: selectedSource,
        target: selectedTarget,
        domainPack: selectedDomainPack,
        existingNodes
      });

      if (res?.suggestions) {
        setSuggestions(res.suggestions);
        setAnalysisSteps(res.analysisSteps || []);
        if (onPreviewDraft) {
          onPreviewDraft(res.suggestions);
        }
      }
    } catch (err) {
      console.warn('Fallback to local draft synthesis:', err);
    }

    // Smooth step-through to show what AI is analysing matching N3
    setTimeout(() => {
      setIsAnalysing(false);
      setStep('review');
    }, 1400);
  };

  const handleAcceptSuggestion = (id) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'accepted' } : s));
  };

  const handleRejectSuggestion = (id) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
  };

  const handleAcceptRemaining = () => {
    setSuggestions(prev => prev.map(s => s.status !== 'rejected' ? { ...s, status: 'accepted' } : s));
  };

  const handleRefineWithAi = async () => {
    if (!refinementText.trim()) return;
    try {
      const res = await api.post('/workflow/ai-draft', {
        prompt: `${prompt}\nRefinement: ${refinementText}`,
        source: selectedSource,
        target: selectedTarget,
        domainPack: selectedDomainPack,
        refinement: refinementText
      });
      if (res?.suggestions) {
        setSuggestions(res.suggestions);
        if (onPreviewDraft) onPreviewDraft(res.suggestions);
      }
      setRefinementText('');
    } catch (err) {
      console.warn('Refinement failed:', err);
    }
  };

  const handleCommitNodesToCanvas = () => {
    const acceptedNodes = suggestions.filter(s => s.status === 'accepted');
    if (onApplyToCanvas) {
      onApplyToCanvas(acceptedNodes);
    }
    onClose();
  };

  if (!isOpen) return null;

  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const reviewCount = suggestions.filter(s => s.status === 'review').length;
  const rejectedCount = suggestions.filter(s => s.status === 'rejected').length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] lg:w-[540px] bg-white dark:bg-[#18181C] border-l border-[#E3E6EE] dark:border-white/[0.08] shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Top Header matching N2 - N5 */}
      <div className="p-5 border-b border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EFF4FF] dark:bg-blue-900/30 border border-[#D0E1FD] dark:border-blue-700/50 flex items-center justify-center text-[#2D55F5]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-[#0A0F1F] dark:text-white">
            Build with AI
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="px-6 py-3 border-b border-[#F1F3F7] dark:border-white/[0.06] bg-[#F8FAFC] dark:bg-white/[0.02] flex items-center justify-between text-xs font-semibold shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
            step === 'describe' ? 'bg-[#2D55F5] text-white' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {step === 'describe' ? '1' : <Check className="w-3 h-3 stroke-[3]" />}
          </span>
          <span className={step === 'describe' ? 'text-[#0A0F1F] dark:text-white font-bold' : 'text-[#5F6678]'}>
            Describe
          </span>
        </div>

        <span className="h-px w-8 bg-slate-200 dark:bg-white/[0.1]" />

        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
            step === 'analysing' || step === 'review' ? 'bg-[#2D55F5] text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            2
          </span>
          <span className={step === 'analysing' || step === 'review' ? 'text-[#0A0F1F] dark:text-white font-bold' : 'text-[#5F6678]'}>
            Review
          </span>
        </div>

        <span className="h-px w-8 bg-slate-200 dark:bg-white/[0.1]" />

        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/[0.1] text-slate-600 flex items-center justify-center text-[11px]">
            3
          </span>
          <span className="text-[#5F6678]">
            Add to canvas
          </span>
        </div>
      </div>

      {/* Drawer Body Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* =========================================================================
            STEP 1: DESCRIBE (Matching N2 · Build with AI · describe.png)
           ========================================================================= */}
        {step === 'describe' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-bold text-[#0A0F1F] dark:text-white">
                  What should this workflow do?
                </label>
                <span className="text-[#8E95A9] font-mono text-[11px]">
                  {prompt.length} / 1,000
                </span>
              </div>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-[#18181C] border border-[#2D55F5] rounded-2xl text-xs font-medium text-[#0A0F1F] dark:text-white focus:outline-none ring-2 ring-blue-500/10 resize-none leading-relaxed"
                placeholder="Mention the source, the target and what 'clean' means for this data."
              />
              <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-1.5">
                Mention the source, the target and what &quot;clean&quot; means for this data.
              </p>
            </div>

            {/* Context Section */}
            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-bold text-[#5F6678] uppercase tracking-wider">
                  CONTEXT
                </h4>
                <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-0.5">
                  Detected from your description. Change anything that&apos;s wrong.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#0A0F1F] dark:text-white mb-1">
                    Source
                  </label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#18181C] border border-[#CDD2DE] dark:border-white/[0.12] rounded-xl text-xs font-medium text-[#0A0F1F] dark:text-white cursor-pointer"
                  >
                    <option value="MongoDB Atlas · customers">MongoDB Atlas · customers</option>
                    <option value="SAP BW InfoCube · 0PUR_C01">SAP BW InfoCube · 0PUR_C01</option>
                    <option value="PostgreSQL · source_leads">PostgreSQL · source_leads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#0A0F1F] dark:text-white mb-1">
                    Target
                  </label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#18181C] border border-[#CDD2DE] dark:border-white/[0.12] rounded-xl text-xs font-medium text-[#0A0F1F] dark:text-white cursor-pointer"
                  >
                    <option value="PostgreSQL · crm.customers">PostgreSQL · crm.customers</option>
                    <option value="SAP S/4HANA · BAPI_PO_CREATE1">SAP S/4HANA · BAPI_PO_CREATE1</option>
                    <option value="Google BigQuery · clean_vault">Google BigQuery · clean_vault</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0A0F1F] dark:text-white mb-1">
                  Domain pack <span className="font-normal text-[#8E95A9]">Optional</span>
                </label>
                <select
                  value={selectedDomainPack}
                  onChange={(e) => setSelectedDomainPack(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#18181C] border border-[#CDD2DE] dark:border-white/[0.12] rounded-xl text-xs font-medium text-[#0A0F1F] dark:text-white cursor-pointer"
                >
                  <option value="Customer 360 · 5 rules">Customer 360 · 5 rules</option>
                  <option value="SAP S/4HANA Clean Core · 4 rules">SAP S/4HANA Clean Core · 4 rules</option>
                  <option value="Financial GL & SOX 404 · 6 rules">Financial GL & SOX 404 · 6 rules</option>
                </select>
              </div>
            </div>

            {/* Try An Example Pills */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-[#5F6678] uppercase tracking-wider">
                TRY AN EXAMPLE
              </h4>
              <div className="space-y-1.5">
                {[
                  'Mask SSNs and card numbers before prompts reach OpenAI',
                  'Check GL entries balance and use ISO currency codes',
                  'Block training data with drift above 10-bin PSI'
                ].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className="w-full text-left px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-white/[0.08] bg-[#F8FAFC] dark:bg-white/[0.03] hover:bg-[#F1F3F7] text-xs text-[#0A0F1F] dark:text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#2D55F5] shrink-0" />
                    <span className="truncate">{ex}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy callout box matching N2 */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#5F6678] dark:text-slate-400">
              <Lock className="w-4 h-4 text-[#8E95A9] shrink-0 mt-0.5" />
              <span>Reads column names and sample rows only. Nothing is added to the canvas until you approve it.</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2A: ANALYSING (Matching N3 · Build with AI · analysing.png)
           ========================================================================= */}
        {step === 'analysing' && (
          <div className="space-y-5">
            {/* Goal Card */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08] rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#5F6678] uppercase tracking-wider">
                  YOUR GOAL
                </span>
                <button
                  type="button"
                  onClick={() => setStep('describe')}
                  className="text-xs font-semibold text-[#2D55F5] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <PenTool className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <p className="text-[#0A0F1F] dark:text-white leading-relaxed line-clamp-3 font-medium">
                {prompt}
              </p>
            </div>

            {/* What It's Doing Progress Checklist */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-[#5F6678] uppercase tracking-wider">
                WHAT IT&apos;S DOING
              </h4>
              <div className="space-y-2">
                {[
                  { title: 'Read the source schema', detail: 'customers · 14 columns · email and phone found', done: true },
                  { title: 'Matched a domain pack', detail: 'Customer 360 · 3 of 5 rules fit your goal', done: true },
                  { title: 'Checked the target table', detail: 'crm.customers · email is UNIQUE and NOT NULL', done: true },
                  { title: 'Drafting the node order', detail: 'Deciding where unfixable rows should go', active: true },
                  { title: 'Writing a reason for each node', detail: 'Pending...', pending: true }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-[#18181C] border border-[#E2E8F0] dark:border-white/[0.08] rounded-xl flex items-start gap-3 text-xs"
                  >
                    <div className="mt-0.5">
                      {item.done ? (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                      ) : item.active ? (
                        <RotateCw className="w-4 h-4 text-[#2D55F5] animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#0A0F1F] dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#5F6678] dark:text-slate-400">
              <Lock className="w-4 h-4 text-[#8E95A9] shrink-0 mt-0.5" />
              <span>Read-only. Uses column names and sample values; nothing is written anywhere.</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2B & 2C: REVIEW SUGGESTIONS & INLINE EDIT (Matching N4 & N5)
           ========================================================================= */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Suggestions Header Count & Accept All */}
            <div className="flex items-center justify-between text-xs pb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0A0F1F] dark:text-white">
                  {suggestions.length} suggestions
                </span>
                <span className="text-[#5F6678] dark:text-slate-400">
                  {acceptedCount} accepted · {reviewCount} to review · {rejectedCount} rejected
                </span>
              </div>

              {reviewCount > 0 && (
                <button
                  type="button"
                  onClick={handleAcceptRemaining}
                  className="font-bold text-[#2D55F5] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept remaining</span>
                </button>
              )}
            </div>

            {/* List of Suggestion Cards */}
            <div className="space-y-3">
              {suggestions.map((sug) => {
                const isEditing = editingSuggestionId === sug.id;
                const isAccepted = sug.status === 'accepted';
                const isRejected = sug.status === 'rejected';

                return (
                  <div
                    key={sug.id}
                    className={`rounded-2xl border transition-all text-xs ${
                      isEditing
                        ? 'p-4 bg-white dark:bg-[#18181C] border-[#2D55F5] ring-2 ring-blue-500/10 shadow-md'
                        : isRejected
                          ? 'p-3.5 bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] opacity-60'
                          : isAccepted
                            ? 'p-3.5 bg-white dark:bg-[#18181C] border-[#CDD2DE] dark:border-white/[0.12] hover:border-slate-300'
                            : 'p-4 bg-[#EFF4FF] dark:bg-blue-950/20 border-[#D0E1FD] dark:border-blue-800/40'
                    }`}
                  >
                    {/* Top Row: Title + Step Index + Status Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-[#2D55F5] shrink-0 font-bold text-xs">
                          {sug.step > 0 ? sug.step : '–'}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#0A0F1F] dark:text-white leading-tight">
                            {sug.title}
                          </h4>
                          <span className="text-[11px] text-[#5F6678] dark:text-slate-400">
                            {sug.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Accepted
                          </span>
                        )}

                        {isRejected && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-semibold">Rejected</span>
                            <button
                              type="button"
                              onClick={() => handleAcceptSuggestion(sug.id)}
                              className="text-xs font-semibold text-[#2D55F5] hover:underline cursor-pointer"
                            >
                              Undo
                            </button>
                          </div>
                        )}

                        {!isAccepted && !isRejected && !isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingSuggestionId(sug.id)}
                              className="w-7 h-7 rounded-lg border border-[#CDD2DE] bg-white hover:bg-slate-50 flex items-center justify-center text-[#5F6678] cursor-pointer"
                              title="Edit suggestion"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectSuggestion(sug.id)}
                              className="w-7 h-7 rounded-lg border border-[#CDD2DE] bg-white hover:bg-slate-50 flex items-center justify-center text-[#5F6678] cursor-pointer"
                              title="Reject suggestion"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptSuggestion(sug.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#2D55F5] text-white font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-2xs hover:bg-blue-600"
                            >
                              <Check className="w-3 h-3" />
                              <span>Accept</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Standard Reason & Provenance */}
                    {!isEditing && (
                      <div className="mt-2 text-xs text-[#344054] dark:text-slate-300 leading-relaxed">
                        <p>{sug.reason}</p>
                        <p className="text-[11px] text-[#8E95A9] mt-1 font-medium">
                          ⓘ Based on: {sug.basedOn}
                        </p>
                      </div>
                    )}

                    {/* =====================================================
                        INLINE EDIT VIEW (Matching N5 · edit a suggestion.png)
                       ===================================================== */}
                    {isEditing && (
                      <div className="mt-4 pt-3 border-t border-[#F1F3F7] dark:border-white/[0.06] space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-[11px] font-bold text-[#0A0F1F] dark:text-white uppercase tracking-wider">
                              RULES
                            </h5>
                            <span className="text-[10px] text-[#8E95A9]">
                              From Customer 360. Untick what you don&apos;t need.
                            </span>
                          </div>

                          <div className="space-y-2 mt-2">
                            {ruleChecklist.map((rule) => (
                              <div
                                key={rule.id}
                                onClick={() => setRuleChecklist(prev => prev.map(r => r.id === rule.id ? { ...r, checked: !r.checked } : r))}
                                className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                                  rule.checked
                                    ? 'bg-[#EFF4FF] dark:bg-blue-950/20 border-[#D0E1FD] text-[#0A0F1F] dark:text-white'
                                    : 'bg-white dark:bg-[#18181C] border-[#E2E8F0] text-[#5F6678] opacity-60'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={rule.checked}
                                    onChange={() => {}}
                                    className="mt-0.5 accent-[#2D55F5]"
                                  />
                                  <div>
                                    <span className="font-bold text-xs block">{rule.name}</span>
                                    <span className="text-[11px] text-[#5F6678] dark:text-slate-400">{rule.desc}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-[#5F6678] font-mono shrink-0">
                                  {rule.badge}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Model & On Failure Pickers */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#0A0F1F] dark:text-white mb-1">
                              Model
                            </label>
                            <select
                              value={selectedModel}
                              onChange={(e) => setSelectedModel(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-[#18181C] border border-[#CDD2DE] rounded-xl text-xs"
                            >
                              <option value="gpt-5-mini">gpt-5-mini</option>
                              <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                              <option value="local-ontology">local-ontology</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#0A0F1F] dark:text-white mb-1">
                              On failure
                            </label>
                            <select
                              value={onFailureAction}
                              onChange={(e) => setOnFailureAction(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-[#18181C] border border-[#CDD2DE] rounded-xl text-xs"
                            >
                              <option value="Send to quarantine">Send to quarantine</option>
                              <option value="Auto-fix only">Auto-fix only</option>
                              <option value="Drop and alert">Drop and alert</option>
                            </select>
                          </div>
                        </div>

                        {/* Swapping Bar */}
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="text-[#8E95A9]">↺ Swap for:</span>
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-[#0A0F1F] cursor-pointer"
                          >
                            Custom rules
                          </button>
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-[#0A0F1F] cursor-pointer"
                          >
                            Firewall · tokenize
                          </button>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingSuggestionId(null)}
                            className="px-3 py-1.5 text-xs text-[#5F6678] hover:text-[#0A0F1F] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleAcceptSuggestion(sug.id);
                              setEditingSuggestionId(null);
                            }}
                            className="px-4 py-1.5 bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-2xs cursor-pointer"
                          >
                            ✓ Save and accept
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Natural-Language Refinement Input */}
            <div className="pt-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask for a change, e.g. &quot;also mask SSNs&quot;"
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRefineWithAi()}
                  className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-[#18181C] border border-[#CDD2DE] dark:border-white/[0.12] rounded-xl text-xs text-[#0A0F1F] dark:text-white placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5]"
                />
                <Sparkles className="w-4 h-4 text-[#7C3AED] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={handleRefineWithAi}
                  className="w-7 h-7 rounded-lg bg-[#2D55F5] hover:bg-blue-600 text-white flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-5 border-t border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-[#18181C] flex items-center justify-between shrink-0">
        {step === 'describe' ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6678] hover:text-[#0A0F1F] dark:text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartDraft}
              className="px-5 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Draft workflow</span>
            </button>
          </>
        ) : step === 'analysing' ? (
          <>
            <button
              type="button"
              onClick={() => setStep('describe')}
              className="px-4 py-2 rounded-xl border border-[#CDD2DE] text-xs font-semibold text-[#0A0F1F] dark:text-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2D55F5]">
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Drafting...</span>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleStartDraft}
              className="px-4 py-2 text-xs font-semibold text-[#5F6678] hover:text-[#0A0F1F] dark:text-slate-400 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={handleCommitNodesToCanvas}
              disabled={acceptedCount === 0}
              className="px-5 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <span>Add {acceptedCount} nodes to canvas</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

