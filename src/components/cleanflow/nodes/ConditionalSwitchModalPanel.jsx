import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Conditional Router — Settings Panel
 * Routes data rows either to the TRUE path or FALSE / Default path
 * based on a condition the user defines (e.g. "Amount > 50000").
 * Exactly 2 outputs: TRUE branch and FALSE/Else branch.
 */
export default function ConditionalSwitchModalPanel({
  conditionField = 'TOTAL_AMOUNT',
  onConditionFieldChange,
  conditionOp = '>',
  onConditionOpChange,
  conditionVal = '50000',
  onConditionValChange,
  trueDest = 'High-Value Review',
  onTrueDestChange,
  falseDest = 'Standard Flow',
  onFalseDestChange
}) {
  // Expose a synthetic branches array for backward compat with save handler
  const conditionLabel = `${conditionField} ${conditionOp} ${conditionVal}`;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="p-3.5 bg-violet-50/70 border border-violet-200 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
          <GitBranch className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-violet-950">Conditional Router (If / Else)</h4>
          <p className="text-[11px] text-violet-700 mt-0.5">
            Splits your data into two paths based on one condition. Records where the condition is <strong>TRUE</strong> go one way; all others go the <strong>FALSE / Default</strong> path.
          </p>
        </div>
      </div>

      {/* Visual diagram */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 text-center">
          Input Record
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <div className="px-3 py-1.5 rounded-lg bg-violet-100 border border-violet-300 text-xs font-bold text-violet-900 text-center">
          IF condition
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
            <span className="px-2 py-1 rounded-md bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> TRUE Path
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> FALSE Path
            </span>
          </div>
        </div>
      </div>

      {/* Condition builder */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <label className="block text-xs font-bold text-slate-800">Define the Condition</label>
        <p className="text-[11px] text-slate-500 -mt-2">Build a simple rule: [Column] [is / is greater than / equals] [Value]</p>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Column</label>
            <select
              value={conditionField}
              onChange={(e) => onConditionFieldChange?.(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 cursor-pointer"
            >
              <option value="TOTAL_AMOUNT">TOTAL_AMOUNT</option>
              <option value="DELIVERY_PLANT">DELIVERY_PLANT</option>
              <option value="QUANTITY">QUANTITY</option>
              <option value="STATUS">STATUS</option>
              <option value="ANNUAL_REVENUE">ANNUAL_REVENUE</option>
              <option value="VENDOR_NAME">VENDOR_NAME</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Operator</label>
            <select
              value={conditionOp}
              onChange={(e) => onConditionOpChange?.(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 cursor-pointer"
            >
              <option value=">">&gt; Greater than</option>
              <option value="<">&lt; Less than</option>
              <option value="==">== Equals</option>
              <option value="!=">!= Not equal</option>
              <option value="contains">contains</option>
              <option value="is_empty">is empty</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Value</label>
            <input
              type="text"
              value={conditionVal}
              onChange={(e) => onConditionValChange?.(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
            />
          </div>
        </div>

        {/* Live preview of condition */}
        <div className="px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 text-xs font-mono text-violet-900">
          IF  <strong>{conditionLabel}</strong>  →  TRUE Path  |  else  →  FALSE Path
        </div>
      </div>

      {/* Output destination labels */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <label className="text-xs font-bold text-emerald-900">TRUE Path Label</label>
          </div>
          <input
            type="text"
            value={trueDest}
            onChange={(e) => onTrueDestChange?.(e.target.value)}
            placeholder="e.g. High-Value Review"
            className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800"
          />
          <p className="text-[10px] text-emerald-700">Records WHERE condition is true</p>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-xs font-bold text-slate-700">FALSE / Default Path Label</label>
          </div>
          <input
            type="text"
            value={falseDest}
            onChange={(e) => onFalseDestChange?.(e.target.value)}
            placeholder="e.g. Standard Flow"
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
          />
          <p className="text-[10px] text-slate-500">All other records</p>
        </div>
      </div>

    </div>
  );
}
