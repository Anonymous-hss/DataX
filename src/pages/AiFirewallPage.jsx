import React, { useState, useEffect, useMemo } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import StudioDatabaseExtractor from '../components/common/StudioDatabaseExtractor';
import StudioDatabaseCommitPanel from '../components/common/StudioDatabaseCommitPanel';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  Database,
  Globe,
  FileText,
  Sliders,
  Play,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Bot,
  Lock,
  Layers,
} from 'lucide-react';
import api, { API_BASE_URL } from '../services/apiClient';
import {
  parseUploadedRagFiles,
  parseUploadedDatasetFile,
  recordsToRagChunks,
  exportRecordsToFile,
  downloadTextFile,
} from '../utils/datasetIo';

export default function AiFirewallPage({ onSwitchToMarketing } = {}) {
  const [activeTab, setActiveTab] = useState('rag'); // 'rag' | 'tool_call' | 'integration'

  // =========================================================================
  // TAB 1: PRE-EMBEDDING RAG INGESTION, SANITIZATION & DELIVERY
  // =========================================================================
  const [ingestSourceMode, setIngestSourceMode] = useState('upload'); // 'upload' | 'db' | 'url' | 'paste'
  const [stagedChunks, setStagedChunks] = useState([]);
  const [ingestError, setIngestError] = useState('');
  const [ingestNotice, setIngestNotice] = useState('');

  // Tabular column mapping when user uploads CSV/XLSX/JSON or extracts DB rows
  const [tabularBuffer, setTabularBuffer] = useState(null); // { sourceName, records, columns }
  const [mappedTextCol, setMappedTextCol] = useState('');
  const [mappedTitleCol, setMappedTitleCol] = useState('');

  // Public URL fetch state
  const [urlInput, setUrlInput] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);

  // Raw text paste state
  const [pasteDocTitle, setPasteDocTitle] = useState('');
  const [pasteDocBody, setPasteDocBody] = useState('');

  // Configurable RAG Sanitization Policy
  const [ragPolicy, setRagPolicy] = useState({
    autoChunk: true,
    chunkSize: 1200,
    chunkOverlap: 120,
    injectionAction: 'quarantine', // 'quarantine' | 'strip'
    redactSecrets: true,
    redactSsnAndCards: true,
    redactEmails: false,
    redactPhones: false,
    customRedactionsText: '',
    persistLedger: true,
  });

  // Scan execution & interactive remediation state
  const [scanningRag, setScanningRag] = useState(false);
  const [ragScanResult, setRagScanResult] = useState(null);
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [selectedChunkId, setSelectedChunkId] = useState(null);
  const [editedTextMap, setEditedTextMap] = useState({});
  const [includedChunkIds, setIncludedChunkIds] = useState(new Set());

  // =========================================================================
  // TAB 2: LIVE AGENT TOOL-CALL POLICY, VERIFIER & HITL LEDGER
  // =========================================================================
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policySavedNote, setPolicySavedNote] = useState('');
  const [agentPolicy, setAgentPolicy] = useState({
    max_financial_limit: 5000,
    hitl_threshold: 500,
    financial_fields_text: 'amount, refund_amount, transfer_amount, credit_limit, total, payout, payment, price',
    blocked_tools_text: '',
    custom_blocked_terms_text: '',
    block_destructive_sql: true,
    redact_secrets_in_args: true,
    redact_pii_in_args: true,
    redact_emails_in_args: false,
    updatedAt: null,
  });

  // Single Tool-Call Verifier (clean empty form — user enters their real payload)
  const [verifierAgentId, setVerifierAgentId] = useState('');
  const [verifierToolName, setVerifierToolName] = useState('');
  const [verifierArgsJson, setVerifierArgsJson] = useState('{\n  \n}');
  const [verifierError, setVerifierError] = useState('');
  const [verifierLoading, setVerifierLoading] = useState(false);
  const [verifierResult, setVerifierResult] = useState(null);

  // Batch Agent Trace File Audit
  const [batchTraceResults, setBatchTraceResults] = useState([]);
  const [batchTraceRunning, setBatchTraceRunning] = useState(false);

  // Live Persisted Firewall Events & HITL Queue
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState('ALL');
  const [resolvingEventId, setResolvingEventId] = useState(null);

  // Tab 3 copy state
  const [copiedSnippet, setCopiedSnippet] = useState('');

  // Load workspace firewall policy and persisted live events on mount
  useEffect(() => {
    loadWorkspacePolicy();
    loadFirewallEvents();
  }, []);

  const loadWorkspacePolicy = async () => {
    setPolicyLoading(true);
    try {
      const res = await api.get('/firewall/policy');
      if (res?.policy) {
        const p = res.policy;
        setAgentPolicy({
          max_financial_limit: Number(p.max_financial_limit ?? 5000),
          hitl_threshold: Number(p.hitl_threshold ?? 500),
          financial_fields_text: (p.financial_fields || []).join(', '),
          blocked_tools_text: (p.blocked_tools || []).join(', '),
          custom_blocked_terms_text: (p.custom_blocked_terms || []).join(', '),
          block_destructive_sql: Boolean(p.block_destructive_sql ?? true),
          redact_secrets_in_args: Boolean(p.redact_secrets_in_args ?? true),
          redact_pii_in_args: Boolean(p.redact_pii_in_args ?? true),
          redact_emails_in_args: Boolean(p.redact_emails_in_args ?? false),
          updatedAt: p.updatedAt || null,
        });
      }
    } catch {
      // Non-fatal on initial load
    } finally {
      setPolicyLoading(false);
    }
  };

  const loadFirewallEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await api.get('/firewall/events?limit=60');
      setEvents(res?.events || []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // RAG Ingestion Handlers
  // -------------------------------------------------------------------------
  const handleFileUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIngestError('');
    setIngestNotice('');
    try {
      const parsed = await parseUploadedRagFiles(fileList);
      if (parsed.tabularSource && parsed.tabularSource.columns.length > 0) {
        const cols = parsed.tabularSource.columns;
        const defaultText =
          cols.find((c) =>
            ['text', 'content', 'chunk', 'body', 'document', 'description', 'message', 'notes'].includes(
              c.toLowerCase()
            )
          ) || '';
        const defaultTitle =
          cols.find((c) => ['docname', 'title', 'source', 'id', 'filename', 'url'].includes(c.toLowerCase())) || '';
        setTabularBuffer({
          sourceName: parsed.tabularSource.fileName,
          records: parsed.tabularSource.records,
          columns: cols,
        });
        setMappedTextCol(defaultText);
        setMappedTitleCol(defaultTitle);
        setIngestNotice(
          `Loaded ${parsed.tabularSource.records.length.toLocaleString()} rows from "${parsed.tabularSource.fileName}". Confirm column mapping below to stage chunks.`
        );
      } else {
        setStagedChunks((prev) => [...prev, ...parsed.chunks]);
        setIngestNotice(
          `Staged ${parsed.chunks.length.toLocaleString()} document(s) from ${parsed.fileNames.join(', ')}.`
        );
      }
    } catch (err) {
      setIngestError(err.message || 'Failed to parse uploaded files.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDbExtractedForRag = ({ records, columns, tableName }) => {
    setIngestError('');
    const defaultText =
      columns.find((c) =>
        ['text', 'content', 'chunk', 'clean_text', 'body', 'description', 'message', 'notes'].includes(c.toLowerCase())
      ) || '';
    const defaultTitle =
      columns.find((c) => ['id', 'chunk_id', 'doc_id', 'title', 'source_doc', 'name'].includes(c.toLowerCase())) || '';
    setTabularBuffer({
      sourceName: tableName,
      records,
      columns,
    });
    setMappedTextCol(defaultText);
    setMappedTitleCol(defaultTitle);
    setIngestNotice(
      `Pulled ${records.length.toLocaleString()} rows from "${tableName}". Confirm the text column below to stage for scanning.`
    );
  };

  const handleConfirmTabularStaging = () => {
    if (!tabularBuffer) return;
    const derived = recordsToRagChunks(tabularBuffer.records, {
      textColumn: mappedTextCol,
      titleColumn: mappedTitleCol,
      defaultSource: tabularBuffer.sourceName,
    });
    if (derived.length === 0) {
      setIngestError('No non-empty text chunks could be derived from the selected column.');
      return;
    }
    setStagedChunks((prev) => [...prev, ...derived]);
    setIngestNotice(
      `Staged ${derived.length.toLocaleString()} chunks from "${tabularBuffer.sourceName}" (${mappedTextCol || 'all columns serialized'}).`
    );
    setTabularBuffer(null);
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      setIngestError('Enter a valid public https:// or http:// URL.');
      return;
    }
    setIngestError('');
    setIngestNotice('');
    setFetchingUrl(true);
    try {
      const res = await api.post('/firewall/fetch-url', {
        url: urlInput.trim(),
        chunkSize: Number(ragPolicy.chunkSize) || 1200,
        chunkOverlap: Number(ragPolicy.chunkOverlap) || 120,
      });
      const fetched = res.chunks || [];
      setStagedChunks((prev) => [...prev, ...fetched]);
      setIngestNotice(
        `Fetched ${Number(res.charCount || 0).toLocaleString()} chars from URL and staged ${fetched.length} chunk(s).`
      );
      setUrlInput('');
    } catch (err) {
      setIngestError(err.message || 'URL fetch failed.');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleStagePastedDoc = () => {
    if (!pasteDocBody.trim()) {
      setIngestError('Paste document content before staging.');
      return;
    }
    setIngestError('');
    const title = pasteDocTitle.trim() || `manual_doc_${stagedChunks.length + 1}.txt`;
    setStagedChunks((prev) => [...prev, { docName: title, text: pasteDocBody.trim() }]);
    setPasteDocTitle('');
    setPasteDocBody('');
    setIngestNotice(`Staged "${title}" for scanning.`);
  };

  // -------------------------------------------------------------------------
  // RAG Scan & Interactive Remediation Handlers
  // -------------------------------------------------------------------------
  const handleRunRagScan = async () => {
    if (stagedChunks.length === 0) {
      setIngestError('Stage at least one document, file, database table, or URL before scanning.');
      return;
    }
    setIngestError('');
    setScanningRag(true);
    try {
      const customTerms = ragPolicy.customRedactionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.post('/firewall/scan-rag-batch', {
        chunks: stagedChunks,
        persist: Boolean(ragPolicy.persistLedger),
        policy: {
          autoChunk: Boolean(ragPolicy.autoChunk),
          chunkSize: Number(ragPolicy.chunkSize) || 1200,
          chunkOverlap: Number(ragPolicy.chunkOverlap) || 120,
          injectionAction: ragPolicy.injectionAction,
          redactSecrets: Boolean(ragPolicy.redactSecrets),
          redactSsnAndCards: Boolean(ragPolicy.redactSsnAndCards),
          redactEmails: Boolean(ragPolicy.redactEmails),
          redactPhones: Boolean(ragPolicy.redactPhones),
          customRedactions: customTerms,
        },
      });

      setRagScanResult(res);
      const nextEdits = {};
      const nextIncluded = new Set();
      (res.results || []).forEach((r) => {
        nextEdits[r.chunkId] = r.sanitizedText;
        if (r.verdict !== 'QUARANTINED') {
          nextIncluded.add(r.chunkId);
        }
      });
      setEditedTextMap(nextEdits);
      setIncludedChunkIds(nextIncluded);
      setVerdictFilter('ALL');
      if (res.results && res.results.length > 0) {
        setSelectedChunkId(res.results[0].chunkId);
      }
    } catch (err) {
      setIngestError(err.message || 'RAG firewall scan failed.');
    } finally {
      setScanningRag(false);
    }
  };

  const filteredScanChunks = useMemo(() => {
    if (!ragScanResult?.results) return [];
    if (verdictFilter === 'ALL') return ragScanResult.results;
    return ragScanResult.results.filter((r) => r.verdict === verdictFilter);
  }, [ragScanResult, verdictFilter]);

  const activeChunk = useMemo(() => {
    if (!ragScanResult?.results?.length) return null;
    return (
      ragScanResult.results.find((r) => r.chunkId === selectedChunkId) ||
      filteredScanChunks[0] ||
      ragScanResult.results[0]
    );
  }, [ragScanResult, selectedChunkId, filteredScanChunks]);

  const toggleIncludeChunk = (chunkId) => {
    setIncludedChunkIds((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) next.delete(chunkId);
      else next.add(chunkId);
      return next;
    });
  };

  // Build clean exportable records from included chunks (incorporating any user inline text edits!)
  const approvedRagOutputRecords = useMemo(() => {
    if (!ragScanResult?.results) return [];
    return ragScanResult.results
      .filter((r) => includedChunkIds.has(r.chunkId))
      .map((r) => {
        const finalText = editedTextMap[r.chunkId] !== undefined ? editedTextMap[r.chunkId] : r.sanitizedText;
        return {
          chunk_id: r.chunkId,
          source_doc: r.docName,
          clean_text: finalText,
          est_tokens: Math.max(1, Math.floor((finalText || '').length / 4)),
          trust_score: r.trustScore,
          verdict: editedTextMap[r.chunkId] !== r.sanitizedText ? 'MANUAL_OVERRIDE_APPROVED' : r.verdict,
          redactions_applied: r.redactionsCount,
          sha256_seal: r.sha256Seal,
        };
      });
  }, [ragScanResult, includedChunkIds, editedTextMap]);

  const quarantinedThreatRecords = useMemo(() => {
    if (!ragScanResult?.results) return [];
    return ragScanResult.results
      .filter((r) => !includedChunkIds.has(r.chunkId))
      .map((r) => ({
        chunk_id: r.chunkId,
        source_doc: r.docName,
        verdict: r.verdict,
        trust_score: r.trustScore,
        violations: (r.violations || []).join(' | '),
        raw_text: r.originalText,
      }));
  }, [ragScanResult, includedChunkIds]);

  // -------------------------------------------------------------------------
  // Agent Tool-Call Policy, Verifier & HITL Handlers
  // -------------------------------------------------------------------------
  const buildPolicyObject = () => ({
    max_financial_limit: Number(agentPolicy.max_financial_limit) || 5000,
    hitl_threshold: Number(agentPolicy.hitl_threshold) || 500,
    financial_fields: agentPolicy.financial_fields_text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    blocked_tools: agentPolicy.blocked_tools_text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    custom_blocked_terms: agentPolicy.custom_blocked_terms_text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    block_destructive_sql: Boolean(agentPolicy.block_destructive_sql),
    redact_secrets_in_args: Boolean(agentPolicy.redact_secrets_in_args),
    redact_pii_in_args: Boolean(agentPolicy.redact_pii_in_args),
    redact_emails_in_args: Boolean(agentPolicy.redact_emails_in_args),
  });

  const handleSavePolicy = async () => {
    setPolicySaving(true);
    setPolicySavedNote('');
    try {
      const res = await api.post('/firewall/policy', { policy: buildPolicyObject() });
      if (res?.policy?.updatedAt) {
        setAgentPolicy((prev) => ({ ...prev, updatedAt: res.policy.updatedAt }));
      }
      setPolicySavedNote('Workspace guardrail policy saved to PostgreSQL.');
      setTimeout(() => setPolicySavedNote(''), 4000);
    } catch (err) {
      setVerifierError(err.message || 'Failed to save workspace policy.');
    } finally {
      setPolicySaving(false);
    }
  };

  const handleEvaluateToolCall = async () => {
    setVerifierError('');
    if (!verifierToolName.trim()) {
      setVerifierError('Enter a Tool Name (for example: issue_refund, run_sql_query, send_wire) to evaluate.');
      return;
    }
    let parsedArgs = {};
    try {
      parsedArgs = verifierArgsJson.trim() ? JSON.parse(verifierArgsJson) : {};
    } catch (err) {
      setVerifierError(`Arguments must be valid JSON: ${err.message}`);
      return;
    }

    setVerifierLoading(true);
    try {
      const res = await api.post('/firewall/intercept', {
        agent_id: verifierAgentId.trim() || 'production_agent',
        tool_name: verifierToolName.trim(),
        arguments: parsedArgs,
        policies: buildPolicyObject(),
      });
      setVerifierResult(res);
      loadFirewallEvents();
    } catch (err) {
      setVerifierError(err.message || 'Tool-call evaluation failed.');
    } finally {
      setVerifierLoading(false);
    }
  };

  const handleBatchAgentTraceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVerifierError('');
    setBatchTraceRunning(true);
    try {
      const parsed = await parseUploadedDatasetFile(file);
      const rows = (parsed.records || []).slice(0, 250);
      if (rows.length === 0) {
        throw new Error('Uploaded trace file contained 0 records.');
      }

      const policySnapshot = buildPolicyObject();
      const evaluated = [];
      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i];
        const agentId = String(r.agent_id || r.agentId || r.agent || 'trace_agent');
        const toolName = String(r.tool_name || r.toolName || r.tool || r.function || 'tool_call');
        let argsObj = r.arguments ?? r.args ?? r.parameters ?? r.payload ?? null;
        if (typeof argsObj === 'string') {
          try {
            argsObj = JSON.parse(argsObj);
          } catch {
            argsObj = { raw: argsObj };
          }
        }
        if (!argsObj || typeof argsObj !== 'object') {
          // Treat remaining columns as tool arguments
          argsObj = { ...r };
          delete argsObj.agent_id;
          delete argsObj.agentId;
          delete argsObj.tool_name;
          delete argsObj.toolName;
        }

        const res = await api.post('/firewall/intercept', {
          agent_id: agentId,
          tool_name: toolName,
          arguments: argsObj,
          policies: policySnapshot,
        });
        evaluated.push({
          trace_index: i + 1,
          event_id: res.eventId,
          agent_id: res.agentId,
          tool_name: res.toolName,
          verdict: res.verdict,
          risk_score: res.riskScore,
          violations: (res.violations || []).join(' | '),
          sanitized_arguments: res.sanitizedArguments ? JSON.stringify(res.sanitizedArguments) : null,
          latency_ms: res.latencyMs,
        });
      }
      setBatchTraceResults(evaluated);
      loadFirewallEvents();
    } catch (err) {
      setVerifierError(err.message || 'Batch trace evaluation failed.');
    } finally {
      setBatchTraceRunning(false);
      e.target.value = '';
    }
  };

  const handleResolveHitlEvent = async (eventId, decision) => {
    setResolvingEventId(eventId);
    try {
      await api.post(`/firewall/events/${eventId}/resolve`, {
        decision,
        note: `Reviewed in DataX Firewall Studio`,
      });
      await loadFirewallEvents();
    } catch (err) {
      setVerifierError(err.message || 'Failed to resolve HITL event.');
    } finally {
      setResolvingEventId(null);
    }
  };

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'ALL') return events;
    return events.filter((ev) => ev.verdict === eventFilter);
  }, [events, eventFilter]);

  // -------------------------------------------------------------------------
  // Tab 3 Dynamic Endpoint & SDK Code
  // -------------------------------------------------------------------------
  const resolvedApiOrigin = useMemo(() => {
    if (API_BASE_URL.startsWith('http')) return API_BASE_URL;
    if (typeof window !== 'undefined') return `${window.location.origin}${API_BASE_URL}`;
    return 'https://dataglow.ai/datax-api';
  }, []);

  const pythonMiddlewareCode = `import requests

DATAX_FIREWALL_URL = "${resolvedApiOrigin}/firewall/intercept"

def execute_guarded_tool(agent_id: str, tool_name: str, tool_fn, **kwargs):
    """Synchronous <25ms DataX guardrail wrapper for LangChain, CrewAI, or custom agents."""
    resp = requests.post(
        DATAX_FIREWALL_URL,
        json={
            "agent_id": agent_id,
            "tool_name": tool_name,
            "arguments": kwargs,
        },
        timeout=3.0,
    )
    resp.raise_for_status()
    decision = resp.json()

    if decision["verdict"] == "BLOCK_CRITICAL":
        raise PermissionError(f"Blocked by DataX Firewall: {decision['violations']}")
    if decision["verdict"] == "HOLD_FOR_HITL":
        return {"status": "HELD_FOR_APPROVAL", "event_id": decision["eventId"]}

    # Execute downstream tool using PII/secret-redacted arguments
    safe_args = decision.get("sanitizedArguments") or kwargs
    return tool_fn(**safe_args)`;

  const pythonRagScanCode = `import requests

DATAX_RAG_SCAN_URL = "${resolvedApiOrigin}/firewall/scan-rag-batch"

def sanitize_before_embedding(chunks: list[dict]) -> list[dict]:
    """Scans raw documents for prompt injection, API keys, and PII prior to vector indexing."""
    resp = requests.post(
        DATAX_RAG_SCAN_URL,
        json={
            "chunks": chunks,
            "persist": True,
            "policy": {
                "autoChunk": True,
                "chunkSize": ${Number(ragPolicy.chunkSize) || 1200},
                "chunkOverlap": ${Number(ragPolicy.chunkOverlap) || 120},
                "injectionAction": "${ragPolicy.injectionAction}",
                "redactSecrets": ${ragPolicy.redactSecrets ? 'True' : 'False'},
                "redactSsnAndCards": ${ragPolicy.redactSsnAndCards ? 'True' : 'False'},
            },
        },
        timeout=15.0,
    )
    resp.raise_for_status()
    payload = resp.json()
    return [
        {"id": c["chunkId"], "text": c["sanitizedText"], "source": c["docName"]}
        for c in payload["results"]
        if c["verdict"] in ("VERIFIED", "REDACTED_PASS")
    ]`;

  const copyText = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(''), 2000);
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1360px] mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2D55F5] border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                AI Data Firewall
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Pre-Embedding RAG Sanitization &amp; Real-Time Agent Tool Guardrail
              </span>
            </div>
            <h1 className="text-[28px] font-bold text-[#0A0F1F] tracking-tight mt-1.5">
              AI Agent &amp; RAG Data Firewall
            </h1>
            <p className="text-sm text-[#5F6678] mt-1 max-w-3xl">
              Ingest your own documents, spreadsheets, URLs, or database tables to strip prompt injections and redact
              credentials before vector indexing — or configure live workspace policies to govern autonomous agent tool
              calls.
            </p>
          </div>

          {/* Primary Mode Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs shrink-0 self-start">
            <button
              type="button"
              onClick={() => setActiveTab('rag')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'rag' ? 'bg-[#2D55F5] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. RAG Pre-Embedding Pipeline</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tool_call')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tool_call'
                  ? 'bg-[#2D55F5] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>2. Agent Tool-Call Guard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('integration')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'integration'
                  ? 'bg-[#2D55F5] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>3. Production API &amp; SDK</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: RAG PRE-EMBEDDING SANITIZATION WORKBENCH                     */}
        {/* =================================================================== */}
        {activeTab === 'rag' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* STEP 1: DATA INGESTION */}
              <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">Step 1 • Ingest</span>
                    <h2 className="text-base font-bold text-slate-900">Connect Knowledge Corpus</h2>
                  </div>

                  {/* Ingestion Channel Tabs */}
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
                    {[
                      { id: 'upload', label: 'Upload Files', icon: Upload },
                      { id: 'db', label: 'Database', icon: Database },
                      { id: 'url', label: 'Web URL', icon: Globe },
                      { id: 'paste', label: 'Paste Text', icon: FileText },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setIngestSourceMode(tab.id);
                            setIngestError('');
                          }}
                          className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                            ingestSourceMode === tab.id
                              ? 'bg-white text-[#2D55F5] shadow-2xs border border-slate-200/80'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Channel A: Multi-File Upload */}
                {ingestSourceMode === 'upload' && (
                  <label className="block border-2 border-dashed border-slate-300 hover:border-[#2D55F5] rounded-xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.markdown,.csv,.tsv,.xlsx,.xls,.json,.jsonl,.ndjson,.html,.log"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2D55F5] flex items-center justify-center mx-auto mb-2.5">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Click to upload documents or knowledge tables
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports <code className="font-mono">.md</code>, <code className="font-mono">.txt</code>,{' '}
                      <code className="font-mono">.jsonl</code>, <code className="font-mono">.json</code>,{' '}
                      <code className="font-mono">.csv</code>, and <code className="font-mono">.xlsx</code> (multi-file
                      supported)
                    </p>
                  </label>
                )}

                {/* Channel B: Live Database Table Extraction */}
                {ingestSourceMode === 'db' && (
                  <StudioDatabaseExtractor onExtracted={handleDbExtractedForRag} defaultLimit={1000} compact />
                )}

                {/* Channel C: Public URL Fetcher */}
                {ingestSourceMode === 'url' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Fetch &amp; Chunk Public Documentation or Knowledge URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://docs.yourcompany.com/security-policy"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#2D55F5]"
                      />
                      <button
                        type="button"
                        onClick={handleFetchUrl}
                        disabled={fetchingUrl || !urlInput.trim()}
                        className="px-4 py-2 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{fetchingUrl ? 'Fetching...' : 'Fetch & Stage'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      HTML scripts/styles are stripped automatically and split using your configured chunk size (
                      {ragPolicy.chunkSize} chars).
                    </p>
                  </div>
                )}

                {/* Channel D: Raw Text / Markdown Paste */}
                {ingestSourceMode === 'paste' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                    <input
                      type="text"
                      value={pasteDocTitle}
                      onChange={(e) => setPasteDocTitle(e.target.value)}
                      placeholder="Document identifier (e.g. policy_handbook_v3.md)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#2D55F5]"
                    />
                    <textarea
                      rows={4}
                      value={pasteDocBody}
                      onChange={(e) => setPasteDocBody(e.target.value)}
                      placeholder="Paste raw markdown, customer ticket transcript, or RAG knowledge passage..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#2D55F5]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleStagePastedDoc}
                        disabled={!pasteDocBody.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                      >
                        Add Document to Queue
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Column Mapper for Tabular Uploads / DB Extractions */}
                {tabularBuffer && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Map Text Column from &ldquo;{tabularBuffer.sourceName}&rdquo; (
                        {tabularBuffer.records.length.toLocaleString()} rows)
                      </span>
                      <button
                        type="button"
                        onClick={() => setTabularBuffer(null)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Document Text Column
                        </label>
                        <select
                          value={mappedTextCol}
                          onChange={(e) => setMappedTextCol(e.target.value)}
                          className="w-full h-[34px] px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                        >
                          <option value="">(Serialize all columns as key: value)</option>
                          {tabularBuffer.columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Document ID / Title Column
                        </label>
                        <select
                          value={mappedTitleCol}
                          onChange={(e) => setMappedTitleCol(e.target.value)}
                          className="w-full h-[34px] px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                        >
                          <option value="">(Auto-number rows)</option>
                          {tabularBuffer.columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleConfirmTabularStaging}
                        className="h-[34px] px-3 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold cursor-pointer"
                      >
                        Stage {tabularBuffer.records.length.toLocaleString()} Chunks
                      </button>
                    </div>
                  </div>
                )}

                {ingestError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {ingestError}
                  </div>
                )}
                {ingestNotice && !ingestError && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                    {ingestNotice}
                  </div>
                )}

                {/* Staged Queue Summary */}
                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900">{stagedChunks.length.toLocaleString()}</span>{' '}
                    document/chunk item(s) staged for firewall inspection
                    {stagedChunks.length > 0 && (
                      <span className="text-slate-500 ml-1.5">
                        (
                        {stagedChunks
                          .slice(0, 3)
                          .map((c) => c.docName)
                          .join(', ')}
                        {stagedChunks.length > 3 ? ` +${stagedChunks.length - 3} more` : ''})
                      </span>
                    )}
                  </div>
                  {stagedChunks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setStagedChunks([]);
                        setRagScanResult(null);
                        setIngestNotice('');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Queue</span>
                    </button>
                  )}
                </div>
              </section>

              {/* STEP 2: GUARDRAIL POLICY & RUN */}
              <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                        Step 2 • Policy
                      </span>
                      <h2 className="text-base font-bold text-slate-900">Sanitization &amp; Chunking Rules</h2>
                    </div>
                    <Sliders className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Chunking controls */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer">
                      <span>Auto-split long documents into overlapping chunks</span>
                      <input
                        type="checkbox"
                        checked={ragPolicy.autoChunk}
                        onChange={(e) => setRagPolicy((p) => ({ ...p, autoChunk: e.target.checked }))}
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                    </label>
                    {ragPolicy.autoChunk && (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">Chunk Size (chars)</label>
                          <input
                            type="number"
                            min={200}
                            max={10000}
                            step={100}
                            value={ragPolicy.chunkSize}
                            onChange={(e) => setRagPolicy((p) => ({ ...p, chunkSize: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">Overlap (chars)</label>
                          <input
                            type="number"
                            min={0}
                            max={2000}
                            step={20}
                            value={ragPolicy.chunkOverlap}
                            onChange={(e) => setRagPolicy((p) => ({ ...p, chunkOverlap: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prompt Injection Handling */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Indirect Prompt Injection Handling
                    </label>
                    <select
                      value={ragPolicy.injectionAction}
                      onChange={(e) => setRagPolicy((p) => ({ ...p, injectionAction: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
                    >
                      <option value="quarantine">Quarantine Poisoned Chunk (Exclude from Vector Index)</option>
                      <option value="strip">Surgically Strip Override Directive &amp; Retain Clean Context</option>
                    </select>
                  </div>

                  {/* Redaction Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ragPolicy.redactSecrets}
                        onChange={(e) => setRagPolicy((p) => ({ ...p, redactSecrets: e.target.checked }))}
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>API Keys, Tokens &amp; DB URIs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ragPolicy.redactSsnAndCards}
                        onChange={(e) => setRagPolicy((p) => ({ ...p, redactSsnAndCards: e.target.checked }))}
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>SSNs &amp; Payment Cards</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ragPolicy.redactEmails}
                        onChange={(e) => setRagPolicy((p) => ({ ...p, redactEmails: e.target.checked }))}
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>Email Addresses</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ragPolicy.redactPhones}
                        onChange={(e) => setRagPolicy((p) => ({ ...p, redactPhones: e.target.checked }))}
                        className="rounded border-slate-300 text-[#2D55F5]"
                      />
                      <span>Phone Numbers</span>
                    </label>
                  </div>

                  {/* Custom Redaction Terms */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Custom Confidential Terms to Redact (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={ragPolicy.customRedactionsText}
                      onChange={(e) => setRagPolicy((p) => ({ ...p, customRedactionsText: e.target.value }))}
                      placeholder="e.g. Project Falcon, ACME-INTERNAL-ONLY"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunRagScan}
                  disabled={scanningRag || stagedChunks.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {scanningRag
                      ? 'Scanning & Sanitizing Corpus...'
                      : `Run Pre-Embedding Scan (${stagedChunks.length.toLocaleString()} Staged)`}
                  </span>
                </button>
              </section>
            </div>

            {/* STEP 3 & 4: RESULTS, INTERACTIVE OVERRIDE & OUTPUT DELIVERY */}
            {ragScanResult && (
              <div className="space-y-6">
                {/* Summary KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Chunks Evaluated</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {ragScanResult.totalChunks.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ragScanResult.elapsedMs}ms scan time</p>
                  </div>
                  <div className="bg-white border border-emerald-200 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase">Approved for Embedding</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                      {approvedRagOutputRecords.length.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {ragScanResult.verifiedCount} clean + {ragScanResult.redactedCount} redacted
                    </p>
                  </div>
                  <div className="bg-white border border-blue-200 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-[#2D55F5] uppercase">Redactions Applied</p>
                    <p className="text-2xl font-bold text-[#2D55F5] mt-1">
                      {ragScanResult.totalRedactionsApplied.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Secrets, PII &amp; custom terms</p>
                  </div>
                  <div className="bg-white border border-amber-200 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-amber-700 uppercase">Excluded / Quarantined</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">
                      {quarantinedThreatRecords.length.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Held from vector store</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 col-span-2 md:col-span-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Corpus Trust Health</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{ragScanResult.overallHealth}%</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={ragScanResult.batchSha256Seal}>
                      SHA-256: {ragScanResult.batchSha256Seal.slice(0, 14)}…
                    </p>
                  </div>
                </div>

                {/* Split-Pane Interactive Chunk Inspector & Editor */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                        Step 3 • Inspect &amp; Remediate
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        Chunk-Level Sanitization Diff &amp; Manual Override
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {[
                        { id: 'ALL', label: `All (${ragScanResult.results.length})` },
                        { id: 'VERIFIED', label: `Verified (${ragScanResult.verifiedCount})` },
                        { id: 'REDACTED_PASS', label: `Auto-Redacted (${ragScanResult.redactedCount})` },
                        { id: 'QUARANTINED', label: `Quarantined (${ragScanResult.quarantinedCount})` },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setVerdictFilter(f.id)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            verdictFilter === f.id
                              ? 'bg-[#2D55F5] text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                    {/* Left Chunk Selector List */}
                    <div className="lg:col-span-4 max-h-[460px] overflow-y-auto divide-y divide-slate-100">
                      {filteredScanChunks.map((chk) => {
                        const isSelected = activeChunk?.chunkId === chk.chunkId;
                        const isIncluded = includedChunkIds.has(chk.chunkId);
                        return (
                          <div
                            key={chk.chunkId}
                            onClick={() => setSelectedChunkId(chk.chunkId)}
                            className={`p-3.5 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-slate-900 truncate" title={chk.docName}>
                                {chk.docName}
                              </p>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  chk.verdict === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : chk.verdict === 'REDACTED_PASS'
                                    ? 'bg-blue-50 text-[#2D55F5] border border-blue-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {chk.verdict}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-mono">
                              {editedTextMap[chk.chunkId] ?? chk.sanitizedText}
                            </p>
                            <div className="flex items-center justify-between mt-2 text-[11px]">
                              <span className="text-slate-500">
                                Trust: <strong>{chk.trustScore}/10</strong> • ~{chk.estTokens} tok
                              </span>
                              <label
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={() => toggleIncludeChunk(chk.chunkId)}
                                  className="rounded border-slate-300 text-[#2D55F5]"
                                />
                                <span>{isIncluded ? 'Include in Output' : 'Excluded'}</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Side-by-Side Raw vs Editable Sanitized Output */}
                    <div className="lg:col-span-8 p-5 space-y-4">
                      {activeChunk ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{activeChunk.docName}</h4>
                              <p className="text-[11px] text-slate-500 font-mono">
                                ID: {activeChunk.chunkId} • Entropy: {activeChunk.entropy} bits/char • Seal:{' '}
                                {activeChunk.sha256Seal.slice(0, 16)}…
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleIncludeChunk(activeChunk.chunkId)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                                includedChunkIds.has(activeChunk.chunkId)
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-white border-slate-300 text-slate-700 hover:border-[#2D55F5]'
                              }`}
                            >
                              {includedChunkIds.has(activeChunk.chunkId)
                                ? '✓ Included in Clean Export'
                                : 'Approve & Include in Export'}
                            </button>
                          </div>

                          {activeChunk.violations?.length > 0 && (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1">
                              <p className="text-[11px] font-bold text-amber-900 uppercase">
                                Detected Guardrail Findings ({activeChunk.violations.length})
                              </p>
                              <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
                                {activeChunk.violations.map((v, i) => (
                                  <li key={i}>{v}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                                Raw Ingested Text (Read-Only)
                              </label>
                              <div className="h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-700 whitespace-pre-wrap">
                                {activeChunk.originalText}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-[#2D55F5] uppercase">
                                  Sanitized Output (Editable Override)
                                </label>
                                {editedTextMap[activeChunk.chunkId] !== activeChunk.sanitizedText && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditedTextMap((prev) => ({
                                        ...prev,
                                        [activeChunk.chunkId]: activeChunk.sanitizedText,
                                      }))
                                    }
                                    className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                                  >
                                    Reset edit
                                  </button>
                                )}
                              </div>
                              <textarea
                                value={editedTextMap[activeChunk.chunkId] ?? activeChunk.sanitizedText}
                                onChange={(e) =>
                                  setEditedTextMap((prev) => ({
                                    ...prev,
                                    [activeChunk.chunkId]: e.target.value,
                                  }))
                                }
                                className="w-full h-56 rounded-xl border border-blue-200 bg-white p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#2D55F5]"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">Select a chunk on the left to inspect or edit.</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* STEP 4: EXPORT CLEAN FILES OR COMMIT DIRECTLY TO DATABASE */}
                <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                        Step 4 • Output &amp; Destination Delivery
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        Export Embedding-Ready Corpus or Commit to Target Database
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={approvedRagOutputRecords.length === 0}
                        onClick={() =>
                          exportRecordsToFile(approvedRagOutputRecords, 'datax_verified_rag_chunks', 'jsonl')
                        }
                        className="px-3.5 py-2 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Clean .JSONL ({approvedRagOutputRecords.length})</span>
                      </button>
                      <button
                        type="button"
                        disabled={approvedRagOutputRecords.length === 0}
                        onClick={() =>
                          exportRecordsToFile(approvedRagOutputRecords, 'datax_verified_rag_chunks', 'csv')
                        }
                        className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Clean .CSV</span>
                      </button>
                      <button
                        type="button"
                        disabled={approvedRagOutputRecords.length === 0}
                        onClick={() =>
                          exportRecordsToFile(approvedRagOutputRecords, 'datax_verified_rag_chunks', 'xlsx')
                        }
                        className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .XLSX</span>
                      </button>
                      {quarantinedThreatRecords.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            exportRecordsToFile(quarantinedThreatRecords, 'datax_quarantined_rag_threats', 'csv')
                          }
                          className="px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Quarantine Report .CSV ({quarantinedThreatRecords.length})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <StudioDatabaseCommitPanel
                    records={approvedRagOutputRecords}
                    suggestedTableName="verified_rag_chunks_clean"
                    recordLabel="verified chunks"
                  />
                </section>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: IN-FLIGHT AGENT TOOL-CALL POLICY, VERIFIER & HITL LEDGER     */}
        {/* =================================================================== */}
        {activeTab === 'tool_call' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Persistent Workspace Firewall Policy */}
              <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                      Workspace Guardrail Policy
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Autonomous Tool-Call Enforcement Rules
                    </h2>
                  </div>
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>

                {policyLoading ? (
                  <p className="text-xs text-slate-500">Loading saved workspace policy...</p>
                ) : (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Hard Block Financial Ceiling ($)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={agentPolicy.max_financial_limit}
                          onChange={(e) => setAgentPolicy((p) => ({ ...p, max_financial_limit: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Hold for Human Review (HITL) Above ($)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={agentPolicy.hitl_threshold}
                          onChange={(e) => setAgentPolicy((p) => ({ ...p, hitl_threshold: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Inspected Monetary Argument Keys (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={agentPolicy.financial_fields_text}
                        onChange={(e) => setAgentPolicy((p) => ({ ...p, financial_fields_text: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Forbidden Tool Denylist (comma-separated tool names)
                      </label>
                      <input
                        type="text"
                        value={agentPolicy.blocked_tools_text}
                        onChange={(e) => setAgentPolicy((p) => ({ ...p, blocked_tools_text: e.target.value }))}
                        placeholder="e.g. delete_customer_account, drop_production_index"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Custom Restricted Argument Terms (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={agentPolicy.custom_blocked_terms_text}
                        onChange={(e) => setAgentPolicy((p) => ({ ...p, custom_blocked_terms_text: e.target.value }))}
                        placeholder="e.g. /etc/passwd, internal.corp"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agentPolicy.block_destructive_sql}
                          onChange={(e) => setAgentPolicy((p) => ({ ...p, block_destructive_sql: e.target.checked }))}
                          className="rounded border-slate-300 text-[#2D55F5]"
                        />
                        <span>Block Destructive SQL (DROP / TRUNCATE / DELETE)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agentPolicy.redact_secrets_in_args}
                          onChange={(e) => setAgentPolicy((p) => ({ ...p, redact_secrets_in_args: e.target.checked }))}
                          className="rounded border-slate-300 text-[#2D55F5]"
                        />
                        <span>Auto-Redact API Keys &amp; Credentials</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agentPolicy.redact_pii_in_args}
                          onChange={(e) => setAgentPolicy((p) => ({ ...p, redact_pii_in_args: e.target.checked }))}
                          className="rounded border-slate-300 text-[#2D55F5]"
                        />
                        <span>Auto-Redact SSNs &amp; Payment Cards</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agentPolicy.redact_emails_in_args}
                          onChange={(e) => setAgentPolicy((p) => ({ ...p, redact_emails_in_args: e.target.checked }))}
                          className="rounded border-slate-300 text-[#2D55F5]"
                        />
                        <span>Auto-Redact Email Addresses</span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">
                        {agentPolicy.updatedAt
                          ? `Last saved: ${new Date(agentPolicy.updatedAt).toLocaleString()}`
                          : 'Active workspace policy'}
                      </span>
                      <button
                        type="button"
                        onClick={handleSavePolicy}
                        disabled={policySaving}
                        className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                      >
                        {policySaving ? 'Saving...' : 'Save Workspace Policy'}
                      </button>
                    </div>

                    {policySavedNote && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                        {policySavedNote}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Live Payload Verifier & Batch Agent Log Auditor */}
              <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                      Live Policy Verifier &amp; Trace Auditor
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Test Custom Tool Payload or Audit Agent Trace File
                    </h2>
                  </div>

                  <label className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#2D55F5]" />
                    <span>{batchTraceRunning ? 'Auditing Trace...' : 'Audit Trace (.jsonl / .csv)'}</span>
                    <input
                      type="file"
                      accept=".jsonl,.ndjson,.json,.csv,.xlsx"
                      onChange={handleBatchAgentTraceUpload}
                      disabled={batchTraceRunning}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Agent Identifier</label>
                    <input
                      type="text"
                      value={verifierAgentId}
                      onChange={(e) => setVerifierAgentId(e.target.value)}
                      placeholder="e.g. billing_copilot_prod"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Tool Name</label>
                    <input
                      type="text"
                      value={verifierToolName}
                      onChange={(e) => setVerifierToolName(e.target.value)}
                      placeholder="e.g. stripe_issue_refund"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tool Arguments Payload (JSON)
                  </label>
                  <textarea
                    rows={5}
                    value={verifierArgsJson}
                    onChange={(e) => setVerifierArgsJson(e.target.value)}
                    placeholder={'{\n  "customer_id": "cus_1092",\n  "amount": 250.00\n}'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#2D55F5] focus:bg-white"
                  />
                </div>

                {verifierError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {verifierError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleEvaluateToolCall}
                  disabled={verifierLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{verifierLoading ? 'Evaluating...' : 'Evaluate Tool Call Against Policy'}</span>
                </button>

                {verifierResult && (
                  <div
                    className={`rounded-xl border p-4 space-y-2 ${
                      verifierResult.verdict === 'BLOCK_CRITICAL'
                        ? 'bg-red-50/70 border-red-200'
                        : verifierResult.verdict === 'HOLD_FOR_HITL'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-emerald-50/70 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Verdict: <span className="font-mono">{verifierResult.verdict}</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-600">
                        Risk {verifierResult.riskScore}/10 • {verifierResult.latencyMs}ms
                      </span>
                    </div>
                    {verifierResult.violations?.length > 0 && (
                      <ul className="text-xs text-slate-800 list-disc list-inside space-y-0.5">
                        {verifierResult.violations.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    )}
                    {verifierResult.sanitizedArguments && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-600 mb-1">
                          Sanitized Arguments Returned to Agent Runtime:
                        </p>
                        <pre className="rounded-lg bg-white border border-slate-200 p-2.5 text-[11px] font-mono text-slate-800 overflow-x-auto">
                          {JSON.stringify(verifierResult.sanitizedArguments, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {batchTraceResults.length > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-800">
                      Audited <strong>{batchTraceResults.length}</strong> tool calls from uploaded trace file (
                      {batchTraceResults.filter((r) => r.verdict === 'BLOCK_CRITICAL').length} blocked,{' '}
                      {batchTraceResults.filter((r) => r.verdict === 'HOLD_FOR_HITL').length} held for HITL).
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => exportRecordsToFile(batchTraceResults, 'audited_agent_trace', 'jsonl')}
                        className="px-2.5 py-1 rounded-lg bg-[#2D55F5] text-white text-xs font-semibold cursor-pointer"
                      >
                        Export .JSONL
                      </button>
                      <button
                        type="button"
                        onClick={() => exportRecordsToFile(batchTraceResults, 'audited_agent_trace', 'csv')}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        Export .CSV
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Live Firewall Event Ledger & HITL Approval Queue */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                    PostgreSQL Audit Ledger &amp; HITL Queue
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Live Intercepted Agent Tool Calls ({events.length})
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['ALL', 'HOLD_FOR_HITL', 'BLOCK_CRITICAL', 'ALLOW_REDACTED', 'ALLOW'].map((vf) => (
                    <button
                      key={vf}
                      type="button"
                      onClick={() => setEventFilter(vf)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        eventFilter === vf
                          ? 'bg-[#2D55F5] text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {vf}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={loadFirewallEvents}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                    title="Refresh events"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${eventsLoading ? 'animate-spin' : ''}`} />
                  </button>
                  {events.length > 0 && (
                    <button
                      type="button"
                      onClick={() => exportRecordsToFile(events, 'datax_firewall_events_audit', 'csv')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Audit CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No firewall events matching filter <strong>{eventFilter}</strong>. Evaluate a tool call or integrate
                  the <code className="font-mono">/firewall/intercept</code> webhook to stream live agent decisions.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Agent</th>
                        <th className="py-2.5 px-4">Tool</th>
                        <th className="py-2.5 px-4">Verdict</th>
                        <th className="py-2.5 px-4">Findings</th>
                        <th className="py-2.5 px-4">Latency</th>
                        <th className="py-2.5 px-4 text-right">HITL Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEvents.map((ev) => (
                        <tr key={ev.event_id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : '—'}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{ev.agent_or_source}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-800">{ev.target_tool}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ev.verdict === 'BLOCK_CRITICAL' || ev.verdict === 'REJECTED_BY_HUMAN'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : ev.verdict === 'HOLD_FOR_HITL'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {ev.verdict}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-md truncate" title={ev.violations}>
                            {ev.violations || 'Clean'}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{ev.latency_ms}ms</td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            {ev.verdict === 'HOLD_FOR_HITL' ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={resolvingEventId === ev.event_id}
                                  onClick={() => handleResolveHitlEvent(ev.event_id, 'APPROVE')}
                                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={resolvingEventId === ev.event_id}
                                  onClick={() => handleResolveHitlEvent(ev.event_id, 'REJECT')}
                                  className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400">
                                {ev.sha256_seal ? `${ev.sha256_seal.slice(0, 10)}…` : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: PRODUCTION REST API & SDK INTEGRATION                        */}
        {/* =================================================================== */}
        {activeTab === 'integration' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                    Runtime Guardrail Middleware
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Python / LangChain Agent Tool Interceptor
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('agent_sdk', pythonMiddlewareCode)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSnippet === 'agent_sdk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === 'agent_sdk' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600">
                Enforces your saved workspace policy (Max cap: ${Number(agentPolicy.max_financial_limit).toLocaleString()}
                , HITL: ${Number(agentPolicy.hitl_threshold).toLocaleString()}) synchronously before tool execution.
              </p>
              <pre className="rounded-xl bg-[#0B1226] text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                {pythonMiddlewareCode}
              </pre>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                    Pre-Embedding Ingestion Hook
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Python Vector Indexer Sanitization Hook
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('rag_sdk', pythonRagScanCode)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSnippet === 'rag_sdk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === 'rag_sdk' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600">
                Call prior to <code className="font-mono">openai.embeddings.create()</code> or Pinecone/pgvector upsert
                to guarantee zero poisoned chunks or leaked secrets enter embeddings.
              </p>
              <pre className="rounded-xl bg-[#0B1226] text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                {pythonRagScanCode}
              </pre>
            </section>
          </div>
        )}
      </main>
    </DataXAppShell>
  );
}
