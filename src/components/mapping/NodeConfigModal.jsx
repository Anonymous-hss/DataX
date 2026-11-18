import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Download,
  Send,
  Settings,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  SPREADSHEET_UPLOAD_EXTENSIONS,
  validateUploadFile,
  arrayBufferToBase64,
  saveTempFile,
  updateTempFile,
  deleteTempFile,
  clearTempFiles,
  formatBytes,
} from '../../services/clientTempStorage';
import { fmdApi } from '../../services/apiClient';

/**
 * Parses spreadsheet bytes (.xlsx, .xls, .csv, .tsv, .numbers, .ods) client-side
 * using SheetJS so Apple Numbers, legacy .xls, .csv, and .xlsx all work seamlessly.
 */
function parseSpreadsheetClientSide(uint8Array) {
  const workbook = XLSX.read(uint8Array, { type: 'array' });
  const parsedSheets = {};
  let totalRows = 0;
  let firstColumns = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!matrix || matrix.length === 0) {
      parsedSheets[sheetName] = [];
      continue;
    }

    // Detect best header row within first 8 rows
    let hdrIdx = 0;
    const fmdMarkers = ['UNIQUE_ID', 'TARGET_TABLE', 'TARGET_FIELD_NAME', 'MAPPING_RULE'];
    for (let r = 0; r < Math.min(matrix.length, 8); r += 1) {
      const nonEmpty = matrix[r].filter((c) => String(c || '').trim() !== '');
      const norm = matrix[r].map((c) => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'));
      if (fmdMarkers.filter((m) => norm.includes(m)).length >= 2 || nonEmpty.length >= 2) {
        hdrIdx = r;
        break;
      }
    }

    const headers = matrix[hdrIdx].map((h, i) => {
      const s = String(h || '').trim();
      return s || `Col_${i + 1}`;
    });
    const rows = [];
    for (let r = hdrIdx + 1; r < matrix.length; r += 1) {
      const arr = matrix[r];
      if (!arr || !arr.some((c) => String(c || '').trim() !== '')) continue;
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = arr[i] !== undefined && arr[i] !== null ? arr[i] : '';
      });
      rows.push(obj);
    }

    parsedSheets[sheetName] = rows;
    totalRows += rows.length;
    if (firstColumns.length === 0 && headers.length > 0) {
      firstColumns = headers;
    }
  }

  return {
    parsedSheets,
    sheetNames: workbook.SheetNames,
    columns: firstColumns,
    rowCount: totalRows,
  };
}

