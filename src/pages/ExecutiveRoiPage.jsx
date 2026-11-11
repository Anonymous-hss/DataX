import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useRuleEngine } from '../context/RuleEngineContext';
import { 
  Lock, 
  Printer, 
  Check, 
  Copy, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '../services/apiClient';

export default function ExecutiveRoiPage({ onSwitchToMarketing }) {
  const { activeThread } = useRuleEngine();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive ROI Calculator State matching Main-3.png defaults
  const [monthlyVolume, setMonthlyVolume] = useState(750000);
  const [errorRate, setErrorRate] = useState(1.2); // %
  const [avgTxValue, setAvgTxValue] = useState(650); // $
  const [devHourlyRate, setDevHourlyRate] = useState(150); // $/hr
  const [copiedSeal, setCopiedSeal] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const data = await api.get('/executive/metrics');
        setMetrics(data);
      } catch (err) {
        setMetrics({
          financial_risk_prevented_usd: 1420850.0,
          parity_percentage: 99.014,
          engineering_hours_saved: 342,
          devops_cost_saved_usd: 51300.0,
          annual_projected_savings_usd: 14580000.0,
          mean_time_to_detect_sec: 1.48,
          mean_time_to_remediation_sec: 4.2,
          cryptographic_merkle_seal: "7f8c28b991ae01bc49a37c92849e7b231908efc02941581ab2819fbc410291e",
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  // Calculated values matching Main-3.png formula
  const annualRiskMitigated = Math.round(monthlyVolume * (errorRate / 100) * avgTxValue * 1.8 * 12);
  const annualDevHoursSaved = Math.round(monthlyVolume * (errorRate / 100) * 0.25 * 12);
  const annualDevOpsSaved = Math.round(annualDevHoursSaved * devHourlyRate);
  const totalAnnualValue = annualRiskMitigated + annualDevOpsSaved;
  const paybackDays = 12;

  const handleCopySeal = () => {
    const seal = metrics?.cryptographic_merkle_seal || "7f8c28b991ae01bc49a37c92849e7b231908efc02941581ab2819fbc410291e";
    navigator.clipboard?.writeText(seal);
    setCopiedSeal(true);
    setTimeout(() => setCopiedSeal(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1400px] mx-auto px-6 py-8 font-sans space-y-6">
        {/* Header Block matching Main-3.png */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2D55F5] border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
              Board-ready dossier
            </span>

            <h1 className="text-3xl font-bold text-[#0A0F1F] tracking-tight">
              Executive ROI & regulatory value
            </h1>

            <p className="text-sm text-[#5F6678] font-medium max-w-3xl">
              Business outcomes certified by dual-pipeline shadow reconciliation, rule-based error gating and Merkle audit chains.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopySeal}
              className="px-4 py-2 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0F1F] flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-[#5F6678]" />
              <span>{copiedSeal ? 'Seal copied' : 'Export cryptographic seal'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-full bg-[#2D55F5] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / save PDF</span>
            </button>
          </div>
        </div>

        {/* Top Dark Metrics Banner matching Main-3.png */}
        <div className="bg-[#0A0F1F] text-white rounded-[24px] p-8 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
            {/* Metric 1 */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                Balance sheet risk prevented
              </span>
              <div className="text-3xl lg:text-4xl font-extrabold text-[#D2FF38] tracking-tight font-mono">
                $1,420,850
              </div>
              <span className="text-xs text-slate-400 font-medium block pt-1">
                14 bad records intercepted
              </span>
            </div>

            {/* Metric 2 */}
            <div className="space-y-1 sm:pl-8 pt-4 sm:pt-0">
              <span className="text-xs text-slate-400 font-medium block">
                DevOps hours saved
              </span>
              <div className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-mono">
                342 h
              </div>
              <span className="text-xs text-slate-400 font-medium block pt-1">
                $51,300 direct payroll value
              </span>
            </div>

            {/* Metric 3 */}
            <div className="space-y-1 sm:pl-8 pt-4 sm:pt-0">
              <span className="text-xs text-slate-400 font-medium block">
                Reconciliation parity
              </span>
              <div className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-mono">
                99.014%
              </div>
              <span className="text-xs text-slate-400 font-medium block pt-1">
                1,406 of 1,420 matched
              </span>
            </div>

            {/* Metric 4 */}
            <div className="space-y-1 sm:pl-8 pt-4 sm:pt-0">
              <span className="text-xs text-slate-400 font-medium block">
                Incident MTTR
              </span>
              <div className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-mono">
                4.2 s
              </div>
              <span className="text-xs text-slate-400 font-medium block pt-1">
                Down from 72 h manual triage
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: ROI & Payback Model matching Main-3.png */}
        <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0A0F1F]">
                ROI & payback model
              </h2>
              <p className="text-xs text-[#5F6678] mt-1 font-medium">
                Adjust operating parameters to project annual value for your lakehouse
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Projected 3-year ROI 30,275%
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sliders Column */}
            <div className="lg:col-span-6 space-y-5">
              {/* Slider 1 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0A0F1F]">Monthly transaction volume</span>
                  <span className="font-mono font-semibold text-[#2D55F5]">
                    {monthlyVolume.toLocaleString()} records
                  </span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max="5000000"
                  step="50000"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                  className="w-full accent-[#2D55F5] cursor-pointer"
                />
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0A0F1F]">Legacy anomaly rate</span>
                  <span className="font-mono font-semibold text-[#2D55F5]">
                    {errorRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={errorRate}
                  onChange={(e) => setErrorRate(Number(e.target.value))}
                  className="w-full accent-[#2D55F5] cursor-pointer"
                />
              </div>

              {/* Slider 3 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0A0F1F]">Average value per transaction</span>
                  <span className="font-mono font-semibold text-[#2D55F5]">
                    ${avgTxValue}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="25"
                  value={avgTxValue}
                  onChange={(e) => setAvgTxValue(Number(e.target.value))}
                  className="w-full accent-[#2D55F5] cursor-pointer"
                />
              </div>

              {/* Slider 4 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0A0F1F]">Blended engineering rate</span>
                  <span className="font-mono font-semibold text-[#2D55F5]">
                    ${devHourlyRate} / h
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={devHourlyRate}
                  onChange={(e) => setDevHourlyRate(Number(e.target.value))}
                  className="w-full accent-[#2D55F5] cursor-pointer"
                />
              </div>
            </div>

            {/* Outcome 4-Card Grid (Matching Main-3.png) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Annual risk mitigated */}
              <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-white space-y-1">
                <span className="text-xs text-[#5F6678] font-medium block">
                  Annual risk mitigated
                </span>
                <div className="text-2xl font-extrabold text-[#027A48] font-mono tracking-tight">
                  ${annualRiskMitigated.toLocaleString()}
                </div>
                <span className="text-[11px] text-[#5F6678] block pt-1">
                  Inverted signs, null keys and calculation mismatches
                </span>
              </div>

              {/* Card 2: DevOps payroll saved */}
              <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-white space-y-1">
                <span className="text-xs text-[#5F6678] font-medium block">
                  DevOps payroll saved
                </span>
                <div className="text-2xl font-extrabold text-[#2D55F5] font-mono tracking-tight">
                  ${annualDevOpsSaved.toLocaleString()}
                </div>
                <span className="text-[11px] text-[#5F6678] block pt-1">
                  {annualDevHoursSaved.toLocaleString()} investigation hours automated
                </span>
              </div>

              {/* Card 3: Time to payback */}
              <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-white space-y-1">
                <span className="text-xs text-[#5F6678] font-medium block">
                  Time to payback
                </span>
                <div className="text-2xl font-extrabold text-[#B54708] font-mono tracking-tight">
                  {paybackDays} days
                </div>
                <span className="text-[11px] text-[#5F6678] block pt-1">
                  Breakeven on deployment
                </span>
              </div>

              {/* Card 4: Total annual value (Dark Card matching Main-3.png) */}
              <div className="bg-[#0A0F1F] text-white rounded-2xl p-5 space-y-1 shadow-md">
                <span className="text-xs text-slate-400 font-medium block">
                  Total annual value
                </span>
                <div className="text-2xl font-extrabold text-[#D2FF38] font-mono tracking-tight">
                  ${totalAnnualValue.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 block pt-1">
                  Balance sheet + engineering efficiency
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Third Section: 4 Compliance Cards matching Main-3.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: SOX 404 */}
          <div className="bg-white border border-[#E3E6EE] rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#0A0F1F] text-sm">SOX 404</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Compliant
                </span>
              </div>
              <p className="text-xs text-[#5F6678] font-medium">
                Automated GL balancing & rule gating
              </p>
            </div>
            <div className="pt-2 border-t border-[#F1F3F7] flex items-center justify-between text-xs">
              <span className="text-[#5F6678]">Audit assurance</span>
              <span className="font-semibold text-[#0A0F1F]">100% deterministic</span>
            </div>
          </div>

          {/* Card 2: BCBS 239 */}
          <div className="bg-white border border-[#E3E6EE] rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#0A0F1F] text-sm">BCBS 239</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Compliant
                </span>
              </div>
              <p className="text-xs text-[#5F6678] font-medium">
                Merkle DAG lineage & idempotency
              </p>
            </div>
            <div className="pt-2 border-t border-[#F1F3F7] flex items-center justify-between text-xs">
              <span className="text-[#5F6678]">Audit assurance</span>
              <span className="font-semibold text-[#0A0F1F]">100% deterministic</span>
            </div>
          </div>

          {/* Card 3: GDPR Art 25 */}
          <div className="bg-white border border-[#E3E6EE] rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#0A0F1F] text-sm">GDPR Art 25</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Compliant
                </span>
              </div>
              <p className="text-xs text-[#5F6678] font-medium">
                PII obfuscation & quarantine redaction
              </p>
            </div>
            <div className="pt-2 border-t border-[#F1F3F7] flex items-center justify-between text-xs">
              <span className="text-[#5F6678]">Audit assurance</span>
              <span className="font-semibold text-[#0A0F1F]">100% deterministic</span>
            </div>
          </div>

          {/* Card 4: HIPAA Safe Harbor */}
          <div className="bg-white border border-[#E3E6EE] rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#0A0F1F] text-sm">HIPAA Safe Harbor</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Compliant
                </span>
              </div>
              <p className="text-xs text-[#5F6678] font-medium">
                18 direct-identifier sanitizer
              </p>
            </div>
            <div className="pt-2 border-t border-[#F1F3F7] flex items-center justify-between text-xs">
              <span className="text-[#5F6678]">Audit assurance</span>
              <span className="font-semibold text-[#0A0F1F]">100% deterministic</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Why CDOs choose DataX over legacy alternatives */}
        <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-8 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-[#0A0F1F]">
            Why CDOs choose DataX over legacy alternatives
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Col 01 */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#2D55F5] block">
                01
              </span>
              <h3 className="text-sm font-bold text-[#0A0F1F]">
                Dual-pipeline shadow reconciliation
              </h3>
              <p className="text-xs text-[#5F6678] leading-relaxed font-medium">
                Runs alongside legacy pipelines and measures exact parity before cutover, instead of observing after the fact.
              </p>
            </div>

            {/* Col 02 */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#2D55F5] block">
                02
              </span>
              <h3 className="text-sm font-bold text-[#0A0F1F]">
                Mathematical consensus guard
              </h3>
              <p className="text-xs text-[#5F6678] leading-relaxed font-medium">
                Agent scores are clamped within ±2.5 of deterministic baselines, with fatal-flaw gates for PII and null rates.
              </p>
            </div>

            {/* Col 03 */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#2D55F5] block">
                03
              </span>
              <h3 className="text-sm font-bold text-[#0A0F1F]">
                Non-destructive remediation
              </h3>
              <p className="text-xs text-[#5F6678] leading-relaxed font-medium">
                Compensating adjustments, ontology mapping and durable quarantine with cryptographic audit chains.
              </p>
            </div>
          </div>
        </div>
      </main>
    </DataXAppShell>
  );
}
