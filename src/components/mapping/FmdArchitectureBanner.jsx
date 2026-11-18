import React from 'react';
import { FileSpreadsheet, Database, ArrowRight, Layers, ShieldAlert, Download } from 'lucide-react';

/**
 * FmdArchitectureBanner - Live visualization of the client's whiteboard diagram:
 * FMDs (1..4) + BW HANA SAP / Excel Source -> Tool X (DataX + Staging Data) -> SAP BODS -> TIME (S/4HANA)
 */
export default function FmdArchitectureBanner({
  docCount = 0,
  xrefCount = 0,
  sourceRecordCount = 0,
  stagedCount = 0,
  errorLogCount = 0,
  onOpenCanvas,
  onExportBods,
}) {
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-[#0B1228] border border-white/10 p-5 sm:p-6 text-white shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#D4FF3A] text-[#0A0F1F] text-[11px] font-bold tracking-tight mb-2.5">
            <span>SAP Material Master · TIME R3.2</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            FMD Mapping Studio &amp; SAP BODS Staging Fabric
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Read multi-tab Excel FMDs across SUSTAIN, ATLAS, CONS &amp; CMMS/MAXIMO, compare field rules like <span className="font-mono text-[#D4FF3A]">MAKT-MAKTX</span>, detect inconsistencies, and stage preload records + <span className="font-mono text-amber-300">Z_ERRORLOG</span> for SAP BODS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenCanvas && (
            <button
              type="button"
              onClick={onOpenCanvas}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Open Visual Canvas Node
            </button>
          )}
          {onExportBods && (
            <button
              type="button"
              onClick={() => onExportBods('xlsx')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4FF3A] hover:bg-[#c8f32e] text-[#0A0F1F] text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export BODS Staging (.xlsx)</span>
            </button>
          )}
        </div>
      </div>

      {/* Architecture Pipeline Strip matching client diagram */}
      <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-2.5 bg-[#0F1733]/90 border border-white/10 rounded-2xl p-3.5">
        {/* Inputs: FMDs + BW HANA / Excel Source */}
        <div className="md:col-span-4 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#152248] border border-blue-400/25">
            <FileSpreadsheet className="w-4 h-4 text-[#D4FF3A] shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-white truncate">
                Functional Mapping Docs (FMDs 1–4)
              </div>
              <div className="text-[10px] text-slate-300 truncate">
                {docCount} Excel workbooks · {xrefCount} XREF tables loaded
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#152248] border border-cyan-400/25">
            <Database className="w-4 h-4 text-cyan-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-white truncate">
                BW HANA SAP / Local Excel Extract
              </div>
              <div className="text-[10px] text-slate-300 truncate">
                {sourceRecordCount} source MAKT / MARC rows ready
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex justify-center md:col-span-1">
          <ArrowRight className="w-4 h-4 text-[#D4FF3A]" />
        </div>

        {/* Center: Tool X (DataX) + Orange Staging Data Badge */}
        <div className="md:col-span-3 p-3 rounded-xl bg-gradient-to-br from-[#1C327A] to-[#132152] border border-blue-400/40 relative">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-4 h-4 text-[#D4FF3A]" />
            <span className="text-xs font-bold text-white">Tool X · DataX Engine</span>
          </div>
          <p className="text-[10px] text-blue-100/80 leading-snug mb-2">
            Multi-tab parser · AI rule consolidator · DuckDB XREF transform
          </p>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#EA580C] text-white text-[10px] font-bold shadow-xs">
            <span>Staging Data: {stagedCount} preload</span>
            {errorLogCount > 0 && (
              <span className="inline-flex items-center gap-0.5 pl-1.5 border-l border-white/30 text-amber-100">
                <ShieldAlert className="w-3 h-3" />
                {errorLogCount} Z_ERRORLOG
              </span>
            )}
          </div>
        </div>

        <div className="hidden md:flex justify-center md:col-span-1">
          <ArrowRight className="w-4 h-4 text-[#D4FF3A]" />
        </div>

        {/* Target: SAP BODS -> TIME (S/4HANA) */}
        <div className="md:col-span-2 p-3 rounded-xl bg-[#112A3A] border border-emerald-400/30 text-center">
          <div className="text-xs font-bold text-emerald-300">SAP BODS</div>
          <div className="text-[10px] text-slate-300 mt-0.5">Load into TIME</div>
          <div className="text-[10px] font-mono text-[#D4FF3A] mt-1">SAP S/4HANA</div>
        </div>
      </div>
    </div>
  );
}
