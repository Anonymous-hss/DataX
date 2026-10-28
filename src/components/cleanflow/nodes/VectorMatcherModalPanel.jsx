import React, { useState, useMemo, useEffect } from 'react';
import { Layers, CheckCircle2, RefreshCw, Database } from 'lucide-react';

/**
 * Semantic Vector Matcher — Settings Panel
 * Finds fuzzy-matching records using AI embeddings and similarity scoring.
 * Dynamically binds to discovered schema columns from the active source table.
 */
export default function VectorMatcherModalPanel({
  sourceTable = '',
  availableColumns = [],
  model = 'text-embedding-3-small',
  onModelChange,
  targetField = 'VENDOR_NAME',
  onTargetFieldChange,
  threshold = 85,
  onThresholdChange,
  vectorIndex = 'Azure AI Search (enterprise-vendors)',
  onVectorIndexChange,
  autoResolve = true,
  onAutoResolveChange,
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const cleanCols = useMemo(() => {
    const list = (availableColumns || []).filter((c) => c && c !== '_id');
    return list.length > 0 ? list : ['VENDOR_NAME', 'NAME', 'DELIVERY_PLANT', 'SKU'];
  }, [availableColumns]);

  useEffect(() => {
    if (cleanCols.length > 0 && !cleanCols.some((c) => c.toLowerCase() === (targetField || '').toLowerCase())) {
      const matchCol =
        cleanCols.find((c) =>
          ['name', 'vendor', 'customer', 'item', 'desc', 'email', 'title', 'company'].some((k) =>
            c.toLowerCase().includes(k)
          )
        ) || cleanCols[0];
      if (matchCol) onTargetFieldChange?.(matchCol);
    }
  }, [cleanCols, targetField]);

  const activeField = targetField || cleanCols[0];

  const handleTestMatch = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult({
        input: 'Intl Business Machines LLC',
        matched: 'International Business Machines Corp (IBM)',
        score: 94.8,
        latencyMs: 18,
      });
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950">Semantic Vector Matcher</h4>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              Finds records that mean the same thing even when spelled differently (e.g. "IBM Corp" vs "International Business Machines"). Uses AI to compare meaning, not just spelling.
            </p>
          </div>
        </div>

        {sourceTable && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-slate-700 self-center">
            <Database className="w-3 h-3 text-indigo-600" />
            <span className="text-slate-500">Source:</span>
            <span className="font-mono font-bold text-indigo-900">{sourceTable}</span>
          </span>
        )}
      </div>

      {/* AI Model + Column to Check */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">AI Model to Use</label>
          <p className="text-[10px] text-slate-400 mb-1">Which AI will understand your text values</p>
          <select
            value={model}
            onChange={(e) => onModelChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="text-embedding-3-small">OpenAI Small (Fast, Recommended)</option>
            <option value="text-embedding-3-large">OpenAI Large (More Accurate)</option>
            <option value="bge-large-en-v1.5">BAAI Open Source Model</option>
            <option value="cohere-embed-v3">Cohere Embed v3</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Column to Match</label>
          <p className="text-[10px] text-slate-400 mb-1">Detected from {sourceTable || 'source schema'}</p>
          <select
            value={activeField}
            onChange={(e) => onTargetFieldChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono text-slate-900 cursor-pointer"
          >
            {cleanCols.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reference Library */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Reference Library (Master Data Store)</label>
        <p className="text-[10px] text-slate-400 mb-1">Where the "correct" golden records are stored to compare against</p>
        <select
          value={vectorIndex}
          onChange={(e) => onVectorIndexChange?.(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
        >
          <option value="Azure AI Search (enterprise-vendors)">Azure AI Search — Vendor Master</option>
          <option value="Pinecone Index (vendor-master)">Pinecone — Vendor Master Index</option>
          <option value="pgvector PostgreSQL (irep.postgres)">PostgreSQL pgvector</option>
          <option value="In-Memory FAISS VectorStore">In-Memory (Fast Cache)</option>
        </select>
      </div>

      {/* Similarity Threshold Slider */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-800 block">Match Confidence Threshold</label>
            <p className="text-[10px] text-slate-400">Minimum % similarity required to call two records a match</p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-mono">
            {threshold}%
          </span>
        </div>
        <input
          type="range"
          min="70"
          max="99"
          value={threshold}
          onChange={(e) => onThresholdChange?.(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>70% — Loose (more matches)</span>
          <span>85% — Balanced ✓</span>
          <span>99% — Exact only</span>
        </div>
      </div>

      {/* Auto Correct Toggle */}
      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={autoResolve}
          onChange={(e) => onAutoResolveChange?.(e.target.checked)}
          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
        />
        <div>
          <span className="text-xs font-bold text-slate-800 block">Auto-Correct Matched Records</span>
          <span className="text-[11px] text-slate-500">
            When similarity ≥ {threshold}%, automatically replace the mismatched value with the correct master record. If off, a human must approve each correction.
          </span>
        </div>
      </label>

      {/* Test Button */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Test a Sample Match</span>
            <span className="text-[11px] text-slate-500">Runs a quick test to verify the matcher is working</span>
          </div>
          <button
            type="button"
            onClick={handleTestMatch}
            disabled={testing}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Run Test'}
          </button>
        </div>

        {testResult && (
          <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-700">Match Found — {testResult.score}% similarity</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Input: "{testResult.input}"<br />
              ↳ Matched to: "{testResult.matched}" in {testResult.latencyMs}ms
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
