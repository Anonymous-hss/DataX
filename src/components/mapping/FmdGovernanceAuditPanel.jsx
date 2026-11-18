import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Database,
  Lock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Server,
} from 'lucide-react';

const ROLES = [
  'Compliance Controller',
  'Lead Data Engineer',
  'ERP Integration Lead',
  'Read-Only Auditor',
];

/**
 * FmdGovernanceAuditPanel - Phase 2 & Phase 3 Governance Control Tower:
 * - Interactive RBAC Persona selector (verifies 403 block for Read-Only Auditor)
 * - HITL Sign-Off Queue for REWORK & FINAL REVIEW rules
 * - Postgres ARC-01 Staging Commit (TIME_PRELOAD_MAKT, TIME_PRELOAD_MARC, Z_ERRORLOG)
 * - Rule-Filtered SAP BW HANA Subset Extraction
 * - SHA-256 Tamper-Evident Audit Hash Chain + Integrity Verifier
 */
export default function FmdGovernanceAuditPanel({
  activeRole,
  onChangeRole,
  hitlQueue,
  stagingCommits = [],
  auditData,
  busyAction = '',
  actionFeedback = '',
  actionError = '',
  onDecideHitl,
  onCommitStaging,
  onExtractBw,
  onVerifyAudit,
}) {
  const [comments, setComments] = useState({});
  const [enforceGate, setEnforceGate] = useState(true);

  const items = hitlQueue?.items || [];
  const summary = hitlQueue?.summary || {};
  const auditEvents = auditData?.events || [];
  const verification = auditData?.verification || { valid: true, blocks_verified: 0 };

  return (
    <div className="space-y-5">
      {/* Governance Persona & Operational Actions Bar */}
      <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2D55F5]" />
              <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white tracking-tight">
                HITL Governance Sign-Off, RBAC &amp; Postgres ARC-01 Staging Commit
              </h2>
            </div>
            <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1">
              Approve REWORK / FINAL REVIEW rules before materializing staging tables for SAP BODS. Switch to <span className="font-semibold">Read-Only Auditor</span> to test live RBAC HTTP 403 enforcement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">RBAC Persona:</span>
            <select
              value={activeRole}
              onChange={(e) => onChangeRole(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0A0F1F] text-[#D4FF3A] text-xs font-bold cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#0A0F1F] text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Phase 2 & 3 Action Buttons: ARC-01 Postgres Commit + Rule-Filtered BW HANA Extract */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/10">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enforceGate}
              onChange={(e) => setEnforceGate(e.target.checked)}
              className="rounded accent-[#2D55F5]"
            />
            <span>Enforce HITL Gate (Block staging commit while REWORK rules are unapproved)</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onExtractBw('MAKT', 10)}
              disabled={Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#141418] hover:bg-slate-50 border border-[#E3E6EE] dark:border-white/10 text-xs font-bold text-[#0A0F1F] dark:text-white cursor-pointer disabled:opacity-50"
            >
              {busyAction === 'bw' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5 text-[#2D55F5]" />}
              <span>Extract SAP BW HANA Subset (MAKT)</span>
            </button>

            <button
              type="button"
              onClick={() => onCommitStaging(enforceGate)}
              disabled={Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {busyAction === 'commit' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-[#D4FF3A]" />}
              <span>Commit Staging DB (ARC-01)</span>
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {actionError && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* HITL Approval Queue */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              HITL Governance Approval Queue ({items.length})
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                summary.bods_gate_clear
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {summary.bods_gate_clear ? 'BODS Gate: CLEAR' : 'BODS Gate: REWORK Sign-Off Pending'}
            </span>
          </div>

          <div className="space-y-2.5">
            {items.map((item) => (
              <div
                key={item.unique_id}
                className="p-3.5 rounded-2xl border border-[#E3E6EE] dark:border-white/10 bg-[#FAFBFD] dark:bg-white/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#0A0F1F] text-[#D4FF3A] text-[10px] font-bold">
                      {item.source_system}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#2D55F5]">{item.unique_id}</span>
                    <span className="font-mono text-xs font-bold text-[#0A0F1F] dark:text-white">{item.target_key}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      FMD: {item.raw_status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.decision === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.decision === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      HITL: {item.decision}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">{item.exception_note}</p>
                  {item.reviewer && (
                    <p className="text-[10px] text-slate-500">
                      Decided by <strong>{item.reviewer}</strong> ({item.reviewer_role}) {item.comment ? `— "${item.comment}"` : ''}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={comments[item.unique_id] || ''}
                    onChange={(e) => setComments((prev) => ({ ...prev, [item.unique_id]: e.target.value }))}
                    placeholder="Reviewer note..."
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#141418] border border-[#E3E6EE] dark:border-white/10 text-[11px] w-44"
                  />
                  <button
                    type="button"
                    onClick={() => onDecideHitl(item.unique_id, 'APPROVED', comments[item.unique_id] || 'Approved for BODS preload')}
                    disabled={Boolean(busyAction)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecideHitl(item.unique_id, 'REJECTED', comments[item.unique_id] || 'Requires mapping revision')}
                    disabled={Boolean(busyAction)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staging DB Commit Receipts + SHA-256 Audit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Staging Commits */}
        <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#2D55F5]" />
            <span>ARC-01 Staging DB Commit Receipts ({stagingCommits.length})</span>
          </h3>

          {stagingCommits.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No staging commits yet. Approve pending REWORK rules above and click <strong>Commit Staging DB (ARC-01)</strong>.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {stagingCommits.map((c) => (
                <div key={c.commit_id} className="p-3 rounded-xl border border-[#E3E6EE] dark:border-white/10 bg-[#FAFBFD] dark:bg-white/[0.02] space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#2D55F5]">{c.commit_id}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                      {c.mode}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(c.tables || []).map((t) => (
                      <span key={t.table} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-[10px]">
                        {t.table}: <strong>{t.rows}</strong>
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate" title={c.sha256_receipt}>
                    SHA-256: {c.sha256_receipt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SHA-256 Audit Hash Chain */}
        <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>SHA-256 Tamper-Evident Audit Ledger ({auditEvents.length})</span>
            </h3>
            <button
              type="button"
              onClick={onVerifyAudit}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{verification.valid ? `Chain Valid (${verification.blocks_verified} blocks)` : 'Tamper Alert'}</span>
            </button>
          </div>

          {auditEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              Governance actions (R3.3 diffs, HITL approvals, BW extractions, ARC-01 staging commits) are cryptographically chained here.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {auditEvents.map((ev) => (
                <div key={ev.event_id} className="p-2.5 rounded-xl border border-[#E3E6EE] dark:border-white/10 bg-[#FAFBFD] dark:bg-white/[0.02] text-[11px] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#0A0F1F] dark:text-white">
                      #{ev.seq} · {ev.action}
                    </span>
                    <span className="text-[10px] text-slate-500">{ev.role}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{ev.summary}</p>
                  <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 truncate" title={ev.block_hash}>
                    seal: {ev.block_hash}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
