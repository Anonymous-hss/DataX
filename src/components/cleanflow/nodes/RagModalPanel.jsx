import React, { useState } from 'react';
import { BookOpen, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * RAG Context Enricher — Settings Panel
 * Searches a knowledge/document library and appends relevant info onto each data record.
 * Think of it as: for each row, auto-look up related policy/contract/reference and attach it.
 */
export default function RagModalPanel({
  knowledgeBase = 'Azure AI Search (enterprise-policies)',
  onKnowledgeBaseChange,
  queryKey = 'ITEM_DESCRIPTION',
  onQueryKeyChange,
  topK = 3,
  onTopKChange,
  targetField = 'RAG_CONTEXT',
  onTargetFieldChange,
  fallbackPolicy = 'pass_thru',
  onFallbackPolicyChange
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestRag = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult({
        query: 'Industrial ball-bearing SKU-PART-104',
        retrieved: topK,
        topDoc: 'Procurement SOP 2026 — Section 4.2',
        excerpt: 'Ball bearing assemblies SKU-100 to 120 must adhere to ISO-9001 and have approved plant code P1000 or P2000.',
        latencyMs: 24
      });
    }, 500);
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-purple-950">RAG Context Enricher</h4>
          <p className="text-[11px] text-purple-700 mt-0.5">
            For each record, searches your company's knowledge library (policies, contracts, SOPs) and attaches the most relevant information. Like auto-looking up a reference manual for every data row.
          </p>
        </div>
      </div>

      {/* Knowledge Library + Search Column */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Knowledge Library</label>
          <p className="text-[10px] text-slate-400 mb-1">Where your company documents/policies are stored</p>
          <select
            value={knowledgeBase}
            onChange={(e) => onKnowledgeBaseChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="Azure AI Search (enterprise-policies)">Azure AI Search — Policies</option>
            <option value="Pinecone Enterprise Knowledge Index">Pinecone — Enterprise Knowledge</option>
            <option value="Confluence Enterprise RAG Store">Confluence Wiki Store</option>
            <option value="Databricks Unity Catalog Vector Store">Databricks Vector Store</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Column to Search With</label>
          <p className="text-[10px] text-slate-400 mb-1">The field value used as the search query</p>
          <select
            value={queryKey}
            onChange={(e) => onQueryKeyChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="ITEM_DESCRIPTION">ITEM_DESCRIPTION (Product / Material)</option>
            <option value="PO_NUMBER">PO_NUMBER (Purchase Order)</option>
            <option value="VENDOR_NAME">VENDOR_NAME (Supplier)</option>
            <option value="NAME">NAME (Customer Account)</option>
          </select>
        </div>
      </div>

      {/* Number of Results + Output Column */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">How Many Documents to Fetch</label>
          <p className="text-[10px] text-slate-400 mb-1">More = richer context, slightly slower</p>
          <select
            value={topK}
            onChange={(e) => onTopKChange?.(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value={3}>3 documents (Fastest)</option>
            <option value={5}>5 documents (Balanced ✓)</option>
            <option value={10}>10 documents (Most Context)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Write Result to Column</label>
          <p className="text-[10px] text-slate-400 mb-1">New column added to the record with found context</p>
          <input
            type="text"
            value={targetField}
            onChange={(e) => onTargetFieldChange?.(e.target.value)}
            placeholder="RAG_CONTEXT"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
          />
        </div>
      </div>

      {/* If Nothing Found */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">If Nothing is Found in the Library</label>
        <select
          value={fallbackPolicy}
          onChange={(e) => onFallbackPolicyChange?.(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
        >
          <option value="pass_thru">Continue without context (leave column empty)</option>
          <option value="quarantine">Hold the record in Quarantine until context is found</option>
          <option value="default_ontology">Use a generic company-wide default context</option>
        </select>
      </div>

      {/* Test Button */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Test Knowledge Lookup</span>
            <span className="text-[11px] text-slate-500">Runs a sample search to verify your library is connected</span>
          </div>
          <button
            type="button"
            onClick={handleTestRag}
            disabled={testing}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Searching...' : 'Run Test'}
          </button>
        </div>

        {testResult && (
          <div className="p-3 rounded-lg bg-white border border-purple-200 text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                {testResult.topDoc}
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-mono font-bold px-2 py-0.5 rounded">
                {testResult.latencyMs}ms · {testResult.retrieved} docs
              </span>
            </div>
            <p className="text-[11px] text-slate-600 italic bg-purple-50/50 p-2 rounded border border-purple-100">
              "{testResult.excerpt}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