export default function NodeConfigModal({
  node,
  onClose,
  onUpdateNode,
  onDeleteNode,
  tempFiles = [],
  onRefreshTempFiles,
  onProcessNodeFiles,
  onCommitTarget,
  onOpenTelemetryTab,
  onNotify,
  xrefEnabled,
  applyCmmsOverride,
  onToggleXref,
  onToggleCmmsOverride,
  isProcessing,
}) {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState(node?.title || '');
  const [host, setHost] = useState(node?.config?.host || '');
  const [table, setTable] = useState(node?.config?.table || '');
  const [writeMode, setWriteMode] = useState(node?.config?.writeMode || 'append');
  const [enforceGate, setEnforceGate] = useState(node?.config?.enforceGate ?? true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const [uploadingLocal, setUploadingLocal] = useState(false);

  if (!node) return null;

  const isUploadNode = node.type === 'file_upload' || node.kind === 'file_upload';
  const isDbSource = node.type === 'source' && !isUploadNode;
  const isTargetNode = node.type === 'target' || node.type === 'bigquery' || node.type === 'pinecone';
  const isRouterNode = node.type === 'router' || node.type === 'conditional';

  const nodeFiles = tempFiles.filter((f) => f.nodeId === node.id);
  const totalBytes = nodeFiles.reduce((acc, f) => acc + (Number(f.size) || 0), 0);

  const handleFilesSelected = async (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    setLocalError('');
    setUploadingLocal(true);
    let savedCount = 0;

    try {
      for (const file of incoming) {
        const check = validateUploadFile(file);
        if (!check.valid) {
          setLocalError(check.error);
          if (onNotify) onNotify({ type: 'error', title: 'Invalid File', message: check.error });
          continue;
        }

        const buffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        let parsedSheets = null;
        let sheetNames = [];
        let columns = [];
        let rowCount = 0;

        if (SPREADSHEET_UPLOAD_EXTENSIONS.includes(check.ext)) {
          try {
            const parsed = parseSpreadsheetClientSide(new Uint8Array(buffer));
            parsedSheets = parsed.parsedSheets;
            sheetNames = parsed.sheetNames;
            columns = parsed.columns;
            rowCount = parsed.rowCount;
          } catch (parseErr) {
            setLocalError(`Could not preview "${file.name}" client-side (${parseErr.message}). It will be parsed on the server.`);
          }
        }

        await saveTempFile({
          nodeId: node.id,
          fileName: file.name,
          ext: check.ext,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          fileRole: node.config?.fileRole || 'auto',
          base64,
          parsedSheets,
          sheetNames,
          columns,
          rowCount,
          syncedToServer: false,
        });
        savedCount += 1;
      }

      await onRefreshTempFiles();
      if (savedCount > 0 && onNotify) {
        onNotify({
          type: 'success',
          title: 'Stored in Client Temp Storage',
          message: `Saved ${savedCount} file(s) locally in browser IndexedDB. Click "Process on Server" or "Test in sandbox" to run.`,
        });
      }
    } catch (err) {
      const msg = err.message || 'Failed to store file in local temporary storage.';
      setLocalError(msg);
      if (onNotify) onNotify({ type: 'error', title: 'Upload Error', message: msg });
    } finally {
      setUploadingLocal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangeFileRole = async (fileId, nextRole) => {
    await updateTempFile(fileId, { fileRole: nextRole, syncedToServer: false });
    await onRefreshTempFiles();
  };

  const handleRemoveFile = async (fileId, fileName) => {
    await deleteTempFile(fileId);
    await onRefreshTempFiles();
    if (onNotify) {
      onNotify({ type: 'info', title: 'Removed from Temp Storage', message: `Deleted "${fileName}" from local browser storage.` });
    }
  };

  const handleClearNodeStorage = async () => {
    await clearTempFiles(node.id);
    await onRefreshTempFiles();
    if (onNotify) {
      onNotify({ type: 'info', title: 'Temp Storage Cleared', message: `Cleared all local temporary files for "${node.title}".` });
    }
  };

  const handleSaveSettings = () => {
    onUpdateNode(node.id, {
      title: title.trim() || node.title,
      config: {
        ...(node.config || {}),
        host: host.trim(),
        table: table.trim(),
        writeMode,
        enforceGate,
      },
    });
    if (onNotify) {
      onNotify({
        type: 'success',
        title: 'Node Configuration Saved',
        message: `Updated settings for "${title.trim() || node.title}".`,
      });
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#18181C] rounded-[24px] border border-[#E2E8F0] dark:border-white/[0.12] shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F1F3F7] dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F0F5FF] dark:bg-[#2D55F5]/20 text-[#2D55F5] flex items-center justify-center shrink-0">
              {isUploadNode ? <Upload className="w-4 h-4" /> : isTargetNode ? <Database className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white truncate">
                Configure · {node.title}
              </h3>
              <p className="text-[11px] text-[#5F6678] dark:text-slate-400">
                {isUploadNode
                  ? 'Upload Excel (.xlsx, .xls), CSV, Apple Numbers (.numbers), JSON, PDF, PPTX, or DOCX via local temporary storage'
                  : `${node.system || node.type} node settings`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Common Node Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Node Display Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] bg-[#F8FAFC] dark:bg-white/[0.04] text-xs font-semibold text-[#0A0F1F] dark:text-white focus:outline-none focus:border-[#2D55F5]"
            />
          </div>

          {localError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localError}</span>
            </div>
          )}

          {/* =================================================================
              UNIVERSAL FILE UPLOAD NODE (Client-Side IndexedDB Temp Storage)
             ================================================================= */}
          {isUploadNode && (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  isDraggingOver
                    ? 'border-[#2D55F5] bg-blue-50/70 dark:bg-blue-950/30'
                    : 'border-[#CDD2DE] dark:border-white/[0.15] bg-[#FAFBFD] dark:bg-white/[0.02] hover:border-[#2D55F5]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_UPLOAD_EXTENSIONS.join(',')}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />
                <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-[#2D55F5]/20 text-[#2D55F5] mx-auto flex items-center justify-center mb-2.5">
                  {uploadingLocal ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </div>
                <div className="text-xs font-bold text-[#0A0F1F] dark:text-white">
                  Drop files here or click to browse from your computer
                </div>
                <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-1">
                  Structured Spreadsheets: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">.xlsx · .xls · .csv · .numbers (Apple) · .ods</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Also accepts .json · .pdf · .pptx · .docx · .txt (max 20 MB per file · stored in browser temporary storage)
                </p>
              </div>

              {/* Client Temp Storage Status Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-[#E3E6EE] dark:border-white/[0.08] text-[11px]">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <HardDrive className="w-3.5 h-3.5 text-[#2D55F5]" />
                  <span>
                    Local Browser Temp Storage: {nodeFiles.length} file(s) · {formatBytes(totalBytes)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <a
                    href={fmdApi.getDemoDownloadUrl('all_zip')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#2D55F5] hover:underline font-semibold"
                    title="Download sample Excel FMD files to your computer so you can upload them here"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download sample .xlsx pack</span>
                  </a>
                  {nodeFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearNodeStorage}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear temp files
                    </button>
                  )}
                </div>
              </div>

              {/* Stored Local Files List */}
              {nodeFiles.length > 0 ? (
                <div className="space-y-2">
                  {nodeFiles.map((f) => {
                    const isSheet = SPREADSHEET_UPLOAD_EXTENSIONS.includes(f.ext);
                    return (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl border border-[#E3E6EE] dark:border-white/[0.1] bg-white dark:bg-[#141418] flex flex-wrap items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                            {isSheet ? (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-[#2D55F5]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0A0F1F] dark:text-white truncate max-w-[260px]">
                              {f.fileName}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
                              <span>{formatBytes(f.size)}</span>
                              {f.sheetNames?.length > 0 && <span>· {f.sheetNames.length} sheet(s)</span>}
                              {f.rowCount > 0 && <span>· {f.rowCount} rows</span>}
                              {f.syncedToServer ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> Processed
                                </span>
                              ) : (
                                <span className="text-amber-600 font-semibold">Pending server run</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={f.fileRole || 'auto'}
                            onChange={(e) => handleChangeFileRole(f.id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-[#CDD2DE] dark:border-white/[0.12] bg-[#F8FAFC] dark:bg-white/[0.04] text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                          >
                            <option value="auto">Auto-detect role</option>
                            <option value="fmd">FMD Mapping Workbook</option>
                            <option value="xref">XREF Lookup Table</option>
                            <option value="source_data">Source Dataset</option>
                            <option value="reference_doc">Reference Document</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(f.id, f.fileName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete from local temporary storage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onProcessNodeFiles(node.id)}
                    className="w-full py-2.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>
                      {isProcessing
                        ? 'Streaming from Temp Storage & Processing on Server...'
                        : `Process ${nodeFiles.length} File(s) on Server Now`}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 text-[11px] text-slate-400">
                  No files stored in local temporary storage for this node yet.
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              DATABASE SOURCE NODE CONFIGURATION
             ================================================================= */}
          {isDbSource && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Connection Host / Endpoint URI
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g. postgresql://user:pass@host:5432/db or https://s4hana.corp.example"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] bg-[#F8FAFC] dark:bg-white/[0.04] text-xs font-mono text-[#0A0F1F] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Source Table / Object / Collection
                </label>
                <input
                  type="text"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  placeholder="e.g. MAKT, MARC, customers, orders"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] bg-[#F8FAFC] dark:bg-white/[0.04] text-xs font-mono text-[#0A0F1F] dark:text-white"
                />
              </div>
            </div>
          )}

          {/* =================================================================
              TARGET / DESTINATION NODE CONFIGURATION
             ================================================================= */}
          {isTargetNode && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Destination Host / Staging Connection URI
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="Leave blank to use active workspace Staging DB (ARC-01)"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] bg-[#F8FAFC] dark:bg-white/[0.04] text-xs font-mono text-[#0A0F1F] dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Target Table Name
                  </label>
                  <input
                    type="text"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder="e.g. time_preload_makt"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] bg-[#F8FAFC] dark:bg-white/[0.04] text-xs font-mono text-[#0A0F1F] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Write Mode
                  </label>
                  <select
                    value={writeMode}
                    onChange={(e) => setWriteMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] bg-[#F8FAFC] dark:bg-white/[0.04] text-xs font-semibold text-[#0A0F1F] dark:text-white"
                  >
                    <option value="append">ARC-01 Safe Append</option>
                    <option value="upsert">Idempotent Upsert</option>
                    <option value="stage_swap">Stage-Then-Swap (Zero Downtime)</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={enforceGate}
                  onChange={(e) => setEnforceGate(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Enforce HITL Controller Gate before committing to target</span>
              </label>

              {onCommitTarget && (
                <button
                  type="button"
                  onClick={() => onCommitTarget(enforceGate)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Push / Commit Processed Batch to {node.system || 'Target'}</span>
                </button>
              )}
            </div>
          )}

          {/* =================================================================
              ROUTER / RULES / HITL / DLQ QUICK CONTROLS
             ================================================================= */}
          {isRouterNode && (
            <div className="space-y-2.5 p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/[0.08]">
              <div className="text-xs font-bold text-[#0A0F1F] dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#2D55F5]" />
                <span>Live XREF &amp; Transformation Switches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onToggleXref}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    xrefEnabled
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  XREF Lookup Override: {xrefEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={onToggleCmmsOverride}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    applyCmmsOverride
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Design-Spec Override: {applyCmmsOverride ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {!isUploadNode && onOpenTelemetryTab && (
            <button
              type="button"
              onClick={() => {
                if (node.type === 'rules') onOpenTelemetryTab('rules');
                else if (node.type === 'hitl') onOpenTelemetryTab('governance');
                else if (isRouterNode) onOpenTelemetryTab('walkthrough');
                else onOpenTelemetryTab('consensus');
                onClose();
              }}
              className="w-full py-2 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] text-xs font-semibold text-[#2D55F5] hover:bg-blue-50/50 cursor-pointer"
            >
              Open Live Results in Telemetry Drawer →
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#F1F3F7] dark:border-white/[0.08] bg-[#FAFBFD] dark:bg-white/[0.02] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onDeleteNode(node.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove node</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.15] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-4 py-1.5 rounded-full bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Save node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
