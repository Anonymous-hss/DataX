import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileCode2, 
  Sparkles, 
  FlaskConical, 
  RefreshCw, 
  Check, 
  Zap, 
  AlertCircle 
} from 'lucide-react';

export default function TestInSandboxPage({ onNext, onBackToRules }) {
  const [selectedRowId, setSelectedRowId] = useState('usr_104');
  const [sampleFilter, setSampleFilter] = useState('live');
  const [sampleCount, setSampleCount] = useState(20);

  const sampleRows = [
    { 
      id: 'usr_101', 
      name: 'Sarah Jenkins', 
      email: 'sarah.j@acme.com', 
      role: 'member', 
      status: 'active', 
      badgeText: 'Clean', 
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    },
    { 
      id: 'usr_102', 
      name: 'malformed.email@bad_domain', 
      email: 'malformed.email@bad_domain', 
      role: 'analyst', 
      status: 'active', 
      badgeText: 'Quarantined', 
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' 
    },
    { 
      id: 'usr_103', 
      name: 'Marcus Vance', 
      email: 'm.vance@acme.com', 
      role: 'admin', 
      status: 'active', 
      badgeText: 'Clean', 
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    },
    { 
      id: 'usr_104', 
      name: 'Elena Rostova', 
      email: '-Elena.Rostova@ACME.com-', 
      fixedEmail: 'elena.rostova@acme.com', 
      role: 'Admin*', 
      fixedRole: 'admin', 
      status: 'active', 
      badgeText: 'Auto-fixed', 
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' 
    },
    { 
      id: 'usr_105', 
      name: 'David Kim', 
      email: 'david.kim+test@acme.com', 
      fixedEmail: 'david.kim@acme.com', 
      role: 'Manager ', 
      fixedRole: 'manager', 
      status: 'active', 
      badgeText: 'Auto-fixed', 
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' 
    },
  ];

  const currentRow = sampleRows.find(r => r.id === selectedRowId) || sampleRows[3];

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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              Generate rules
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 transition-all shadow-2xs">
              <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
              Test in sandbox
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-mono">20 rows</span>
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
              <div className="text-xs font-bold text-slate-900 font-mono">raw_source_users · production_db</div>
              <div className="text-[11px] text-slate-500">Rules run on a sample. Nothing is written to the target.</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => setSampleFilter('live')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  sampleFilter === 'live' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Live rows
              </button>
              <button
                onClick={() => setSampleFilter('edge')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  sampleFilter === 'edge' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Edge cases
              </button>
              <button
                onClick={() => setSampleFilter('custom')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  sampleFilter === 'custom' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Custom record
              </button>
            </div>

            {/* Counts */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs text-xs font-mono">
              {[5, 20, 100].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setSampleCount(cnt)}
                  className={`px-2 py-1 rounded transition-colors ${
                    sampleCount === cnt ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
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
              <div className="text-2xl font-bold text-emerald-600 font-display mt-1">14</div>
            </div>

            {/* Fixed */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Fixed
              </div>
              <div className="text-2xl font-bold text-blue-600 font-display mt-1">4</div>
            </div>

            {/* Held */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Held
              </div>
              <div className="text-2xl font-bold text-amber-600 font-display mt-1">2</div>
            </div>

            {/* Pass rate */}
            <div className="bg-slate-900 rounded-xl p-3.5 flex flex-col justify-between text-white shadow-2xs">
              <div className="text-xs font-medium text-slate-400">Pass rate</div>
              <div className="text-2xl font-extrabold text-[#a3e635] font-display mt-1 tracking-tight">90%</div>
            </div>

          </div>
        </div>

        {/* Split View: Sample List & Before/After */}
        <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (Sample rows) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Sample rows</span>
              <span>5 of 20</span>
            </div>

            <div className="space-y-1.5">
              {sampleRows.map(row => {
                const isSelected = selectedRowId === row.id;
                return (
                  <div
                    key={row.id}
                    onClick={() => setSelectedRowId(row.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-mono">{row.id}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{row.name}</div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${row.badgeClass}`}>
                      ● {row.badgeText}
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
                  {currentRow.id}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">5 rules applied</span>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-2 px-3 w-1/4">Field</th>
                    <th className="py-2 px-3 w-3/8">Before</th>
                    <th className="py-2 px-3 w-3/8">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  
                  {/* Email */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-slate-600 font-sans font-medium">email</td>
                    <td className="py-2.5 px-3">
                      {currentRow.fixedEmail ? (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 line-through">
                          "{currentRow.email}"
                        </span>
                      ) : (
                        <span className="text-slate-700">"{currentRow.email}"</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {currentRow.fixedEmail ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          "{currentRow.fixedEmail}"
                          <Check className="w-3 h-3 text-emerald-600" />
                        </span>
                      ) : (
                        <span className="text-slate-700">"{currentRow.email}"</span>
                      )}
                    </td>
                  </tr>

                  {/* Full name */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-slate-600 font-sans font-medium">full_name</td>
                    <td className="py-2.5 px-3 text-slate-700">"{currentRow.name}"</td>
                    <td className="py-2.5 px-3 text-slate-700">"{currentRow.name}"</td>
                  </tr>

                  {/* Role */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-slate-600 font-sans font-medium">role</td>
                    <td className="py-2.5 px-3">
                      {currentRow.fixedRole ? (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 line-through">
                          "{currentRow.role}"
                        </span>
                      ) : (
                        <span className="text-slate-700">"{currentRow.role}"</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {currentRow.fixedRole ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          "{currentRow.fixedRole}"
                          <Check className="w-3 h-3 text-emerald-600" />
                        </span>
                      ) : (
                        <span className="text-slate-700">"{currentRow.role}"</span>
                      )}
                    </td>
                  </tr>

                  {/* Status */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-slate-600 font-sans font-medium">status</td>
                    <td className="py-2.5 px-3 text-slate-700">"{currentRow.status}"</td>
                    <td className="py-2.5 px-3 text-slate-700">"{currentRow.status}"</td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Alert banner */}
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-900">Auto-fixed · ready for the target</div>
                <div className="text-xs text-blue-700 mt-0.5">
                  2 fields changed by "Email has a valid format" and "Role is an allowed value".
                </div>
              </div>
            </div>

          </div>

        </div>

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
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            ← Back to rules
          </button>
          <button
            onClick={onNext}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Use these rules
          </button>
        </div>
      </div>

    </motion.div>
  );
}
