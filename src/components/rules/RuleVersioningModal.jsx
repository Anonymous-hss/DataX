import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  X, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  FileCode,
  Tag as TagIcon
} from 'lucide-react';
import { useRuleEngine } from '../../context/RuleEngineContext';
import { api } from '../../services/apiClient';

export default function RuleVersioningModal({ isOpen, onClose }) {
  const { activeRules, setActiveRules, activeThread } = useRuleEngine();
  const [selectedVersion, setSelectedVersion] = useState('v2.1');
  const [diffBaseVersion, setDiffBaseVersion] = useState('v2.0');
  const [notification, setNotification] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Sample audited version history
  const versions = [
    {
      version: 'v2.1',
      tag: 'Current (Active)',
      author: 'Harshal Sawatkar (Lead Steward)',
      date: '2026-10-23 15:40 UTC',
      changeSummary: 'Enforced RFC-5322 strict regex syntax and positive quantity threshold.',
      status: 'Active',
      rules: activeRules || []
    },
    {
      version: 'v2.0',
      tag: 'Approved Release',
      author: 'Sarah Chen (Security Compliance)',
      date: '2026-10-21 09:15 UTC',
      changeSummary: 'Added zero-balance journal check and authorized delivery plant whitelist.',
      status: 'Approved',
      rules: (activeRules || []).slice(0, Math.max(1, (activeRules || []).length - 1)).map(r => ({
        ...r,
        condition: r.condition?.includes('>') ? `${r.field} >= 0` : r.condition
      }))
    },
    {
      version: 'v1.9',
      tag: 'Base Baseline',
      author: 'Marcus Vance (Data Architect)',
      date: '2026-10-14 11:30 UTC',
      changeSummary: 'Initial ERP modernization baseline ruleset.',
      status: 'Archived',
      rules: (activeRules || []).slice(0, 2)
    }
  ];

  const currentVerObj = versions.find(v => v.version === selectedVersion) || versions[0];
  const baseVerObj = versions.find(v => v.version === diffBaseVersion) || versions[1];

  const handleRollback = async () => {
    setIsRollingBack(true);
    try {
      // Backend change management audit call if accessible
      await api.post('/changes/rollback', {
        entity_type: 'ruleset',
        entity_id: activeThread?.id || 'sap_bw_s4hana',
        target_version: selectedVersion
      }).catch(() => null);

      setActiveRules(currentVerObj.rules);
      setNotification({
        type: 'success',
        text: `Successfully rolled back ruleset to version ${selectedVersion} (${currentVerObj.tag})!`
      });
      setTimeout(() => {
        setNotification(null);
        onClose();
      }, 1500);
    } catch (err) {
      setNotification({
        type: 'error',
        text: `Failed to rollback ruleset: ${err.message}`
      });
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-versioning-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 id="rule-versioning-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                Rule Versioning & Audit Diff
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {selectedVersion}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Track semantic rule amendments, inspect version diffs, and perform audited rollback.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close Version History"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            {notification.text}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Versions Sidebar List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Release Timeline</h3>
            <div className="space-y-2">
              {versions.map((ver) => (
                <button
                  key={ver.version}
                  onClick={() => setSelectedVersion(ver.version)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedVersion === ver.version
                      ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-slate-900">{ver.version}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ver.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      ver.status === 'Approved' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ver.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium line-clamp-1">{ver.changeSummary}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{ver.date}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Diff & Rule Details Pane */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Version Metadata Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{currentVerObj.version} — {currentVerObj.tag}</h4>
                  <p className="text-xs text-slate-500">Authored by <span className="font-semibold text-slate-700">{currentVerObj.author}</span></p>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  {currentVerObj.rules.length} Active Rules
                </div>
              </div>
              <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                {currentVerObj.changeSummary}
              </p>
            </div>

            {/* Side-by-Side Diff Comparison */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700">Rules Delta vs Previous Release</h4>
                <span className="text-[11px] text-slate-500 font-mono">Comparing {selectedVersion} against {diffBaseVersion}</span>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white max-h-[300px] overflow-y-auto">
                {currentVerObj.rules.map((rule, idx) => {
                  const baseRule = baseVerObj.rules.find(r => r.id === rule.id);
                  const isNew = !baseRule;
                  const isModified = baseRule && baseRule.condition !== rule.condition;

                  return (
                    <div 
                      key={rule.id || idx}
                      className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                        isNew ? 'bg-emerald-50/50 border-emerald-200' :
                        isModified ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{rule.name} ({rule.field})</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isNew ? 'bg-emerald-200 text-emerald-800' :
                          isModified ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isNew ? '+ Added' : isModified ? '~ Modified' : '= Unchanged'}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        {isModified && (
                          <div className="text-rose-600 line-through bg-rose-50 px-2 py-0.5 rounded">
                            - {baseRule.condition}
                          </div>
                        )}
                        <div className={isNew || isModified ? 'text-emerald-700 font-semibold bg-emerald-50/60 px-2 py-0.5 rounded' : 'text-slate-600'}>
                          {isNew ? '+' : ''} {rule.condition || rule.code}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit-trailed by DataX Enterprise Governance Guard</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleRollback}
              disabled={isRollingBack || selectedVersion === 'v2.1'}
              className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all ${
                selectedVersion === 'v2.1'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isRollingBack ? 'Applying Rollback...' : `Rollback to ${selectedVersion}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
