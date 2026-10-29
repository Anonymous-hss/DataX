import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import {
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Download,
  BarChart3,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import api from '../services/apiClient';

export default function MlCertificationPage() {
  const { navigateTo } = useNavigation();
  const [modality, setModality] = useState('tabular'); // 'tabular' | 'sft' | 'history'
  const [loading, setLoading] = useState(false);

  // Tabular ML Gate states
  const [tabularSamples, setTabularSamples] = useState(null);
  const [targetColumn, setTargetColumn] = useState('is_default');
  const [tabularCert, setTabularCert] = useState(null);

  // LLM SFT Gate states
  const [sftSamples, setSftSamples] = useState(null);
  const [sftCert, setSftCert] = useState(null);

  // Historical Certifications
  const [certHistory, setCertHistory] = useState([]);

  // Fetch sample datasets & historical certificates on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [dsRes, certsRes] = await Promise.all([
          api.get('/ml-gate/sample-datasets').catch(() => null),
          api.get('/ml-gate/certificates').catch(() => null)
        ]);
        if (dsRes) {
          if (dsRes.tabular) setTabularSamples(dsRes.tabular);
          if (dsRes.sft) setSftSamples(dsRes.sft);
        }
        if (certsRes && certsRes.certificates) {
          setCertHistory(certsRes.certificates);
        }
      } catch (err) {
        console.warn('ML gate initial load note:', err);
      }
    }
    loadData();
  }, []);

  // Run Tabular Certification
  const handleCertifyTabular = async () => {
    if (!tabularSamples || !tabularSamples.candidate) return;
    setLoading(true);
    try {
      const res = await api.post('/ml-gate/certify', {
        modality: 'TABULAR',
        candidateRecords: tabularSamples.candidate,
        baselineRecords: tabularSamples.baseline,
        targetColumn: targetColumn,
        datasetName: 'credit_risk_applicant_features_v3'
      });
      if (res) {
        setTabularCert(res);
        // Refresh history
        const hRes = await api.get('/ml-gate/certificates').catch(() => null);
        if (hRes && hRes.certificates) setCertHistory(hRes.certificates);
      }
    } catch (err) {
      console.error('Tabular certification failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run SFT Certification
  const handleCertifySft = async () => {
    if (!sftSamples || sftSamples.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/ml-gate/certify', {
        modality: 'LLM_SFT',
        jsonlRecords: sftSamples,
        datasetName: 'customer_support_llama3_sft_corpus'
      });
      if (res) {
        setSftCert(res);
        // Refresh history
        const hRes = await api.get('/ml-gate/certificates').catch(() => null);
        if (hRes && hRes.certificates) setCertHistory(hRes.certificates);
      }
    } catch (err) {
      console.error('SFT certification failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataXAppShell>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-mono font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Pillar 3 · ML &amp; Model Governance Gate
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              ML Training &amp; LLM Fine-Tuning Dataset Certification Gate
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Audit feature covariate drift (PSI), detect target leakage, and filter broken or poisoned instruction pairs before triggering GPU training runs in SageMaker, Vertex AI, or OpenAI.
            </p>

            {/* Modality Selector */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setModality('tabular')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  modality === 'tabular'
                    ? 'bg-[#2D55F5] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Tabular ML Dataset Gate (PSI &amp; Leakage)</span>
              </button>
              <button
                onClick={() => setModality('sft')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  modality === 'sft'
                    ? 'bg-[#2D55F5] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <FileCode2 className="w-4 h-4" />
                <span>LLM Fine-Tuning SFT JSONL Gate</span>
              </button>
              <button
                onClick={() => setModality('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  modality === 'history'
                    ? 'bg-[#2D55F5] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Model Governance Certificates</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MODALITY 1: TABULAR ML DATASET GATE (PSI DRIFT & LEAKAGE)
           ========================================================= */}
        {modality === 'tabular' && (
          <div className="space-y-5">
            {/* Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-800">Target Column:</span>
                <input
                  type="text"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 w-32 focus:outline-none focus:border-[#2D55F5]"
                />
                <span className="text-xs text-slate-500 hidden sm:inline">
                  (Pre-loaded Credit Default dataset with 150 baseline + 150 candidate rows)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCertifyTabular}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E44E0] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Computing Quantile PSI & Leakage...' : 'Run ML Dataset Certification'}</span>
                </button>
              </div>
            </div>

            {tabularCert ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Release Card Header */}
                <div
                  className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                    tabularCert.verdict === 'TRAINING_BLOCKED'
                      ? 'bg-red-50/60 border-red-200 text-red-900'
                      : tabularCert.verdict === 'CONDITIONAL_WARN'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-lg ${
                        tabularCert.verdict === 'TRAINING_BLOCKED' ? 'bg-red-600' : 'bg-emerald-600'
                      }`}
                    >
                      {tabularCert.anchoredScore}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold uppercase tracking-tight">
                          {tabularCert.verdict === 'TRAINING_BLOCKED' ? 'TRAINING BLOCKED BY DATAX GOVERNANCE GATE' : 'RELEASE APPROVED'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-current">
                          EU AI Act Art. 10
                        </span>
                      </div>
                      <p className="text-xs opacity-80 mt-0.5 font-mono">
                        Dataset: {tabularCert.datasetName} · Evaluated: {tabularCert.totalRows} rows · Clean: {tabularCert.cleanRows} rows · Duplicates: {tabularCert.duplicateRows}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div>Max PSI: <strong className="text-red-700">{tabularCert.maxPsi}</strong></div>
                    <div>SHA-256: <strong>{tabularCert.sha256DatasetHash.substring(0, 16)}...</strong></div>
                  </div>
                </div>

                {/* Target Leakage Alert Banner */}
                {tabularCert.leakageAlerts && tabularCert.leakageAlerts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>CRITICAL TARGET LEAKAGE DETECTED (Model Overfit Prevention):</span>
                    </div>
                    {tabularCert.leakageAlerts.map((la, i) => (
                      <div key={i} className="text-xs text-amber-800 pl-6 leading-relaxed">
                        • <strong>{la.feature}</strong> has <strong>{(la.correlation * 100).toFixed(1)}% correlation</strong> with target <strong>{tabularCert.targetColumn}</strong>.
                        <p className="text-[11px] text-amber-700 mt-0.5">{la.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* PSI Covariate Drift Bar Chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Population Stability Index (PSI) Covariate Drift Audit
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Compares feature quantiles between baseline and candidate training sets. (Green &lt; 0.10, Amber 0.10–0.25, Red &gt; 0.25 Critical Shift).
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">10-Quantile Buckets</span>
                  </div>

                  <div className="space-y-3">
                    {tabularCert.featureDrift.map((fd) => {
                      const psi = fd.psi;
                      const isRed = psi >= 0.25;
                      const isAmber = psi >= 0.10 && psi < 0.25;
                      const widthPct = Math.min(100, Math.max(5, (psi / 1.0) * 100));

                      return (
                        <div key={fd.feature} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-slate-800">{fd.feature}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isRed
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : isAmber
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                PSI: {fd.psi} ({fd.severity})
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isRed ? 'bg-red-500' : isAmber ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs space-y-2">
                <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Click "Run ML Dataset Certification" above to analyze covariate drift, label leakage, and generate release cards.</p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            MODALITY 2: LLM FINE-TUNING SFT JSONL GATE
           ========================================================= */}
        {modality === 'sft' && (
          <div className="space-y-5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800">Instruction Corpus:</span>
                <span className="ml-2 text-xs font-mono text-slate-500">
                  {sftSamples ? `${sftSamples.length} Prompt-Completion Pairs Staged` : 'Loading...'}
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline ml-1">
                  (Contains leaked credentials in completions, refusal bloat, and empty turns)
                </span>
              </div>

              <button
                type="button"
                onClick={handleCertifySft}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E44E0] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Auditing Instruction Hygiene...' : 'Certify SFT JSONL Corpus'}</span>
              </button>
            </div>

            {sftCert ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* SFT Gate Banner */}
                <div
                  className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                    sftCert.verdict === 'TRAINING_BLOCKED'
                      ? 'bg-red-50/60 border-red-200 text-red-900'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-lg ${
                        sftCert.verdict === 'TRAINING_BLOCKED' ? 'bg-red-600' : 'bg-emerald-600'
                      }`}
                    >
                      {sftCert.anchoredScore}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold uppercase tracking-tight">
                          {sftCert.verdict === 'TRAINING_BLOCKED' ? 'FINE-TUNING RUN BLOCKED BY SECURITY GATE' : 'FINE-TUNING APPROVED'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-current">
                          NIST AI RMF 1.0
                        </span>
                      </div>
                      <p className="text-xs opacity-80 mt-0.5 font-mono">
                        Total Pairs: {sftCert.totalPairs} · Certified Clean: {sftCert.cleanPairs} · Refusal Rate: {sftCert.refusalOverSaturationPct}%
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div>Secret Leaks in Weights: <strong className="text-red-700">{sftCert.secretLeaksFound}</strong></div>
                    <div>SHA-256: <strong>{sftCert.sha256DatasetHash.substring(0, 16)}...</strong></div>
                  </div>
                </div>

                {/* SFT Violations Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20">
                    <span className="text-[11px] font-bold text-red-700 uppercase">Secret / PII Memorization Risk</span>
                    <div className="text-2xl font-extrabold text-red-700 font-mono mt-1">
                      {sftCert.secretLeaksFound + sftCert.piiLeaksFound} instances
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Completions contain hardcoded OpenAI keys or SSNs that will be baked into model weights!
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
                    <span className="text-[11px] font-bold text-amber-800 uppercase">Refusal Over-Saturation</span>
                    <div className="text-2xl font-extrabold text-amber-800 font-mono mt-1">
                      {sftCert.refusalOverSaturationPct}%
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      "As an AI language model..." boilerplate over-saturates the dataset and degrades domain capability.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20">
                    <span className="text-[11px] font-bold text-blue-700 uppercase">Duplicate Instructions</span>
                    <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
                      {sftCert.duplicatePrompts} pairs
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Duplicate prompts cause memorization spikes during SFT. Deduplicated for export.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs space-y-2">
                <FileCode2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Click "Certify SFT JSONL Corpus" to audit secret leakage in training completions and refusal bloat.</p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            MODALITY 3: HISTORICAL CERTIFICATES (NEON POSTGRESQL)
           ========================================================= */}
        {modality === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2D55F5]" />
                Certified Dataset Release Dossiers (Neon PostgreSQL: datax_ml_certifications)
              </span>
              <span className="text-xs font-mono text-slate-500">{certHistory.length} releases logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-4 font-bold">Cert ID</th>
                    <th className="py-2.5 px-4 font-bold">Dataset Name</th>
                    <th className="py-2.5 px-4 font-bold">Modality</th>
                    <th className="py-2.5 px-4 font-bold">Verdict</th>
                    <th className="py-2.5 px-4 font-bold">Trust Score</th>
                    <th className="py-2.5 px-4 font-bold">Max PSI</th>
                    <th className="py-2.5 px-4 font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {certHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        Zero releases logged yet. Run a certification above to create audit entries.
                      </td>
                    </tr>
                  ) : (
                    certHistory.map((c) => (
                      <tr key={c.cert_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{c.cert_id}</td>
                        <td className="py-2.5 px-4 text-slate-700 font-semibold">{c.dataset_name}</td>
                        <td className="py-2.5 px-4 text-slate-600">{c.modality}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              c.verdict === 'RELEASE_APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {c.verdict}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold">{c.anchored_score} / 10</td>
                        <td className="py-2.5 px-4 text-slate-600">{c.psi_max || 'N/A'}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-sans text-[11px]">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Today'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DataXAppShell>
  );
}
