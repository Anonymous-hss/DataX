import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  FileCode2,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
  Bot,
  Activity,
  FileText
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import api from '../services/apiClient';

export default function AiFirewallPage() {
  const { navigateTo } = useNavigation();
  const [activeMode, setActiveMode] = useState('rag'); // 'rag' | 'tool_call' | 'integration'
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Mode A: RAG Document Guard states
  const [ragChunks, setRagChunks] = useState([]);
  const [ragScanResult, setRagScanResult] = useState(null);
  const [selectedChunkIdx, setSelectedChunkIdx] = useState(0);

  // Mode B: Agent Tool Call Guard states
  const [sampleAttacks, setSampleAttacks] = useState([]);
  const [selectedAttackIdx, setSelectedAttackIdx] = useState(0);
  const [toolCallPayload, setToolCallPayload] = useState({
    agent_id: 'customer_support_agent_v2',
    tool_name: 'stripe_refund_tool',
    arguments: {
      charge_id: 'ch_3M4194A',
      refund_amount: 48500.0,
      currency: 'usd',
      reason: 'Customer unhappy with billing delays'
    },
    policies: { max_financial_limit: 5000.0, hitl_threshold: 500.0 }
  });
  const [toolVerdict, setToolVerdict] = useState(null);

  // Mode C: Live Events from Neon PostgreSQL
  const [recentEvents, setRecentEvents] = useState([]);

  // Load sample RAG corpus & tool attacks on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [corpusRes, attacksRes, eventsRes] = await Promise.all([
          api.get('/firewall/sample-corpus').catch(() => null),
          api.get('/firewall/sample-tool-attacks').catch(() => null),
          api.get('/firewall/events').catch(() => null)
        ]);

        if (corpusRes && corpusRes.corpus) {
          setRagChunks(corpusRes.corpus);
        }
        if (attacksRes && attacksRes.attacks) {
          setSampleAttacks(attacksRes.attacks);
        }
        if (eventsRes && eventsRes.events) {
          setRecentEvents(eventsRes.events);
        }
      } catch (err) {
        console.warn('Firewall initial load note:', err);
      }
    }
    loadInitialData();
  }, []);

  // Run RAG Batch Scan
  const handleScanRagBatch = async () => {
    if (!ragChunks || ragChunks.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/firewall/scan-rag-batch', {
        chunks: ragChunks,
        persist: true
      });
      if (res) {
        setRagScanResult(res);
        setSelectedChunkIdx(0);
      }
    } catch (err) {
      console.error('RAG scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run Agent Tool Interception
  const handleInterceptToolCall = async (customPayload) => {
    const payloadToSend = customPayload || toolCallPayload;
    setLoading(true);
    try {
      const res = await api.post('/firewall/intercept', payloadToSend);
      if (res) {
        setToolVerdict(res);
        // Refresh live events
        const evRes = await api.get('/firewall/events').catch(() => null);
        if (evRes && evRes.events) setRecentEvents(evRes.events);
      }
    } catch (err) {
      console.error('Tool interception failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAttackPreset = (attack, idx) => {
    setSelectedAttackIdx(idx);
    const p = {
      agent_id: attack.agent_id,
      tool_name: attack.tool_name,
      arguments: attack.arguments,
      policies: attack.policies || {}
    };
    setToolCallPayload(p);
    handleInterceptToolCall(p);
  };

  const selectedChunk = ragScanResult?.results?.[selectedChunkIdx] || null;

  return (
    <DataXAppShell>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Pillar 2 · GenAI Data Firewall
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              AI Agent &amp; RAG Pre-Embedding Data Firewall
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Protect your Pinecone/pgvector vector databases from poisoned document embeddings, and intercept hallucinated or malicious AI agent tool calls in under 25ms before they hit production APIs.
            </p>

            {/* Mode Switcher Tabs */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveMode('rag')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeMode === 'rag'
                    ? 'bg-[#2D55F5] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Pre-Embedding RAG Document Guard</span>
              </button>
              <button
                onClick={() => setActiveMode('tool_call')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeMode === 'tool_call'
                    ? 'bg-[#2D55F5] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>In-Flight Agent Tool Interceptor (&lt;25ms)</span>
              </button>
              <button
                onClick={() => setActiveMode('integration')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeMode === 'integration'
                    ? 'bg-[#2D55F5] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>Python SDK &amp; Webhook API</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MODE 1: PRE-EMBEDDING RAG DOCUMENT GUARD
           ========================================================================= */}
        {activeMode === 'rag' && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Knowledge Stream:</span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-blue-50 text-[#2D55F5] border border-blue-200">
                  {ragChunks.length} Enterprise Chunks Staged
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  (Contains planted prompt injections, leaked AWS/OpenAI keys, and SSNs)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleScanRagBatch}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E44E0] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Evaluating AST & Redacting...' : 'Scan & Redact RAG Batch'}</span>
                </button>
              </div>
            </div>

            {/* Results KPI Summary */}
            {ragScanResult && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-in fade-in duration-200">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-mono font-semibold text-slate-500">TOTAL EVALUATED</span>
                  <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{ragScanResult.totalChunks} Chunks</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                  <span className="text-[11px] font-mono font-bold text-emerald-700">VERIFIED CLEAN</span>
                  <div className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">{ragScanResult.verifiedCount}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
                  <span className="text-[11px] font-mono font-bold text-blue-700">AUTO-REDACTED</span>
                  <div className="text-xl font-extrabold text-blue-700 font-mono mt-0.5">{ragScanResult.redactedCount} ({ragScanResult.totalRedactionsApplied} fixes)</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
                  <span className="text-[11px] font-mono font-bold text-amber-800">QUARANTINED</span>
                  <div className="text-xl font-extrabold text-amber-800 font-mono mt-0.5">{ragScanResult.quarantinedCount} Attacks</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-mono font-semibold text-slate-500">TRUST SCORE</span>
                  <div className="text-xl font-extrabold text-[#2D55F5] font-mono mt-0.5">{ragScanResult.overallHealth}%</div>
                </div>
              </div>
            )}

            {/* Two-Column Document & Diff Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Chunk List */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-[520px]">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Document Stream</span>
                  <span className="text-xs font-mono text-slate-500">{ragChunks.length} documents</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {ragChunks.map((chunk, idx) => {
                    const res = ragScanResult?.results?.[idx];
                    const isSelected = selectedChunkIdx === idx;
                    const isQuarantined = res?.verdict === 'QUARANTINED';
                    const isRedacted = res?.verdict === 'REDACTED_PASS';

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedChunkIdx(idx)}
                        className={`p-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-l-4 border-l-[#2D55F5]'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {chunk.docName}
                          </span>
                          {res && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                isQuarantined
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : isRedacted
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {res.verdict}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 font-mono">
                          {chunk.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Chunk Inspection & Redaction Diff */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-[520px] overflow-y-auto">
                {selectedChunk ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{selectedChunk.docName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              selectedChunk.verdict === 'QUARANTINED'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : selectedChunk.verdict === 'REDACTED_PASS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {selectedChunk.verdict}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          Trust Score: <strong className="text-slate-800">{selectedChunk.trustScore} / 10</strong> · Latency: {selectedChunk.elapsedMs}ms
                        </span>
                      </div>

                      {selectedChunk.verdict === 'QUARANTINED' && (
                        <button
                          onClick={() => navigateTo('quarantine')}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>View in Quarantine DLQ</span>
                        </button>
                      )}
                    </div>

                    {/* Violations Callout if Quarantined */}
                    {selectedChunk.violations.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Security Violations Detected:
                        </span>
                        {selectedChunk.violations.map((v, i) => (
                          <div key={i} className="text-[11px] text-amber-800 font-mono">
                            • {v}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Redactions Diff */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Raw Incoming Ingest
                        </span>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 h-44 overflow-y-auto leading-relaxed">
                          {selectedChunk.originalText}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
                          Sanitized Outbound Stream (Ready for Pinecone)
                        </span>
                        <div className="p-3.5 bg-emerald-50/30 rounded-xl border border-emerald-200 text-xs font-mono text-slate-900 h-44 overflow-y-auto leading-relaxed">
                          {selectedChunk.sanitizedText}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
                      <span>Shannon Entropy: <strong className="text-slate-700">{selectedChunk.entropy}</strong></span>
                      <span>SHA-256 Seal: <strong className="text-slate-700">{(selectedChunk.sha256Seal || '—').substring(0, 20)}...</strong></span>
                      <span className="text-emerald-700 font-semibold">Persisted to Neon Postgres: datax_verified_rag_chunks</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
                    <FileText className="w-8 h-8 text-slate-300" />
                    <p>Click "Scan &amp; Redact RAG Batch" above to evaluate and inspect certified document chunks.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 2: IN-FLIGHT AGENT TOOL-CALL GUARDRAIL (<25ms)
           ========================================================= */}
        {activeMode === 'tool_call' && (
          <div className="space-y-5">
            {/* 1-Click Attack Presets */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1-Click Live Agent Attack Simulations:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {sampleAttacks.map((att, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAttackPreset(att, idx)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedAttackIdx === idx
                        ? 'bg-blue-50/80 border-[#2D55F5] shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 leading-tight">{att.title}</span>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">{att.tool_name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interceptor Playground & Verdict */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Tool Call JSON Payload Editor */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-[#2D55F5]" />
                    AI Agent Outbound Tool Call Payload
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">POST /firewall/intercept</span>
                </div>

                <textarea
                  rows={10}
                  value={JSON.stringify(toolCallPayload, null, 2)}
                  onChange={(e) => {
                    try {
                      setToolCallPayload(JSON.parse(e.target.value));
                    } catch (_) {}
                  }}
                  className="w-full p-3.5 bg-slate-900 text-amber-300 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleInterceptToolCall()}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E44E0] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{loading ? 'Intercepting...' : 'Intercept & Evaluate (<25ms)'}</span>
                  </button>
                </div>
              </div>

              {/* Right: Sub-25ms Interception Verdict Card */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
                {toolVerdict ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-semibold text-slate-400">SYNCHRONOUS VERDICT</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`px-3 py-1 rounded-xl text-sm font-extrabold border ${
                              toolVerdict.verdict === 'BLOCK_CRITICAL'
                                ? 'bg-red-50 text-red-700 border-red-300'
                                : toolVerdict.verdict === 'HOLD_FOR_HITL'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : toolVerdict.verdict === 'ALLOW_REDACTED'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            }`}
                          >
                            {toolVerdict.verdict}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400">LATENCY / RISK</span>
                        <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                          {toolVerdict.latencyMs}ms · Risk: {toolVerdict.riskScore} / 10
                        </div>
                      </div>
                    </div>

                    {/* Violations Breakdown */}
                    {toolVerdict.violations && toolVerdict.violations.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 text-xs text-red-900 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-red-800">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          Security &amp; Financial Violations:
                        </span>
                        {toolVerdict.violations.map((v, i) => (
                          <div key={i} className="text-[11px] font-mono text-red-800">
                            • {v}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sanitized Arguments if permitted */}
                    {toolVerdict.sanitizedArguments && (
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Sanitized Arguments Allowed to External Tool:
                        </span>
                        <pre className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-36">
                          {JSON.stringify(toolVerdict.sanitizedArguments, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Seal: <strong className="text-slate-700">{(toolVerdict.sha256Seal || '—').substring(0, 20)}...</strong></span>
                      <span className="text-emerald-700 font-semibold">Logged to datax_firewall_events</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-300" />
                    <p>Click any preset attack above or hit "Intercept &amp; Evaluate" to view real-time firewall decisions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 3: DEVELOPER SDK & WEBHOOK INTEGRATION
           ========================================================= */}
        {activeMode === 'integration' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Connect Any AI Agent in 60 Seconds
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Wrap any LangGraph, LangChain, CrewAI, or OpenAI tool call with DataX synchronous firewall endpoint.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`import requests\n\ndef guard_tool_call(tool_name, args):\n    res = requests.post("https://dataglow.ai/datax-api/firewall/intercept", json={\n        "agent_id": "customer_support_agent",\n        "tool_name": tool_name,\n        "arguments": args\n    })\n    data = res.json()\n    if data.get("isBlocked"):\n        raise ValueError(f"DataX Firewall Blocked: {data.get('violations')}")\n    return data.get("sanitizedArguments", args)`);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied Python!' : 'Copy Python'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`# DataX AI Agent Tool-Call Firewall Interceptor
import requests

def guard_agent_action(tool_name: str, arguments: dict):
    response = requests.post(
        "https://dataglow.ai/datax-api/firewall/intercept",
        json={
            "agent_id": "production_support_copilot",
            "tool_name": tool_name,
            "arguments": arguments,
            "policies": {
                "max_financial_limit": 5000.0,
                "hitl_threshold": 500.0
            }
        },
        timeout=1.5  # <25ms typical execution latency
    )
    result = response.json()
    
    if result.get("isBlocked"):
        raise PermissionError(f"[DataX Blocked] {result.get('violations')}")
        
    if result.get("isHeld"):
        return {"status": "PAUSED_HITL", "message": "Held for human controller sign-off."}
        
    # Return sanitized arguments with PII and secrets safely redacted
    return result.get("sanitizedArguments") or arguments`}
              </pre>
            </div>

            {/* Live Events Table from Neon PostgreSQL */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#2D55F5]" />
                  Live Firewall Audit Events (Neon PostgreSQL: datax_firewall_events)
                </span>
                <span className="text-xs font-mono text-slate-500">{recentEvents.length} events logged</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/60 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Event ID</th>
                      <th className="py-2.5 px-4 font-bold">Agent / Source</th>
                      <th className="py-2.5 px-4 font-bold">Tool</th>
                      <th className="py-2.5 px-4 font-bold">Verdict</th>
                      <th className="py-2.5 px-4 font-bold">Latency</th>
                      <th className="py-2.5 px-4 font-bold">Violations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {recentEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                          Zero events recorded yet. Run an attack test to log audit entries.
                        </td>
                      </tr>
                    ) : (
                      recentEvents.map((evt) => (
                        <tr key={evt.event_id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{evt.event_id}</td>
                          <td className="py-2.5 px-4 text-slate-700">{evt.agent_or_source}</td>
                          <td className="py-2.5 px-4 text-slate-700 font-semibold">{evt.target_tool}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                evt.verdict === 'BLOCK_CRITICAL'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : evt.verdict === 'HOLD_FOR_HITL'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {evt.verdict}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{evt.latency_ms}ms</td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-600 font-sans truncate max-w-xs" title={evt.violations}>
                            {evt.violations}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DataXAppShell>
  );
}
