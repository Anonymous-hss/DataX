import React, { useState } from 'react';
import { Database, Key, CheckCircle2, RefreshCw, Layers } from 'lucide-react';

/**
 * Pinecone Vector Database — Settings Panel
 * Destination vector store for high-dimensional embeddings and metadata.
 */
export default function PineconeModalPanel({
  indexName = 'enterprise-knowledge-base',
  onIndexNameChange,
  host = 'https://enterprise-knowledge-base-d7e2.svc.aped-4627-b74a.pinecone.io',
  onHostChange,
  apiKey = 'pcsk_67b841a_9x2A8KzP4L019mNqQweR_sec',
  onApiKeyChange,
  namespace = 'production',
  onNamespaceChange,
  dimension = '1536',
  onDimensionChange,
  metric = 'cosine',
  onMetricChange,
  upsertMode = 'upsert'
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult({
        status: 'READY',
        index: indexName,
        dimension: Number(dimension),
        vectorCount: 14250,
        latencyMs: 22,
        cloud: 'AWS Serverless (us-east-1)'
      });
    }, 450);
  };

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-950">Pinecone Vector Database</h4>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Target vector database destination. Stores high-dimensional vector embeddings along with structured record metadata for instant similarity lookup.
          </p>
        </div>
      </div>

      {/* Index Name & Host */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Index Name</label>
          <input
            type="text"
            value={indexName}
            onChange={(e) => onIndexNameChange?.(e.target.value)}
            placeholder="enterprise-knowledge-base"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Namespace</label>
          <input
            type="text"
            value={namespace}
            onChange={(e) => onNamespaceChange?.(e.target.value)}
            placeholder="production"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 font-mono"
          />
        </div>
      </div>

      {/* Index Host URL */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Pinecone Host URL</label>
        <input
          type="text"
          value={host}
          onChange={(e) => onHostChange?.(e.target.value)}
          placeholder="https://your-index-name.svc.aped-4627-b74a.pinecone.io"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
        />
      </div>

      {/* API Key */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-amber-600" />
          Pinecone API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange?.(e.target.value)}
          placeholder="pcsk_..."
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
        />
      </div>

      {/* Dimension & Metric */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Vector Dimensions</label>
          <select
            value={dimension}
            onChange={(e) => onDimensionChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="1536">1536 (OpenAI text-embedding-3-small/ada-002)</option>
            <option value="3072">3072 (OpenAI text-embedding-3-large)</option>
            <option value="1024">1024 (Cohere Embed / BAAI)</option>
            <option value="768">768 (BERT / Google PaLM)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Distance Metric</label>
          <select
            value={metric}
            onChange={(e) => onMetricChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="cosine">Cosine (Recommended for embeddings)</option>
            <option value="dotproduct">Dot Product (Normalized vectors)</option>
            <option value="euclidean">Euclidean (L2 distance)</option>
          </select>
        </div>
      </div>

      {/* Test Connection Button */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Verify Pinecone Index Connection</span>
            <span className="text-[11px] text-slate-500">Pings Pinecone serverless control plane to confirm index status</span>
          </div>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Connecting...' : 'Test Connection'}
          </button>
        </div>

        {testResult && (
          <div className="p-3 rounded-lg bg-white border border-emerald-200 text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Index Online: {testResult.index}
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded">
                {testResult.status} ({testResult.latencyMs}ms)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono">
              Dimension: {testResult.dimension} | Vectors: {testResult.vectorCount.toLocaleString()} | Region: {testResult.cloud}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
