import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileCode2, 
  Sparkles, 
  FlaskConical, 
  RefreshCw, 
  Check, 
  Zap, 
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useRuleEngine } from '../../context/RuleEngineContext';

export default function TestInSandboxPage({ onNext, onBackToRules }) {
  const { 
    sampleData, 
    sourceConfig, 
    fetchTableSample, 
    autoFixEnabled,
    activeRules 
  } = useRuleEngine();

  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [sampleFilter, setSampleFilter] = useState('live'); // 'live' | 'edge' | 'custom'
  const [sampleCount, setSampleCount] = useState(20);
  const [isFetching, setIsFetching] = useState(false);

  const isSap = sourceConfig?.engine === 'sap_bw';

  // Compute metrics dynamically from sampleData
  const totalRows = sampleData.length;
  const cleanRows = sampleData.filter(r => r._status === 'clean');
  const fixedRows = sampleData.filter(r => r._status === 'fixed');
  const heldRows = sampleData.filter(r => r._status === 'quarantined');
  const passRate = totalRows > 0 ? Math.round(((cleanRows.length + fixedRows.length) / totalRows) * 100) : 0;

  // Filter sample data based on active tab
  const displayedRows = sampleData.filter(r => {
    if (sampleFilter === 'edge') return r._status !== 'clean';
    if (sampleFilter === 'custom') return r._status === 'quarantined';
    return true;
  });

  const currentRow = displayedRows[selectedRowIndex] || displayedRows[0] || sampleData[0] || {};
  const currentTransformed = currentRow._transformed || currentRow;

  // Key fields to display in Before & After
  const comparisonFields = sampleData.length > 0 && Object.keys(sampleData[0]).length > 0
    ? Object.keys(sampleData[0]).filter(k => !k.startsWith('_')).slice(0, 6)
    : (sourceConfig?.discoveredColumns || []).slice(0, 6);

  const handleFetchRows = async (count = sampleCount) => {
    if (!sourceConfig?.table) return;
    setIsFetching(true);
    await fetchTableSample(sourceConfig.table, count);
    setIsFetching(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Main White Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Step Header */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Step 2 of 3 · AI rules</div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">Create rules with AI</h2>
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex items-center gap-2 mt-5">
            <button 
              onClick={onBackToRules}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              Generate rules
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 transition-all shadow-2xs">
              <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
              Test in sandbox
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-mono">
                {sampleData.length} rows
              </span>
            </button>
          </div>
        </div>

        {/* Sandbox Bar */}
        <div className="bg-slate-50/70 px-6 py-3 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100/60 text-blue-700 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 font-mono">
                {sourceConfig?.table || 'source_table'} · {sourceConfig?.database || 'source_db'}
              </div>
              <div className="text-[11px] text-slate-500">Rules run on a live sample. Nothing is written to the target.</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => { setSampleFilter('live'); setSelectedRowIndex(0); }}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  sampleFilter === 'live' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Live rows
              </button>
              <button
                onClick={() => { setSampleFilter('edge'); setSelectedRowIndex(0); }}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  sampleFilter === 'edge' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Edge cases ({fixedRows.length + heldRows.length})
              </button>
              <button
                onClick={() => { setSampleFilter('custom'); setSelectedRowIndex(0); }}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  sampleFilter === 'custom' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Quarantined ({heldRows.length})
              </button>
            </div>

            {/* Counts */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs text-xs font-mono">
              {[5, 20, 100].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => {
                    setSampleCount(cnt);
                    handleFetchRows(cnt);
                  }}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    sampleCount === cnt ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            <button 
              onClick={() => handleFetchRows()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
              Fetch rows
            </button>
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="p-6 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Clean */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Clean
              </div>
              <div className="text-2xl font-bold text-emerald-600 font-display mt-1">{cleanRows.length}</div>
            </div>

            {/* Fixed */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Auto-fixed
              </div>
              <div className="text-2xl font-bold text-blue-600 font-display mt-1">{fixedRows.length}</div>
            </div>

            {/* Held */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Quarantined
              </div>
              <div className="text-2xl font-bold text-amber-600 font-display mt-1">{heldRows.length}</div>
            </div>

            {/* Pass rate */}
            <div className="bg-slate-900 rounded-xl p-3.5 flex flex-col justify-between text-white shadow-2xs">
              <div className="text-xs font-medium text-slate-400">Pass rate</div>
              <div className="text-2xl font-extrabold text-[#a3e635] font-display mt-1 tracking-tight">{passRate}%</div>
            </div>

          </div>
        </div>

        {/* Split View: Sample List & Before/After */}
        {sampleData.length === 0 ? (
          <div className="mx-6 mb-6 p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">No sandbox records loaded</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Configure and test your database connection in Step 1 to load and evaluate live records through your AI rules in sandbox mode.
            </p>
          </div>
        ) : (
          <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (Sample rows) */}
            <div className="lg:col-span-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>Sample rows</span>
                <span>{displayedRows.length} available</span>
              </div>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {displayedRows.map((row, idx) => {
                const isSelected = selectedRowIndex === idx;
                const rowId = row.PO_NUMBER || row.id || `REC-${idx + 1}`;
                const rowLabel = row.MATERIAL_DESC || row.full_name || row.MATERIAL_ID || row.email || row.VENDOR_ID || '';
                
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedRowIndex(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-900 font-mono">{rowId}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{rowLabel}</div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${row.badgeClass || 'bg-slate-100 text-slate-600'}`}>
                      ● {row.badgeText || 'Clean'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Before & After Table */}
          <div className="lg:col-span-8 bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Before and after</h3>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-xs font-medium">
                  {currentRow.PO_NUMBER || currentRow.id || 'Selected Row'}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {activeRules?.filter(r => r.selected !== false).length || 5} rules applied
              </span>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-2 px-3 w-1/4">Field</th>
                    <th className="py-2 px-3 w-3/8">Before</th>
                    <th className="py-2 px-3 w-3/8">After (Clean Core)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {comparisonFields.map(field => {
                    const beforeVal = currentRow[field] !== undefined ? String(currentRow[field]) : '—';
                    const isFixed = currentRow._fixedFields && currentRow._fixedFields[field] !== undefined;
                    const afterVal = isFixed ? String(currentRow._fixedFields[field]) : beforeVal;

                    return (
                      <tr key={field} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 text-slate-600 font-sans font-medium">{field}</td>
                        <td className="py-2.5 px-3">
                          {isFixed ? (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 line-through">
                              "{beforeVal}"
                            </span>
                          ) : (
                            <span className="text-slate-700">"{beforeVal}"</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isFixed ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit font-bold">
                              "{afterVal}"
                              <Check className="w-3 h-3 text-emerald-600" />
                            </span>
                          ) : (
                            <span className="text-slate-700">"{afterVal}"</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Status Alert Banner */}
            {currentRow._status === 'quarantined' ? (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-950">Diverted to quarantine · Target write held</div>
                  <div className="text-xs text-amber-800 mt-0.5 space-y-0.5">
                    {(currentRow._violations || ['Record failed critical business validation']).map((v, i) => (
                      <div key={i}>• {v}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : currentRow._status === 'fixed' ? (
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-900">Auto-fixed by engine · Ready for target</div>
                  <div className="text-xs text-blue-700 mt-0.5">
                    {Object.keys(currentRow._fixedFields || {}).length} field(s) normalized ({Object.keys(currentRow._fixedFields || {}).join(', ')}).
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950">Fully compliant record</div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    All {activeRules?.filter(r => r.selected !== false).length || 5} active rules evaluated successfully.
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
        )}

      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          Pass rate counts clean and auto-fixed rows.
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToRules}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            ← Back to rules
          </button>
          <button
            onClick={onNext}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Use these rules
          </button>
        </div>
      </div>

    </motion.div>
  );
}
