import React, { useState, useEffect, useMemo } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import StudioDatabaseExtractor from '../components/common/StudioDatabaseExtractor';
import StudioDatabaseCommitPanel from '../components/common/StudioDatabaseCommitPanel';
import {
  Award,
  Upload,
  Database,
  FileSpreadsheet,
  FileJson,
  Sliders,
  Play,
  Wrench,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Sparkles,
  FileCheck2,
  Trash2,
  Eye,
} from 'lucide-react';
import api from '../services/apiClient';
import {
  parseUploadedDatasetFile,
  parseJsonOrJsonlText,
  exportRecordsToFile,
  downloadTextFile,
} from '../utils/datasetIo';

export default function MlCertificationPage({ onSwitchToMarketing } = {}) {
  const [activeTab, setActiveTab] = useState('tabular'); // 'tabular' | 'sft' | 'ledger'

  // =========================================================================
  // TAB 1: TABULAR ML CERTIFICATION & REMEDIATION PIPELINE
  // =========================================================================
  const [tabIngestChannel, setTabIngestChannel] = useState('upload'); // 'upload' | 'db'
  const [datasetName, setDatasetName] = useState('');
  const [candidateRecords, setCandidateRecords] = useState([]);
  const [candidateColumns, setCandidateColumns] = useState([]);
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  // Baseline Reference Dataset Configuration
  const [baselineMode, setBaselineMode] = useState('split'); // 'split' | 'upload' | 'db'
  const [baselineSplitRatio, setBaselineSplitRatio] = useState(0.3);
  const [baselineRecords, setBaselineRecords] = useState(null);
  const [baselineLabel, setBaselineLabel] = useState('');

  // Gate Schema & Threshold Controls
  const [targetColumn, setTargetColumn] = useState('');
  const [protectedColumn, setProtectedColumn] = useState('');
  const [excludedColumns, setExcludedColumns] = useState([]);
  const [psiThreshold, setPsiThreshold] = useState(0.25);
  const [leakageThreshold, setLeakageThreshold] = useState(0.75);

  // Remediation Controls
  const [remediateOpts, setRemediateOpts] = useState({
    dropColumns: [],
    deduplicate: true,
    dropNullTargetRows: true,
    imputeNumeric: 'median', // 'none' | 'median' | 'mean'
    imputeCategorical: 'mode', // 'none' | 'mode' | 'unknown'
    clipOutliers: false,
  });

  const [tabRunning, setTabRunning] = useState(false);
  const [tabError, setTabError] = useState('');
  const [tabCert, setTabCert] = useState(null);
  const [expandedDriftFeature, setExpandedDriftFeature] = useState(null);

  // =========================================================================
  // TAB 2: LLM SFT / DPO FINE-TUNING CORPUS HYGIENE & EXPORT PIPELINE
  // =========================================================================
  const [sftIngestChannel, setSftIngestChannel] = useState('upload'); // 'upload' | 'db' | 'paste'
  const [sftDatasetName, setSftDatasetName] = useState('');
  const [sftRawRecords, setSftRawRecords] = useState([]);
  const [sftColumns, setSftColumns] = useState([]);
  const [sftPasteText, setSftPasteText] = useState('');

  const [sftPromptCol, setSftPromptCol] = useState('');
  const [sftCompletionCol, setSftCompletionCol] = useState('');
  const [sftSystemPrompt, setSftSystemPrompt] = useState('');

  const [sftRemediateOpts, setSftRemediateOpts] = useState({
    redactSecretsAndPii: true,
    redactEmailsAndPhones: false,
    removeRefusals: true,
    deduplicatePrompts: true,
    removeEmptyCompletions: true,
    minCompletionChars: 8,
  });

  const [sftRunning, setSftRunning] = useState(false);
  const [sftError, setSftError] = useState('');
  const [sftCert, setSftCert] = useState(null);
  const [excludedPairIndices, setExcludedPairIndices] = useState(new Set());

  // =========================================================================
  // TAB 3: GOVERNANCE CERTIFICATE LEDGER
  // =========================================================================
  const [certificates, setCertificates] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);

  useEffect(() => {
    loadCertificateLedger();
  }, []);

  const loadCertificateLedger = async () => {
    setCertsLoading(true);
    try {
      const res = await api.get('/ml-gate/certificates?limit=50');
      setCertificates(res?.certificates || []);
    } catch {
      setCertificates([]);
    } finally {
      setCertsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Tabular ML Ingestion & Configuration Helpers
  // -------------------------------------------------------------------------
  const initializeTabularSchema = (records, columns, name) => {
    setCandidateRecords(records);
    setCandidateColumns(columns);
    setDatasetName(name.replace(/\.(csv|tsv|xlsx|xls|json|jsonl)$/i, ''));
    setTabCert(null);
    setTabError('');

    // Auto-select obvious target & ID columns if present in the user's schema
    const guessedTarget =
      columns.find((c) =>
        ['is_default', 'is_fraud', 'churned', 'churn', 'target', 'label', 'default', 'outcome', 'y'].includes(
          c.toLowerCase()
        )
      ) || '';
    setTargetColumn(guessedTarget);
    setProtectedColumn('');

    const guessedIds = columns.filter(
      (c) =>
        ['id', '_id', 'uuid', 'row_id', 'record_id'].includes(c.toLowerCase()) ||
        (c.toLowerCase().endsWith('_id') && c !== guessedTarget)
    );
    setExcludedColumns(guessedIds);
    setRemediateOpts((prev) => ({ ...prev, dropColumns: [] }));
  };

  const handleCandidateFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTabError('');
    try {
      const parsed = await parseUploadedDatasetFile(file);
      if (!parsed.records.length) {
        throw new Error(`"${file.name}" contains 0 data rows.`);
      }
      initializeTabularSchema(parsed.records, parsed.columns, parsed.fileName);
    } catch (err) {
      setTabError(err.message || 'Failed to parse candidate dataset file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleBaselineFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTabError('');
    try {
      const parsed = await parseUploadedDatasetFile(file);
      if (!parsed.records.length) {
        throw new Error(`Baseline file "${file.name}" contains 0 rows.`);
      }
      setBaselineRecords(parsed.records);
      setBaselineLabel(`${parsed.fileName} (${parsed.records.length.toLocaleString()} rows)`);
    } catch (err) {
      setTabError(err.message || 'Failed to parse baseline dataset file.');
    } finally {
      e.target.value = '';
    }
  };

  const toggleExcludedCol = (col) => {
    setExcludedColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  const toggleDropColumn = (col) => {
    setRemediateOpts((prev) => ({
      ...prev,
      dropColumns: prev.dropColumns.includes(col)
        ? prev.dropColumns.filter((c) => c !== col)
        : [...prev.dropColumns, col],
    }));
  };

  const runTabularCertification = async (applyRemediation = false) => {
    if (candidateRecords.length === 0) {
      setTabError('Upload a dataset file or extract a live database table first.');
      return;
    }
    setTabError('');
    setTabRunning(true);
    try {
      const res = await api.post('/ml-gate/certify', {
        modality: 'TABULAR',
        datasetName: datasetName.trim() || 'tabular_training_dataset',
        candidateRecords,
        baselineRecords: baselineMode === 'split' ? null : baselineRecords,
        baselineSplitRatio: Number(baselineSplitRatio) || 0.3,
        targetColumn: targetColumn || null,
        protectedColumn: protectedColumn || null,
        excludedColumns,
        psiThreshold: Number(psiThreshold) || 0.25,
        leakageThreshold: Number(leakageThreshold) || 0.75,
        remediateOptions: applyRemediation ? remediateOpts : null,
        includeRecords: true,
      });

      setTabCert(res);

      // Pre-suggest leaked features for 1-click remediation if not yet dropped
      if (!applyRemediation && res.leakageAlerts?.length > 0) {
        const leakedNames = res.leakageAlerts.map((a) => a.feature);
        setRemediateOpts((prev) => ({
          ...prev,
          dropColumns: Array.from(new Set([...prev.dropColumns, ...leakedNames])),
        }));
      }
      loadCertificateLedger();
    } catch (err) {
      setTabError(err.message || 'Tabular dataset certification failed.');
    } finally {
      setTabRunning(false);
    }
  };

  const activeTabularOutputRecords = useMemo(() => {
    if (tabCert?.remediatedRecords?.length) return tabCert.remediatedRecords;
    return candidateRecords;
  }, [tabCert, candidateRecords]);

  // -------------------------------------------------------------------------
  // SFT / DPO Corpus Ingestion & Hygiene Helpers
  // -------------------------------------------------------------------------
  const initializeSftCorpus = (records, columns, name) => {
    setSftRawRecords(records);
    setSftColumns(columns);
    setSftDatasetName(name.replace(/\.(jsonl|ndjson|json|csv|tsv|xlsx|xls)$/i, ''));
    setSftCert(null);
    setSftError('');

    const hasMessages = records.some((r) => Array.isArray(r?.messages));
    if (hasMessages) {
      setSftPromptCol('');
      setSftCompletionCol('');
    } else {
      const pGuess =
        columns.find((c) => ['prompt', 'instruction', 'question', 'input', 'user', 'query'].includes(c.toLowerCase())) ||
        columns[0] ||
        '';
      const cGuess =
        columns.find((c) =>
          ['completion', 'output', 'response', 'answer', 'assistant', 'chosen'].includes(c.toLowerCase())
        ) ||
        columns[1] ||
        '';
      setSftPromptCol(pGuess);
      setSftCompletionCol(cGuess);
    }
  };

  const handleSftFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSftError('');
    try {
      const parsed = await parseUploadedDatasetFile(file);
      if (!parsed.records.length) {
        throw new Error(`"${file.name}" contained 0 fine-tuning records.`);
      }
      initializeSftCorpus(parsed.records, parsed.columns, parsed.fileName);
    } catch (err) {
      setSftError(err.message || 'Failed to parse SFT corpus file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSftPasteLoad = () => {
    setSftError('');
    try {
      const parsed = parseJsonOrJsonlText(sftPasteText);
      if (!parsed.records.length) {
        throw new Error('No JSON/JSONL objects found in pasted text.');
      }
      initializeSftCorpus(parsed.records, parsed.columns, sftDatasetName || 'custom_sft_corpus');
    } catch (err) {
      setSftError(err.message || 'Failed to parse pasted JSONL.');
    }
  };

  const handleRunSftCertification = async (applyAutoClean = true) => {
    if (sftRawRecords.length === 0) {
      setSftError('Upload a JSONL/CSV/Excel corpus, pull from a database, or paste JSONL lines first.');
      return;
    }
    setSftError('');
    setSftRunning(true);
    try {
      const res = await api.post('/ml-gate/certify', {
        modality: 'LLM_SFT_JSONL',
        datasetName: sftDatasetName.trim() || 'llm_sft_corpus',
        jsonlRecords: sftRawRecords,
        promptColumn: sftPromptCol || null,
        completionColumn: sftCompletionCol || null,
        systemPrompt: sftSystemPrompt.trim() || null,
        remediateOptions: applyAutoClean ? sftRemediateOpts : null,
        includeRecords: true,
      });
      setSftCert(res);
      setExcludedPairIndices(new Set());
      loadCertificateLedger();
    } catch (err) {
      setSftError(err.message || 'SFT corpus certification failed.');
    } finally {
      setSftRunning(false);
    }
  };

  const retainedSftPairs = useMemo(() => {
    if (!sftCert?.sanitizedRecords) return [];
    return sftCert.sanitizedRecords.filter((r) => !excludedPairIndices.has(r.pairIndex));
  }, [sftCert, excludedPairIndices]);

  const openAiChatExportRecords = useMemo(() => {
    return retainedSftPairs.map((r) => ({ messages: r.messages }));
  }, [retainedSftPairs]);

  const flatSftExportRecords = useMemo(() => {
    return retainedSftPairs.map((r) => ({
      pair_index: r.pairIndex,
      prompt: r.prompt,
      completion: r.completion,
      est_tokens: r.estTokens,
    }));
  }, [retainedSftPairs]);

  const verdictBadgeClass = (verdict) => {
    if (verdict === 'RELEASE_APPROVED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (verdict === 'CONDITIONAL_WARN') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1360px] mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2D55F5] border border-blue-200">
                <Award className="w-3.5 h-3.5" />
                ML &amp; LLM Dataset Certification Gate
              </span>
              <span className="text-xs text-slate-500 font-medium">
                EU AI Act Art. 10 &amp; SR 11-7 Pre-Training Readiness Workbench
              </span>
            </div>
            <h1 className="text-[28px] font-bold text-[#0A0F1F] tracking-tight mt-1.5">
              ML Training &amp; Fine-Tuning Certification Studio
            </h1>
            <p className="text-sm text-[#5F6678] mt-1 max-w-3xl">
              Ingest your real training tables or fine-tuning corpora, audit covariate drift (PSI), target leakage,
              subgroup parity, and secret memorization — then remediate issues and export or commit certified datasets.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs shrink-0 self-start">
            <button
              type="button"
              onClick={() => setActiveTab('tabular')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tabular' ? 'bg-[#2D55F5] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>1. Tabular ML Gate</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sft')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'sft' ? 'bg-[#2D55F5] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>2. LLM Fine-Tuning (SFT) Gate</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ledger' ? 'bg-[#2D55F5] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>3. Certificate Ledger ({certificates.length})</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: TABULAR ML CERTIFICATION & REMEDIATION WORKBENCH             */}
        {/* =================================================================== */}
        {activeTab === 'tabular' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* STEP 1: CANDIDATE & BASELINE INGESTION */}
              <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                      Step 1 • Ingest Training Data
                    </span>
                    <h2 className="text-base font-bold text-slate-900">Connect Candidate &amp; Baseline Datasets</h2>
                  </div>

                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setTabIngestChannel('upload')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer ${
                        tabIngestChannel === 'upload'
                          ? 'bg-white text-[#2D55F5] shadow-2xs border border-slate-200/80'
                          : 'text-slate-600'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabIngestChannel('db')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer ${
                        tabIngestChannel === 'db'
                          ? 'bg-white text-[#2D55F5] shadow-2xs border border-slate-200/80'
                          : 'text-slate-600'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Pull Live Database</span>
                    </button>
                  </div>
                </div>

                {tabIngestChannel === 'upload' ? (
                  <label className="block border-2 border-dashed border-slate-300 hover:border-[#2D55F5] rounded-xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,.tsv,.xlsx,.xls,.json,.jsonl"
                      onChange={handleCandidateFileUpload}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2D55F5] flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Upload Candidate ML Training Dataset
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports <code className="font-mono">.csv</code>, <code className="font-mono">.xlsx</code>,{' '}
                      <code className="font-mono">.tsv</code>, <code className="font-mono">.json</code>, and{' '}
                      <code className="font-mono">.jsonl</code>
                    </p>
                  </label>
                ) : (
                  <StudioDatabaseExtractor
                    onExtracted={({ records, columns, tableName }) =>
                      initializeTabularSchema(records, columns, tableName)
                    }
                    defaultLimit={5000}
                    compact
                  />
                )}

                {/* Baseline Reference Distribution Selector */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Covariate Drift Reference Baseline (PSI Comparison)
                    </span>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-semibold">
                      {[
                        { id: 'split', label: 'Window Split' },
                        { id: 'upload', label: 'Reference File' },
                        { id: 'db', label: 'Reference DB Table' },
                      ].map((bm) => (
                        <button
                          key={bm.id}
                          type="button"
                          onClick={() => setBaselineMode(bm.id)}
                          className={`px-2.5 py-1 rounded-md cursor-pointer ${
                            baselineMode === bm.id ? 'bg-[#2D55F5] text-white' : 'text-slate-600'
                          }`}
                        >
                          {bm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {baselineMode === 'split' && (
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                      <span>Compare first reference slice against remaining candidate slice:</span>
                      <select
                        value={baselineSplitRatio}
                        onChange={(e) => setBaselineSplitRatio(Number(e.target.value))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                      >
                        <option value={0.2}>20% Baseline / 80% Candidate</option>
                        <option value={0.3}>30% Baseline / 70% Candidate</option>
                        <option value={0.5}>50% Baseline / 50% Candidate</option>
                      </select>
                    </div>
                  )}

                  {baselineMode === 'upload' && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-600">
                        {baselineLabel ? `Loaded baseline: ${baselineLabel}` : 'Upload production baseline file:'}
                      </span>
                      <label className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer">
                        <span>Choose Baseline File</span>
                        <input
                          type="file"
                          accept=".csv,.tsv,.xlsx,.xls,.json,.jsonl"
                          onChange={handleBaselineFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {baselineMode === 'db' && (
                    <StudioDatabaseExtractor
                      onExtracted={({ records, tableName }) => {
                        setBaselineRecords(records);
                        setBaselineLabel(`${tableName} (${records.length.toLocaleString()} rows)`);
                      }}
                      defaultLimit={5000}
                      compact
                    />
                  )}
                </div>

                {/* Live Loaded Dataset Banner + Schema Sample Toggle */}
                {candidateRecords.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-emerald-900">
                        <strong>Loaded:</strong> <span className="font-mono">{datasetName}</span> —{' '}
                        <strong>{candidateRecords.length.toLocaleString()}</strong> rows ×{' '}
                        <strong>{candidateColumns.length}</strong> columns
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowSamplePreview((v) => !v)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D55F5] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{showSamplePreview ? 'Hide Sample' : 'Preview Rows'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCandidateRecords([]);
                            setCandidateColumns([]);
                            setTabCert(null);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>

                    {showSamplePreview && (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              {candidateColumns.slice(0, 10).map((col) => (
                                <th key={col} className="py-1.5 px-2.5 font-bold text-slate-700 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {candidateRecords.slice(0, 5).map((row, idx) => (
                              <tr key={idx}>
                                {candidateColumns.slice(0, 10).map((col) => (
                                  <td
                                    key={col}
                                    className="py-1.5 px-2.5 text-slate-600 whitespace-nowrap max-w-[180px] truncate"
                                  >
                                    {row[col] === null || row[col] === undefined ? 'NULL' : String(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {tabError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {tabError}
                  </div>
                )}
              </section>

              {/* STEP 2: SCHEMA ROLES & RELEASE GATE THRESHOLDS */}
              <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                        Step 2 • Schema &amp; Thresholds
                      </span>
                      <h2 className="text-base font-bold text-slate-900">Configure Certification Gate</h2>
                    </div>
                    <Sliders className="w-4 h-4 text-slate-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dataset Release Identifier</label>
                    <input
                      type="text"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      placeholder="e.g. customer_churn_q4_release"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target / Label Column
                      </label>
                      <select
                        value={targetColumn}
                        onChange={(e) => setTargetColumn(e.target.value)}
                        disabled={candidateColumns.length === 0}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 disabled:bg-slate-50"
                      >
                        <option value="">(None / Unsupervised)</option>
                        {candidateColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Protected Fairness Column
                      </label>
                      <select
                        value={protectedColumn}
                        onChange={(e) => setProtectedColumn(e.target.value)}
                        disabled={candidateColumns.length === 0}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 disabled:bg-slate-50"
                      >
                        <option value="">(Optional — EU AI Act Art. 10)</option>
                        {candidateColumns
                          .filter((c) => c !== targetColumn)
                          .map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max PSI Drift Threshold
                      </label>
                      <input
                        type="number"
                        min={0.05}
                        max={2.0}
                        step={0.05}
                        value={psiThreshold}
                        onChange={(e) => setPsiThreshold(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Leakage Correlation |r| Limit
                      </label>
                      <input
                        type="number"
                        min={0.4}
                        max={0.99}
                        step={0.05}
                        value={leakageThreshold}
                        onChange={(e) => setLeakageThreshold(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  {candidateColumns.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                        Exclude Identifier / Timestamp Columns from Drift &amp; Leakage Math:
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg border border-slate-200 bg-slate-50/70">
                        {candidateColumns
                          .filter((c) => c !== targetColumn)
                          .map((col) => {
                            const active = excludedColumns.includes(col);
                            return (
                              <button
                                key={col}
                                type="button"
                                onClick={() => toggleExcludedCol(col)}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                                }`}
                              >
                                {col}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => runTabularCertification(false)}
                  disabled={tabRunning || candidateRecords.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {tabRunning
                      ? 'Evaluating Drift, Leakage & Parity...'
                      : `Run Certification Audit (${candidateRecords.length.toLocaleString()} Rows)`}
                  </span>
                </button>
              </section>
            </div>

            {/* STEP 3 & 4: CERTIFICATION DIAGNOSTICS, REMEDIATION & OUTPUT DELIVERY */}
            {tabCert && (
              <div className="space-y-6">
                {/* Release Verdict Banner */}
                <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${verdictBadgeClass(
                            tabCert.verdict
                          )}`}
                        >
                          {tabCert.verdict}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          Composite Readiness Score: {tabCert.anchoredScore} / 10.0
                        </span>
                        <span className="text-xs text-slate-500 font-mono">({tabCert.certId})</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        SHA-256 Seal: {tabCert.sha256DatasetHash} • Baseline: {tabCert.baselineSource}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-center shrink-0">
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Rows</p>
                        <p className="text-sm font-bold text-slate-900">{tabCert.totalRows.toLocaleString()}</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Max PSI</p>
                        <p className="text-sm font-bold text-slate-900">{tabCert.maxPsi}</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Leakage</p>
                        <p className="text-sm font-bold text-slate-900">{tabCert.leakageAlerts?.length || 0}</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Missing %</p>
                        <p className="text-sm font-bold text-slate-900">{tabCert.overallMissingPct}%</p>
                      </div>
                    </div>
                  </div>

                  {tabCert.blockingReasons?.length > 0 && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-1">
                      <p className="text-xs font-bold text-amber-900">
                        Gate Findings Requiring Review or Remediation:
                      </p>
                      <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
                        {tabCert.blockingReasons.map((br, idx) => (
                          <li key={idx}>{br}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tabCert.remediationSummary?.applied && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex flex-wrap items-center gap-x-5 gap-y-1">
                      <strong>✓ Remediation Applied:</strong>
                      <span>
                        Rows: {tabCert.remediationSummary.rowsBefore.toLocaleString()} →{' '}
                        {tabCert.remediationSummary.rowsAfter.toLocaleString()}
                      </span>
                      {tabCert.remediationSummary.columnsDropped?.length > 0 && (
                        <span>Dropped Columns: {tabCert.remediationSummary.columnsDropped.join(', ')}</span>
                      )}
                      <span>Duplicates Removed: {tabCert.remediationSummary.duplicatesRemoved}</span>
                      <span>Null Cells Imputed: {tabCert.remediationSummary.nullCellsImputed}</span>
                      <span>Outliers Clipped: {tabCert.remediationSummary.outliersClipped}</span>
                    </div>
                  )}
                </section>

                {/* Diagnostics Grid: Drift + Leakage + Subgroup Parity */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: PSI Drift & Leakage */}
                  <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
                    {/* Target Leakage Alerts */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Target / Label Leakage Scanner {tabCert.targetColumn ? `(Target: ${tabCert.targetColumn})` : ''}
                      </h3>
                      {!tabCert.targetColumn ? (
                        <p className="text-xs text-slate-500 mt-1">
                          Select a Target / Label Column in Step 2 to scan features for post-event target leakage.
                        </p>
                      ) : tabCert.leakageAlerts?.length === 0 ? (
                        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-2">
                          ✓ Zero features exceed the |r| ≥ {tabCert.leakageThreshold} target leakage threshold.
                        </p>
                      ) : (
                        <div className="space-y-2 mt-2">
                          {tabCert.leakageAlerts.map((la) => (
                            <div
                              key={la.feature}
                              className="rounded-xl border border-red-200 bg-red-50/70 p-3 flex items-start justify-between gap-3"
                            >
                              <div>
                                <p className="text-xs font-bold text-red-900">
                                  {la.feature} — Pearson r = {la.correlation} ({la.risk})
                                </p>
                                <p className="text-[11px] text-red-800 mt-0.5">{la.explanation}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleDropColumn(la.feature)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                                  remediateOpts.dropColumns.includes(la.feature)
                                    ? 'bg-red-700 text-white'
                                    : 'bg-white border border-red-300 text-red-700'
                                }`}
                              >
                                {remediateOpts.dropColumns.includes(la.feature) ? 'Marked to Drop' : 'Mark to Drop'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 10-Bin PSI Feature Drift */}
                    <div className="border-t border-slate-100 pt-4">
                      <h3 className="text-sm font-bold text-slate-900 mb-2.5">
                        10-Bin Population Stability Index (PSI) Covariate Drift
                      </h3>
                      {tabCert.featureDrift?.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Not enough numeric feature rows to compute 10-bin quantile PSI.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {tabCert.featureDrift.map((fd) => {
                            const pctBar = Math.min(100, (fd.psi / Math.max(0.5, tabCert.psiThreshold * 1.6)) * 100);
                            const isExpanded = expandedDriftFeature === fd.feature;
                            return (
                              <div key={fd.feature} className="rounded-xl border border-slate-200 p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedDriftFeature(isExpanded ? null : fd.feature)}
                                    className="font-mono font-bold text-slate-900 hover:text-[#2D55F5] cursor-pointer"
                                  >
                                    {fd.feature} {isExpanded ? '▾' : '▸'}
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold text-slate-700">PSI {fd.psi}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        fd.severity === 'CRITICAL'
                                          ? 'bg-red-50 text-red-700 border border-red-200'
                                          : fd.severity === 'WARNING'
                                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      {fd.severity}
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      fd.severity === 'CRITICAL'
                                        ? 'bg-red-500'
                                        : fd.severity === 'WARNING'
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.max(3, pctBar)}%` }}
                                  />
                                </div>
                                {isExpanded && fd.bins?.length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 text-[10px] font-mono">
                                    {fd.bins.map((b, bi) => (
                                      <div key={bi} className="rounded bg-slate-50 border border-slate-200 p-1.5">
                                        <p className="font-bold text-slate-700 truncate">{b.binLabel}</p>
                                        <p className="text-slate-500">
                                          Base {b.baselinePct}% → Cand {b.candidatePct}%
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Right: Interactive Remediation Engine + Class/Fairness Parity */}
                  <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                          Step 3 • Remediate &amp; Re-Certify
                        </span>
                        <h3 className="text-base font-bold text-slate-900">Deterministic Dataset Repair</h3>
                      </div>
                      <Wrench className="w-4 h-4 text-[#2D55F5]" />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                        Drop Leaked, High-Null, or Corrupted Columns ({remediateOpts.dropColumns.length} selected):
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                        {candidateColumns
                          .filter((c) => c !== targetColumn)
                          .map((col) => {
                            const dropped = remediateOpts.dropColumns.includes(col);
                            return (
                              <button
                                key={col}
                                type="button"
                                onClick={() => toggleDropColumn(col)}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${
                                  dropped
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                                }`}
                              >
                                {dropped ? `✕ ${col}` : col}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Numeric Null Imputation
                        </label>
                        <select
                          value={remediateOpts.imputeNumeric}
                          onChange={(e) => setRemediateOpts((p) => ({ ...p, imputeNumeric: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                        >
                          <option value="none">Do not impute</option>
                          <option value="median">Impute Column Median</option>
                          <option value="mean">Impute Column Mean</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Categorical Null Imputation
                        </label>
                        <select
                          value={remediateOpts.imputeCategorical}
                          onChange={(e) => setRemediateOpts((p) => ({ ...p, imputeCategorical: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                        >
                          <option value="none">Do not impute</option>
                          <option value="mode">Impute Most Frequent (Mode)</option>
                          <option value="unknown">Fill &ldquo;UNKNOWN&rdquo;</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={remediateOpts.deduplicate}
                          onChange={(e) => setRemediateOpts((p) => ({ ...p, deduplicate: e.target.checked }))}
                          className="rounded border-slate-300 text-[#2D55F5]"
                        />
                        <span>Remove exact duplicate rows ({tabCert.duplicateRows} detected)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={remediateOpts.dropNullTargetRows}
                          onChange={(e) => setRemediateOpts((p) => ({ ...p, dropNullTargetRows: e.target.checked }))}
                          className="rounded border-slate-300 text-[#2D55F5]"
                        />
                        <span>Drop rows where target column is missing</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={remediateOpts.clipOutliers}
                          onChange={(e) => setRemediateOpts((p) => ({ ...p, clipOutliers: e.target.checked }))}
                          className="rounded border-slate-300 text-[#2D55F5]"
                        />
                        <span>Winsorize extreme numeric outliers (1st–99th percentile)</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => runTabularCertification(true)}
                      disabled={tabRunning}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{tabRunning ? 'Remediating...' : 'Apply Remediations & Re-Certify Dataset'}</span>
                    </button>

                    {/* Class Balance & Protected Subgroup Parity */}
                    {(Object.keys(tabCert.classBalance || {}).length > 0 || tabCert.equityAudit) && (
                      <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                        {Object.keys(tabCert.classBalance || {}).length > 0 && (
                          <div>
                            <p className="font-bold text-slate-800 mb-1">Target Class Distribution</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(tabCert.classBalance).map(([cls, cnt]) => (
                                <span
                                  key={cls}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]"
                                >
                                  {cls}: {Number(cnt).toLocaleString()} (
                                  {((Number(cnt) / Math.max(1, tabCert.totalRows)) * 100).toFixed(1)}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {tabCert.equityAudit && (
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                            <p className="font-bold text-slate-800">
                              Subgroup Parity ({tabCert.equityAudit.protectedColumn})
                            </p>
                            {tabCert.equityAudit.disparateImpactRatio !== null && (
                              <p className="text-[11px] text-slate-600">
                                Disparate Impact Ratio:{' '}
                                <strong>{tabCert.equityAudit.disparateImpactRatio}</strong> (EEOC 4/5ths benchmark: ≥
                                0.80)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                </div>

                {/* Column Health & Missingness Profiler Table */}
                {tabCert.columnProfiles?.length > 0 && (
                  <section className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60">
                      <h3 className="text-sm font-bold text-slate-900">
                        Column Health, Missingness &amp; IQR Outlier Telemetry ({tabCert.columnProfiles.length} Columns)
                      </h3>
                    </div>
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase sticky top-0">
                          <tr>
                            <th className="py-2 px-4">Column</th>
                            <th className="py-2 px-4">Type</th>
                            <th className="py-2 px-4">Nulls</th>
                            <th className="py-2 px-4">Distinct</th>
                            <th className="py-2 px-4">Range / Top Value</th>
                            <th className="py-2 px-4">Median / Mean</th>
                            <th className="py-2 px-4">IQR Outliers</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tabCert.columnProfiles.map((cp) => (
                            <tr key={cp.column} className="hover:bg-slate-50/70">
                              <td className="py-2 px-4 font-mono font-bold text-slate-900">{cp.column}</td>
                              <td className="py-2 px-4 text-slate-600">{cp.dataType}</td>
                              <td className="py-2 px-4 font-mono">
                                {cp.nullCount} ({cp.nullPct}%)
                              </td>
                              <td className="py-2 px-4 font-mono">{cp.distinctCount}</td>
                              <td className="py-2 px-4 font-mono text-slate-600">
                                {cp.dataType === 'numeric' ? `${cp.min} .. ${cp.max}` : cp.topValue || '—'}
                              </td>
                              <td className="py-2 px-4 font-mono text-slate-600">
                                {cp.dataType === 'numeric' ? `${cp.median} / ${cp.mean}` : '—'}
                              </td>
                              <td className="py-2 px-4 font-mono text-slate-700">{cp.outlierCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* STEP 4: EXPORT CLEAN DATASET, SIGNED CERTIFICATE & COMMIT TO DB */}
                <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                        Step 4 • Export &amp; Destination Commit
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        Download Certified Training Dataset or Push to Target Database
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          exportRecordsToFile(
                            activeTabularOutputRecords,
                            `${tabCert.datasetName}_certified`,
                            'csv'
                          )
                        }
                        className="px-3.5 py-2 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Clean .CSV ({activeTabularOutputRecords.length.toLocaleString()})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          exportRecordsToFile(
                            activeTabularOutputRecords,
                            `${tabCert.datasetName}_certified`,
                            'xlsx'
                          )
                        }
                        className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .XLSX</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          exportRecordsToFile(
                            activeTabularOutputRecords,
                            `${tabCert.datasetName}_certified`,
                            'jsonl'
                          )
                        }
                        className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .JSONL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const { remediatedRecords, ...certCard } = tabCert;
                          downloadTextFile(
                            JSON.stringify(certCard, null, 2),
                            `${tabCert.certId}_release_certificate.json`
                          );
                        }}
                        className="px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Signed Certificate (.JSON)</span>
                      </button>
                    </div>
                  </div>

                  <StudioDatabaseCommitPanel
                    records={activeTabularOutputRecords}
                    suggestedTableName={`${(tabCert.datasetName || 'ml_dataset').replace(/[^a-zA-Z0-9_]/g, '_')}_certified`}
                    recordLabel="certified training rows"
                  />
                </section>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: LLM FINE-TUNING (SFT / DPO) HYGIENE & EXPORT WORKBENCH       */}
        {/* =================================================================== */}
        {activeTab === 'sft' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* STEP 1: SFT CORPUS INGESTION */}
              <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                      Step 1 • Ingest Fine-Tuning Corpus
                    </span>
                    <h2 className="text-base font-bold text-slate-900">Connect Instruction / Chat Pairs</h2>
                  </div>

                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
                    {[
                      { id: 'upload', label: 'Upload File' },
                      { id: 'db', label: 'Database' },
                      { id: 'paste', label: 'Paste JSONL' },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSftIngestChannel(ch.id)}
                        className={`px-2.5 py-1.5 rounded-md cursor-pointer ${
                          sftIngestChannel === ch.id
                            ? 'bg-white text-[#2D55F5] shadow-2xs border border-slate-200/80'
                            : 'text-slate-600'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {sftIngestChannel === 'upload' && (
                  <label className="block border-2 border-dashed border-slate-300 hover:border-[#2D55F5] rounded-xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept=".jsonl,.ndjson,.json,.csv,.tsv,.xlsx,.xls"
                      onChange={handleSftFileUpload}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2D55F5] flex items-center justify-center mx-auto mb-2">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Upload OpenAI Chat JSONL, Instruction JSON, or Prompt/Response CSV/Excel
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports <code className="font-mono">{'{"messages": [...]}'}</code>,{' '}
                      <code className="font-mono">{'{"prompt", "completion"}'}</code>,{' '}
                      <code className="font-mono">{'{"instruction", "output"}'}</code>, or custom spreadsheet columns
                    </p>
                  </label>
                )}

                {sftIngestChannel === 'db' && (
                  <StudioDatabaseExtractor
                    onExtracted={({ records, columns, tableName }) =>
                      initializeSftCorpus(records, columns, tableName)
                    }
                    defaultLimit={5000}
                    compact
                  />
                )}

                {sftIngestChannel === 'paste' && (
                  <div className="space-y-2.5">
                    <textarea
                      rows={5}
                      value={sftPasteText}
                      onChange={(e) => setSftPasteText(e.target.value)}
                      placeholder={
                        '{"prompt": "Summarize customer ticket #402", "completion": "Customer requested invoice copy."}\n{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#2D55F5] focus:bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSftPasteLoad}
                        disabled={!sftPasteText.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                      >
                        Load Pasted JSONL Pairs
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Prompt / Completion Column Mapper when tabular/custom keys are uploaded */}
                {sftRawRecords.length > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Loaded {sftRawRecords.length.toLocaleString()} Fine-Tuning Pairs ({sftDatasetName})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSftRawRecords([]);
                          setSftColumns([]);
                          setSftCert(null);
                        }}
                        className="text-xs font-semibold text-red-600 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>

                    {!sftRawRecords.some((r) => Array.isArray(r?.messages)) && sftColumns.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            User Prompt / Instruction Column
                          </label>
                          <select
                            value={sftPromptCol}
                            onChange={(e) => setSftPromptCol(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                          >
                            {sftColumns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Assistant Completion / Output Column
                          </label>
                          <select
                            value={sftCompletionCol}
                            onChange={(e) => setSftCompletionCol(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                          >
                            {sftColumns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        System Role Prompt (optional — injected into exported OpenAI Chat JSONL)
                      </label>
                      <input
                        type="text"
                        value={sftSystemPrompt}
                        onChange={(e) => setSftSystemPrompt(e.target.value)}
                        placeholder="e.g. You are an accurate enterprise financial assistant."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {sftError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {sftError}
                  </div>
                )}
              </section>

              {/* STEP 2: SFT HYGIENE & AUTO-CLEAN RULES */}
              <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                      Step 2 • Hygiene &amp; Auto-Sanitization
                    </span>
                    <h2 className="text-base font-bold text-slate-900">Fine-Tuning Guardrails</h2>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Corpus Release Name</label>
                    <input
                      type="text"
                      value={sftDatasetName}
                      onChange={(e) => setSftDatasetName(e.target.value)}
                      placeholder="e.g. support_assistant_sft_v2"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sftRemediateOpts.redactSecretsAndPii}
                        onChange={(e) =>
                          setSftRemediateOpts((p) => ({ ...p, redactSecretsAndPii: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>Auto-redact API keys, credentials, SSNs &amp; payment cards</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sftRemediateOpts.redactEmailsAndPhones}
                        onChange={(e) =>
                          setSftRemediateOpts((p) => ({ ...p, redactEmailsAndPhones: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>Auto-redact email addresses &amp; phone numbers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sftRemediateOpts.removeRefusals}
                        onChange={(e) => setSftRemediateOpts((p) => ({ ...p, removeRefusals: e.target.checked }))}
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>Strip canned refusal turns (&ldquo;As an AI language model…&rdquo;)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sftRemediateOpts.deduplicatePrompts}
                        onChange={(e) =>
                          setSftRemediateOpts((p) => ({ ...p, deduplicatePrompts: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>Deduplicate identical normalized prompts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sftRemediateOpts.removeEmptyCompletions}
                        onChange={(e) =>
                          setSftRemediateOpts((p) => ({ ...p, removeEmptyCompletions: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>Drop truncated / empty completions</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Minimum Assistant Completion Length (characters)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={sftRemediateOpts.minCompletionChars}
                      onChange={(e) =>
                        setSftRemediateOpts((p) => ({ ...p, minCompletionChars: Number(e.target.value) || 8 }))
                      }
                      className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunSftCertification(false)}
                    disabled={sftRunning || sftRawRecords.length === 0}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Audit Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunSftCertification(true)}
                    disabled={sftRunning || sftRawRecords.length === 0}
                    className="py-2.5 px-3 rounded-xl bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{sftRunning ? 'Processing...' : 'Sanitize & Certify'}</span>
                  </button>
                </div>
              </section>
            </div>

            {/* SFT RESULTS, PAIR INSPECTOR & OPENAI CHAT JSONL EXPORT */}
            {sftCert && (
              <div className="space-y-6">
                <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${verdictBadgeClass(
                            sftCert.verdict
                          )}`}
                        >
                          {sftCert.verdict}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          Hygiene Score: {sftCert.anchoredScore} / 10.0
                        </span>
                        <span className="text-xs font-mono text-slate-500">({sftCert.certId})</span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-1">
                        SHA-256: {sftCert.sha256DatasetHash} • Est. Corpus Tokens:{' '}
                        {Number(sftCert.estTotalTokens || 0).toLocaleString()} (avg {sftCert.avgPromptTokens}p /{' '}
                        {sftCert.avgCompletionTokens}c)
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Retained Pairs</p>
                        <p className="text-sm font-bold text-slate-900">{retainedSftPairs.length.toLocaleString()}</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Unmasked Leaks</p>
                        <p className="text-sm font-bold text-slate-900">
                          {(sftCert.secretLeaksFound || 0) + (sftCert.piiLeaksFound || 0)}
                        </p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Refusal %</p>
                        <p className="text-sm font-bold text-slate-900">{sftCert.refusalOverSaturationPct}%</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Duplicates</p>
                        <p className="text-sm font-bold text-slate-900">{sftCert.duplicatePrompts}</p>
                      </div>
                    </div>
                  </div>

                  {sftCert.remediationSummary?.applied && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex flex-wrap gap-x-5 gap-y-1">
                      <strong>✓ Auto-Sanitization Summary:</strong>
                      <span>
                        Input {sftCert.remediationSummary.inputPairs} → Output {sftCert.remediationSummary.outputPairs}
                      </span>
                      <span>Pairs Redacted: {sftCert.remediationSummary.pairsAutoRedacted}</span>
                      <span>Refusals Stripped: {sftCert.remediationSummary.refusalsRemoved}</span>
                      <span>Duplicates Removed: {sftCert.remediationSummary.duplicatesRemoved}</span>
                      <span>Empty Dropped: {sftCert.remediationSummary.emptyRemoved}</span>
                    </div>
                  )}
                </section>

                {/* Sanitized Fine-Tuning Pair Preview & Manual Exclusion */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Sanitized Training Pairs Preview ({retainedSftPairs.length.toLocaleString()} Active)
                    </h3>
                    <span className="text-xs text-slate-500">Uncheck any pair to exclude from JSONL export</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {(sftCert.sanitizedRecords || []).slice(0, 60).map((pair) => {
                      const excluded = excludedPairIndices.has(pair.pairIndex);
                      return (
                        <div key={pair.pairIndex} className="p-4 hover:bg-slate-50/70 flex items-start gap-3 text-xs">
                          <input
                            type="checkbox"
                            checked={!excluded}
                            onChange={() =>
                              setExcludedPairIndices((prev) => {
                                const next = new Set(prev);
                                if (next.has(pair.pairIndex)) next.delete(pair.pairIndex);
                                else next.add(pair.pairIndex);
                                return next;
                              })
                            }
                            className="mt-1 rounded border-slate-300 text-[#2D55F5]"
                          />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                Pair #{pair.pairIndex} • User Prompt
                              </span>
                              <p className="font-mono text-slate-800 mt-0.5 whitespace-pre-wrap line-clamp-3">
                                {pair.prompt}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-[#2D55F5]">
                                Assistant Completion (~{pair.estTokens} tok)
                              </span>
                              <p className="font-mono text-slate-800 mt-0.5 whitespace-pre-wrap line-clamp-3">
                                {pair.completion}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Export OpenAI Chat JSONL, Flat CSV, Certificate, or Commit to Database */}
                <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                        Step 4 • Export Fine-Tuning Ready Corpus
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        Download OpenAI Chat JSONL or Commit Clean Pairs to Database
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={openAiChatExportRecords.length === 0}
                        onClick={() =>
                          exportRecordsToFile(
                            openAiChatExportRecords,
                            `${sftCert.datasetName}_openai_chat`,
                            'jsonl'
                          )
                        }
                        className="px-3.5 py-2 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>OpenAI Chat .JSONL ({openAiChatExportRecords.length})</span>
                      </button>
                      <button
                        type="button"
                        disabled={flatSftExportRecords.length === 0}
                        onClick={() =>
                          exportRecordsToFile(flatSftExportRecords, `${sftCert.datasetName}_pairs`, 'jsonl')
                        }
                        className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Prompt/Completion .JSONL</span>
                      </button>
                      <button
                        type="button"
                        disabled={flatSftExportRecords.length === 0}
                        onClick={() =>
                          exportRecordsToFile(flatSftExportRecords, `${sftCert.datasetName}_pairs`, 'csv')
                        }
                        className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const { sanitizedRecords, ...certCard } = sftCert;
                          downloadTextFile(
                            JSON.stringify(certCard, null, 2),
                            `${sftCert.certId}_sft_certificate.json`
                          );
                        }}
                        className="px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Signed Certificate (.JSON)</span>
                      </button>
                    </div>
                  </div>

                  <StudioDatabaseCommitPanel
                    records={flatSftExportRecords}
                    suggestedTableName={`${(sftCert.datasetName || 'sft_corpus').replace(/[^a-zA-Z0-9_]/g, '_')}_clean`}
                    recordLabel="sanitized fine-tuning pairs"
                  />
                </section>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: MODEL GOVERNANCE CERTIFICATE LEDGER                          */}
        {/* =================================================================== */}
        {activeTab === 'ledger' && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                  PostgreSQL Immutable Release Ledger
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Issued Dataset Governance Certificates ({certificates.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadCertificateLedger}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${certsLoading ? 'animate-spin' : ''}`} />
                </button>
                {certificates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => exportRecordsToFile(certificates, 'datax_ml_certificates_ledger', 'csv')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Ledger CSV</span>
                  </button>
                )}
              </div>
            </div>

            {certificates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No dataset certificates have been issued yet. Certify a Tabular ML or LLM SFT dataset to generate an
                immutable SHA-256 release seal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Certificate ID</th>
                      <th className="py-2.5 px-4">Dataset</th>
                      <th className="py-2.5 px-4">Modality</th>
                      <th className="py-2.5 px-4">Rows (Clean / Total)</th>
                      <th className="py-2.5 px-4">Score</th>
                      <th className="py-2.5 px-4">Verdict</th>
                      <th className="py-2.5 px-4">Issued At</th>
                      <th className="py-2.5 px-4 text-right">Artifact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificates.map((c) => (
                      <tr key={c.cert_id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">{c.cert_id}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{c.dataset_name}</td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">{c.modality}</td>
                        <td className="py-2.5 px-4 font-mono">
                          {Number(c.clean_row_count || 0).toLocaleString()} / {Number(c.row_count || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{c.anchored_score} / 10</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${verdictBadgeClass(c.verdict)}`}>
                            {c.verdict}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                          {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              downloadTextFile(
                                JSON.stringify(c.certificate_json || c, null, 2),
                                `${c.cert_id}.json`
                              )
                            }
                            className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-[#2D55F5] cursor-pointer"
                          >
                            Download JSON
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </DataXAppShell>
  );
}
