import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  Download,
  Eye,
  Trash2,
  Database,
  Link2,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { fmdApi } from '../../services/apiClient';

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const STATUS_STYLES = {
  VALID: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  REWORK: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
  'FINAL REVIEW': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
};

/**
 * FmdDocumentLibrary - Step 1: Upload FMD, XREF & Source Excel files from computer,
 * load 4 synthetic demo FMDs in one click, or download sample .xlsx files to disk.
 */
export default function FmdDocumentLibrary({
  documents = [],
  xrefs = [],
  sourceDatasets = [],
  designSpecRef = 'TIME_L3_MDA_MT-C_Material_Master_R3.2[21]',
  loading = false,
  onSeedDemo,
  onWorkspaceUpdated,
  onInspectDocument,
  onDeleteDocument,
}) {
  const [uploadingKind, setUploadingKind] = useState('');
  const [uploadBanner, setUploadBanner] = useState('');
  const [showDownloads, setShowDownloads] = useState(false);

  const handleFmdFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingKind('fmd');
    setUploadBanner('');
    try {
      let lastWorkspace = null;
      for (const file of files) {
        const b64 = await readFileAsBase64(file);
        const res = await fmdApi.uploadFmd({ fileName: file.name, contentBase64: b64 });
        lastWorkspace = res.workspace;
      }
      setUploadBanner(`Uploaded ${files.length} FMD workbook(s) from computer and parsed all tabs.`);
      if (onWorkspaceUpdated) await onWorkspaceUpdated(lastWorkspace);
    } catch (err) {
      setUploadBanner(`Upload error: ${err.message}`);
    } finally {
      setUploadingKind('');
      e.target.value = '';
    }
  };

  const handleXrefFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKind('xref');
    setUploadBanner('');
    try {
      const b64 = await readFileAsBase64(file);
      const res = await fmdApi.uploadXref({ fileName: file.name, contentBase64: b64 });
      setUploadBanner(`Uploaded XREF table "${file.name}" (${res.xref?.entry_count || 0} lookup mappings).`);
      if (onWorkspaceUpdated) await onWorkspaceUpdated(res.workspace);
    } catch (err) {
      setUploadBanner(`XREF upload error: ${err.message}`);
    } finally {
      setUploadingKind('');
      e.target.value = '';
    }
  };

  const handleSourceFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKind('source');
    setUploadBanner('');
    try {
      const b64 = await readFileAsBase64(file);
      const res = await fmdApi.uploadSource({ fileName: file.name, contentBase64: b64 });
      setUploadBanner(`Uploaded Source Excel "${file.name}" (${res.source?.record_count || 0} records).`);
      if (onWorkspaceUpdated) await onWorkspaceUpdated(res.workspace);
    } catch (err) {
      setUploadBanner(`Source upload error: ${err.message}`);
    } finally {
      setUploadingKind('');
      e.target.value = '';
    }
  };

  return (
    <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2D55F5] text-white text-[11px] font-bold">1</span>
            <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white tracking-tight">
              Distributed FMD Workbooks, Cross-References &amp; Source Excel Files
            </h2>
          </div>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1">
            Upload multi-tab <span className="font-mono">.xlsx</span> FMDs directly from your computer, or load the 4 synthetic TIME R3.2 replicas (<span className="font-mono">{designSpecRef}</span>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSeedDemo}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D55F5] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#D4FF3A]" />}
            <span>Load 4 Demo FMDs (TIME R3.2)</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F6FA] hover:bg-slate-200/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-[#E3E6EE] dark:border-white/10 text-xs font-semibold text-[#0A0F1F] dark:text-white cursor-pointer transition-colors">
            {uploadingKind === 'fmd' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#2D55F5]" />}
            <span>Upload FMD (.xlsx)</span>
            <input type="file" accept=".xlsx,.xls" multiple onChange={handleFmdFiles} className="hidden" />
          </label>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F6FA] hover:bg-slate-200/70 dark:bg-white/[0.06] border border-[#E3E6EE] dark:border-white/10 text-xs font-semibold text-[#0A0F1F] dark:text-white cursor-pointer transition-colors">
            {uploadingKind === 'xref' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5 text-amber-600" />}
            <span>Upload XREF</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleXrefFile} className="hidden" />
          </label>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F6FA] hover:bg-slate-200/70 dark:bg-white/[0.06] border border-[#E3E6EE] dark:border-white/10 text-xs font-semibold text-[#0A0F1F] dark:text-white cursor-pointer transition-colors">
            {uploadingKind === 'source' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-emerald-600" />}
            <span>Upload Source Excel</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleSourceFile} className="hidden" />
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDownloads((prev) => !prev)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E3E6EE] dark:border-white/10 text-xs font-semibold text-[#5F6678] dark:text-slate-300 hover:text-[#0A0F1F] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample .xlsx</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showDownloads && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E3E6EE] dark:border-white/10 shadow-xl p-2 z-30 space-y-1">
                <a
                  href={fmdApi.getDemoDownloadUrl('all_zip')}
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100"
                >
                  <span>Download All 7 Excel Files (.zip)</span>
                  <Download className="w-3.5 h-3.5" />
                </a>
                {[
                  { key: 'sustain_fmd', label: 'FMD · SUSTAIN R3.2 (.xlsx)' },
                  { key: 'atlas_fmd', label: 'FMD · ATLAS R3.2 (.xlsx)' },
                  { key: 'cons_fmd', label: 'FMD · CONS R3.2 (.xlsx)' },
                  { key: 'cmms_fmd', label: 'FMD · CMMS/MAXIMO R3.2 (.xlsx)' },
                  { key: 'xref_primary', label: 'XREF · Material Description (.xlsx)' },
                  { key: 'source_makt', label: 'Source · BW HANA MAKT (.xlsx)' },
                ].map((item) => (
                  <a
                    key={item.key}
                    href={fmdApi.getDemoDownloadUrl(item.key)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                  >
                    <span className="truncate">{item.label}</span>
                    <Download className="w-3 h-3 shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {uploadBanner && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadBanner}</span>
        </div>
      )}

      {/* Loaded FMD Cards */}
      {documents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#E3E6EE] dark:border-white/10 p-8 text-center">
          <FileSpreadsheet className="w-8 h-8 text-[#2D55F5] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#0A0F1F] dark:text-white">No FMD Workbooks Loaded Yet</p>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1 mb-4">
            Upload your multi-tab Excel FMDs from your computer or click below to load the 4 synthetic TIME R3.2 workbooks.
          </p>
          <button
            type="button"
            onClick={onSeedDemo}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4FF3A]" />
            <span>Load 4 Demo FMDs (SUSTAIN, ATLAS, CONS, CMMS)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {documents.map((doc) => {
            const stStyle = STATUS_STYLES[doc.status] || STATUS_STYLES.VALID;
            return (
              <div
                key={doc.doc_id}
                className="rounded-2xl border border-[#E3E6EE] dark:border-white/[0.08] bg-[#FAFBFD] dark:bg-white/[0.02] p-3.5 flex flex-col justify-between gap-2.5 hover:border-[#2D55F5]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#0A0F1F] text-[#D4FF3A] text-[10px] font-bold tracking-wide">
                      {doc.source_system}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${stStyle}`}>
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#0A0F1F] dark:text-white break-all leading-snug" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-1">
                    {doc.tab_count} Excel tabs · {doc.rule_count} mapping rules
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E3E6EE]/80 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => onInspectDocument(doc.doc_id, 'Field Mapping - MAKT')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D55F5] hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Excel Tabs</span>
                  </button>
                  {onDeleteDocument && (
                    <button
                      type="button"
                      onClick={() => onDeleteDocument(doc.doc_id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove FMD"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Supporting XREF & Source Data Strip */}
      {(xrefs.length > 0 || sourceDatasets.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          <span className="font-bold text-[#5F6678] dark:text-slate-400 uppercase tracking-wider text-[10px]">Supporting Tables:</span>
          {xrefs.map((x) => (
            <span
              key={x.xref_id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 font-medium"
            >
              <Link2 className="w-3 h-3" />
              <span className="truncate max-w-[260px]">{x.table_name}</span>
              <span className="font-bold">({x.entry_count})</span>
            </span>
          ))}
          {sourceDatasets.map((s) => (
            <span
              key={s.source_id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 font-medium"
            >
              <Database className="w-3 h-3" />
              <span className="truncate max-w-[260px]">{s.file_name}</span>
              <span className="font-bold">({s.record_count} rows)</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
