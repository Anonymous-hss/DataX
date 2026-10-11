import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Database, 
  Workflow, 
  Cpu, 
  Layers, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileSpreadsheet, 
  Terminal, 
  ArrowRight, 
  Upload, 
  Download, 
  Eye, 
  Clock, 
  Check, 
  X,
  Code,
  ListFilter,
  Activity,
  Plus,
  Zap,
  Server
} from 'lucide-react';
import { SAP_BW_PROCUREMENT_DATA, SAP_BW_INVENTORY_DATA } from '../../data/sampleDatasets';
import { ONTOLOGY_GRAPH } from '../../data/ontologyGraph';

export default function DataXPoc({ onBackToWebsite }) {
  // State
  const [selectedDatasetKey, setSelectedDatasetKey] = useState('procurement');
  const [currentData, setCurrentData] = useState(SAP_BW_PROCUREMENT_DATA);
  const [activeStepTab, setActiveStepTab] = useState('agent'); // 'sap_bw' | 'agent' | 's4hana' | 'databricks' | 'lineage'
  
  // Pipeline Run State
  const [pipelineStatus, setPipelineStatus] = useState('IDLE'); // 'IDLE' | 'RUNNING' | 'COMPLETED'
  const [agentStepIndex, setAgentStepIndex] = useState(0);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  
  // Rule Engine & Evaluation
  const [activeRules, setActiveRules] = useState([
    { id: 'R01', name: 'Positive Line Quantity', condition: 'QUANTITY > 0', severity: 'CRITICAL', active: true, desc: 'Line item quantity must be greater than zero' },
    { id: 'R02', name: 'Calculation Sanity', condition: 'TOTAL_AMOUNT == QUANTITY * UNIT_PRICE', severity: 'CRITICAL', active: true, desc: 'Total amount equals unit price multiplied by quantity' },
    { id: 'R03', name: 'Mandatory Vendor Code', condition: 'len(VENDOR_ID) > 0', severity: 'CRITICAL', active: true, desc: 'Valid vendor assigned for procurement writeback' },
    { id: 'R04', name: 'Authorized Delivery Plant', condition: "DELIVERY_PLANT in ['P1000', 'P2000', 'P3000']", severity: 'WARNING', active: true, desc: 'Delivery plant matches active S/4HANA plant' },
  ]);
  const [newRuleInput, setNewRuleInput] = useState('');
  
  // Results
  const [passedRecords, setPassedRecords] = useState([]);
  const [quarantinedRecords, setQuarantinedRecords] = useState([]);
  const [s4hanaDispatched, setS4HanaDispatched] = useState(false);
  const [s4hanaDocNumber, setS4HanaDocNumber] = useState('4500019284');

  // Handle Dataset Switching
  const handleDatasetChange = (key) => {
    setSelectedDatasetKey(key);
    if (key === 'procurement') {
      setCurrentData(SAP_BW_PROCUREMENT_DATA);
    } else if (key === 'inventory') {
      setCurrentData(SAP_BW_INVENTORY_DATA);
    }
    resetPipeline();
  };

  // Reset Pipeline
  const resetPipeline = () => {
    setPipelineStatus('IDLE');
    setAgentStepIndex(0);
    setTelemetryLogs([]);
    setPassedRecords([]);
    setQuarantinedRecords([]);
    setS4HanaDispatched(false);
  };

  // Handle Custom Excel File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length > 0) {
          setCurrentData(data);
          setSelectedDatasetKey('custom');
          resetPipeline();
        }
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure it's a valid .xlsx or .csv.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Export current data as Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(currentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SAP_BW_EXTRACT");
    XLSX.writeFile(wb, `datax_${selectedDatasetKey}_export.xlsx`);
  };

  // Run the Agentic Harness (ReAct Loop Simulation)
  const runAgenticPipeline = () => {
    resetPipeline();
    setPipelineStatus('RUNNING');
    setActiveStepTab('agent');

    const logs = [];
    const addLog = (role, message, meta) => {
      const entry = {
        time: new Date().toLocaleTimeString(),
        role,
        message,
        meta
      };
      logs.push(entry);
      setTelemetryLogs([...logs]);
    };

    // Step 1: Agent Initialization
    addLog('AGENT_HARNESS', `[START] Initialized DataX Orchestrator. Processing ${currentData.length} records from SAP BW extraction.`);
    
    setTimeout(() => {
      // Step 2: Ontology Lookup Tool Call
      addLog('THOUGHT', 'Inspecting records for unmapped legacy naming conventions. Location attributes detect legacy strings (Plant-Dallas, Plant-Chicago). Invoking ontology_graph_lookup.');
      
      const transformed = currentData.map((row) => {
        const item = { ...row };
        const plant = item.DELIVERY_PLANT || item.LOCATION;
        if (plant && (plant.startsWith('Plant-') || !plant.startsWith('P'))) {
          const res = ONTOLOGY_GRAPH.lookupPlant(plant);
          if (res.resolved) {
            item.DELIVERY_PLANT = res.sapCode;
            item._ontology_mapped = true;
          }
        }
        return item;
      });

      addLog('TOOL_CALL', 'ontology_graph_lookup(entities=["Plant-Dallas", "Plant-Chicago", "Plant-Atlanta"])', {
        resolvedEntities: [
          { legacy: "Plant-Dallas", sapPlant: "P1000", plantName: "Dallas Precision Operations" },
          { legacy: "Plant-Chicago", sapPlant: "P2000", plantName: "Chicago Central Assembly" },
          { legacy: "Plant-Atlanta", sapPlant: "P3000", plantName: "Atlanta Logistics Hub" },
        ]
      });

      setTimeout(() => {
        // Step 3: Dynamic Rule Synthesizer Tool Call
        addLog('THOUGHT', 'Ontology mapping verified. Step 2: Synthesize domain business validation rules based on business intent.');
        addLog('TOOL_CALL', 'dynamic_rule_synthesizer(intent="Enterprise Procurement & S/4HANA Writeback")', {
          generatedRules: activeRules.filter(r => r.active).map(r => r.name)
        });

        setTimeout(() => {
          // Step 4: Business Rule Evaluator Tool Call
          addLog('THOUGHT', 'Executing business rule evaluator over all records.');
          
          const passed = [];
          const quarantined = [];

          transformed.forEach((row, idx) => {
            const violations = [];
            const qty = Number(row.QUANTITY ?? 0);
            const price = Number(row.UNIT_PRICE ?? 0);
            const total = Number(row.TOTAL_AMOUNT ?? 0);
            const vendor = row.VENDOR_ID ? String(row.VENDOR_ID).trim() : '';
            const plant = row.DELIVERY_PLANT || '';

            // Check Active Rules
            if (activeRules.find(r => r.id === 'R01')?.active && qty <= 0) {
              violations.push(`Rule R01 Violated: Quantity (${qty}) must be positive`);
            }
            if (activeRules.find(r => r.id === 'R02')?.active && Math.abs(qty * price - total) > 0.05) {
              violations.push(`Rule R02 Violated: Total Amount ($${total}) != Qty(${qty}) * Price($${price})`);
            }
            if (activeRules.find(r => r.id === 'R03')?.active && !vendor) {
              violations.push(`Rule R03 Violated: Mandatory Vendor ID missing`);
            }
            if (activeRules.find(r => r.id === 'R04')?.active && !['P1000', 'P2000', 'P3000'].includes(plant)) {
              violations.push(`Rule R04 Violated: Unrecognized delivery plant '${plant}'`);
            }

            if (violations.length > 0) {
              quarantined.push({ ...row, _violations: violations });
            } else {
              passed.push(row);
            }
          });

          setPassedRecords(passed);
          setQuarantinedRecords(quarantined);

          addLog('TOOL_CALL', `business_rule_evaluator(batchSize=${transformed.length})`, {
            passedCount: passed.length,
            quarantinedCount: quarantined.length,
            complianceScore: `${((passed.length / transformed.length) * 100).toFixed(1)}%`
          });

          setTimeout(() => {
            // Step 5: S/4HANA Staging Tool Call
            addLog('THOUGHT', `Validation completed. ${passed.length} compliant records staged for SAP S/4HANA BAPI_PO_CREATE1. ${quarantined.length} records routed to quarantine ledger.`);
            addLog('TOOL_CALL', `s4hana_payload_builder(compliantRecords=${passed.length})`, {
              action: "PO_CREATE",
              targetSystem: "SAP_S4HANA",
              status: "STAGED_FOR_APPROVAL"
            });

            setTimeout(() => {
              // Step 6: Databricks Unity Catalog Writer
              addLog('TOOL_CALL', 'databricks_delta_writer(catalog="retaildata", schema="default", table="sap_bw_modernized_gold")', {
                recordsWritten: passed.length,
                format: "DELTA_LAKE",
                latency: "118ms",
                status: "SYNC_SUCCESSFUL"
              });
              addLog('AGENT_HARNESS', '[SUCCESS] Pipeline completed. S/4HANA payloads staged. Databricks Gold table refreshed.');
              setPipelineStatus('COMPLETED');
            }, 700);

          }, 700);

        }, 700);

      }, 700);

    }, 600);
  };

  // Dispatch S/4HANA Transaction
  const handleDispatchS4Hana = () => {
    setS4HanaDispatched(true);
    setS4HanaDocNumber(String(4500000000 + Math.floor(Math.random() * 900000)));
  };

  // Add Custom Natural Language Rule
  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;

    const newRule = {
      id: `R0${activeRules.length + 1}`,
      name: newRuleInput,
      condition: `custom_eval("${newRuleInput}")`,
      severity: 'WARNING',
      active: true,
      desc: `Synthesized AI rule from prompt: "${newRuleInput}"`
    };
    setActiveRules([...activeRules, newRule]);
    setNewRuleInput('');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Return Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToWebsite}
              className="px-3 py-1.5 rounded-lg glass-panel hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              ← Back to DataGlow.ai
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-400">DataX Platform</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-[10px] border border-blue-500/20">
                Decision Intelligence POC
              </span>
            </div>
          </div>

          {/* Quick Dataset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Dataset:</span>
            <button
              onClick={() => handleDatasetChange('procurement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedDatasetKey === 'procurement' 
                  ? 'bg-blue-600 text-white font-bold shadow-glow-blue' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              SAP BW POs (0PUR_C01)
            </button>
            <button
              onClick={() => handleDatasetChange('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedDatasetKey === 'inventory' 
                  ? 'bg-blue-600 text-white font-bold shadow-glow-blue' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              SAP Stock Extract
            </button>

            {/* Upload Excel */}
            <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              Upload Excel
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Download Excel file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Header for POC */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-[#0c1730] via-[#081024] to-[#070d1d] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
                  INTERACTIVE ENTERPRISE POC
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Simulating Enterprise SAP BW → S/4HANA → Databricks
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                DataX: Autonomous Decision & Transformation Engine
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Observe the complete agentic pipeline: extracts data from <strong className="text-white">SAP BW</strong>, performs semantic business validation via <strong className="text-cyan-400">Agentic Tool Calling</strong>, stages BAPI transactions to <strong className="text-amber-300">SAP S/4HANA</strong>, and synchronizes to <strong className="text-emerald-300">Databricks Delta Lake</strong>.
              </p>
            </div>

            {/* Run Action CTA */}
            <div className="flex items-center gap-3">
              <button
                disabled={pipelineStatus === 'RUNNING'}
                onClick={runAgenticPipeline}
                className={`px-6 py-3.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all shadow-glow-cyan ${
                  pipelineStatus === 'RUNNING'
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white hover:scale-[1.02]'
                }`}
              >
                {pipelineStatus === 'RUNNING' ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-cyan-300" />
                    Agent Harness Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-cyan-200" />
                    Execute DataX Agent Harness
                  </>
                )}
              </button>

              <button
                onClick={resetPipeline}
                className="p-3.5 rounded-xl glass-panel hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Reset Pipeline"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 5 Pipeline Stages Tab Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { key: 'sap_bw', label: '1. SAP BW Extractor', icon: Database, badge: `${currentData.length} Rows` },
            { key: 'agent', label: '2. Agentic Rule Engine', icon: Cpu, badge: pipelineStatus === 'COMPLETED' ? 'Validated' : 'Tool Calling' },
            { key: 's4hana', label: '3. SAP S/4HANA', icon: ShieldCheck, badge: passedRecords.length > 0 ? `${passedRecords.length} Staged` : 'Pending' },
            { key: 'databricks', label: '4. Databricks Lakehouse', icon: Layers, badge: pipelineStatus === 'COMPLETED' ? 'Gold Sync' : 'Unity Catalog' },
            { key: 'lineage', label: '5. End-to-End Lineage', icon: Workflow, badge: 'Full Graph' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeStepTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveStepTab(tab.key)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-slate-900 border-cyan-500/60 shadow-glow-cyan'
                    : 'bg-[#091122]/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isCurrent ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                </div>
                <div className={`text-xs font-bold font-display ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* STAGE 1: SAP BW EXTRACTOR VIEW */}
        {/* ========================================================================= */}
        {activeStepTab === 'sap_bw' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  SAP BW Extraction Dataset Preview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulated SAP InfoCube extract ({selectedDatasetKey === 'procurement' ? '0PUR_C01 Procurement Orders' : '0IC_C03 Inventory Stock'}). Notice deliberate legacy formatting and real-world anomalies.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  Total: <strong className="text-white">{currentData.length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  Deliberate Anomalies: <strong>3</strong>
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#060b17]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Material ID</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Plant Location</th>
                    <th className="p-3">Audit Anomaly Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {currentData.map((row, idx) => {
                    const isQtyAnomaly = Number(row.QUANTITY ?? 0) <= 0;
                    const isCalcAnomaly = Math.abs(Number(row.QUANTITY ?? 0) * Number(row.UNIT_PRICE ?? 0) - Number(row.TOTAL_AMOUNT ?? 0)) > 0.05;
                    const isVendorAnomaly = !row.VENDOR_ID;
                    const isPlantLegacy = row.DELIVERY_PLANT && (row.DELIVERY_PLANT.startsWith('Plant-') || !row.DELIVERY_PLANT.startsWith('P'));
                    const hasAnyAnomaly = isQtyAnomaly || isCalcAnomaly || isVendorAnomaly || isPlantLegacy;

                    return (
                      <tr key={idx} className={`hover:bg-slate-800/40 transition-colors ${hasAnyAnomaly ? 'bg-rose-950/10' : ''}`}>
                        <td className="p-3 text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-white">{row.PO_NUMBER || row.SKU || `ROW-${idx}`}</td>
                        <td className="p-3 text-cyan-300">{row.MATERIAL_ID || row.MATERIAL_DESC || row.SKU}</td>
                        <td className={`p-3 text-right font-bold ${isQtyAnomaly ? 'text-rose-400 bg-rose-500/10 rounded' : 'text-slate-200'}`}>
                          {row.QUANTITY ?? row.CURRENT_STOCK}
                        </td>
                        <td className="p-3 text-right text-slate-300">
                          ${Number(row.UNIT_PRICE ?? row.UNIT_COST ?? 0).toFixed(2)}
                        </td>
                        <td className={`p-3 text-right font-bold ${isCalcAnomaly ? 'text-rose-400 bg-rose-500/10 rounded' : 'text-slate-200'}`}>
                          ${Number(row.TOTAL_AMOUNT ?? 0).toFixed(2)}
                        </td>
                        <td className={`p-3 ${isVendorAnomaly ? 'text-rose-400 italic bg-rose-500/10 rounded' : 'text-slate-300'}`}>
                          {row.VENDOR_ID || row.VENDOR_NAME || 'MISSING'}
                        </td>
                        <td className={`p-3 ${isPlantLegacy ? 'text-amber-400 font-semibold' : 'text-slate-300'}`}>
                          {row.DELIVERY_PLANT || row.LOCATION}
                          {isPlantLegacy && (
                            <span className="ml-1 text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">Legacy string</span>
                          )}
                        </td>
                        <td className="p-3">
                          {row.ANOMALY_FLAG ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {row.ANOMALY_FLAG}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Compliant
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Ready to process. Execute the Agent Harness to initiate dynamic tool calling & ontology resolution.</span>
              </div>
              <button 
                onClick={runAgenticPipeline}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Run Harness
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: AGENTIC HARNESS & RULE ENGINE */}
        {/* ========================================================================= */}
        {activeStepTab === 'agent' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* Left Column: Live Agent Reasoning & Telemetry Trace */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white font-mono">
                      Agentic ReAct Telemetry & Tool Calls
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className={`w-2 h-2 rounded-full ${
                      pipelineStatus === 'RUNNING' ? 'bg-amber-400 animate-ping' : pipelineStatus === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-500'
                    }`} />
                    <span className="text-slate-400">
                      {pipelineStatus === 'RUNNING' ? 'ORCHESTRATING...' : pipelineStatus === 'COMPLETED' ? 'EXECUTION COMPLETED' : 'HARNESS READY'}
                    </span>
                  </div>
                </div>

                {/* Telemetry Stream Console */}
                <div className="mt-4 p-4 rounded-xl bg-[#040813] border border-slate-800 font-mono text-xs space-y-3 h-[420px] overflow-y-auto">
                  {telemetryLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                      <Cpu className="w-8 h-8 text-slate-600 animate-pulse" />
                      <p>Agent harness is idle.</p>
                      <button 
                        onClick={runAgenticPipeline}
                        className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                      >
                        Start Agent Execution
                      </button>
                    </div>
                  ) : (
                    telemetryLogs.map((log, idx) => {
                      let badgeColor = 'bg-slate-800 text-slate-300';
                      if (log.role === 'THOUGHT') badgeColor = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
                      if (log.role === 'TOOL_CALL') badgeColor = 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
                      if (log.role === 'AGENT_HARNESS') badgeColor = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';

                      return (
                        <div key={idx} className="space-y-1 animate-fadeIn">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>[{log.time}]</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold ${badgeColor}`}>
                              {log.role}
                            </span>
                          </div>
                          <div className="text-slate-200 pl-1 leading-relaxed">
                            {log.message}
                          </div>
                          {log.meta && Object.keys(log.meta).length > 0 && (
                            <pre className="p-2 rounded bg-slate-950 text-[10px] text-emerald-300 overflow-x-auto border border-slate-800/80">
                              {JSON.stringify(log.meta, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status footer */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Available Tools:</span>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300">ontology_lookup</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300">rule_synthesizer</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300">bapi_builder</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300">delta_writer</span>
                </div>
              </div>
            </div>

            {/* Right Column: AI Business Rules & Evaluation Breakdown */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Dynamic Business Rules */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Dynamic AI Business Rules
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    {activeRules.filter(r => r.active).length} Active
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeRules.map((rule) => (
                    <div 
                      key={rule.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold text-[10px]">{rule.id}</span>
                          <span className="font-semibold text-white">{rule.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            rule.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {rule.severity}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 bg-slate-950 p-1 rounded">
                          {rule.condition}
                        </div>
                        <div className="text-[11px] text-slate-400">{rule.desc}</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={rule.active}
                        onChange={() => {
                          setActiveRules(activeRules.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
                        }}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 mt-1 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                {/* Add Rule Form */}
                <form onSubmit={handleAddRule} className="pt-2 flex gap-2">
                  <input 
                    type="text" 
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder="e.g. Ensure order discount < 15%"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button 
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Synthesize
                  </button>
                </form>
              </div>

              {/* Evaluation Metrics Card */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                  Rule Evaluation Outcome
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-xl font-bold font-display text-emerald-400">
                      {passedRecords.length}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-300 uppercase mt-0.5">Compliant (Passed)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <div className="text-xl font-bold font-display text-rose-400">
                      {quarantinedRecords.length}
                    </div>
                    <div className="text-[10px] font-mono text-rose-300 uppercase mt-0.5">Quarantined (Violations)</div>
                  </div>
                </div>

                {/* Quarantined Records Inspector */}
                {quarantinedRecords.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-mono text-rose-400 font-semibold">
                      Quarantine Ledger Violations:
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[10px]">
                      {quarantinedRecords.map((q, idx) => (
                        <div key={idx} className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-rose-300">
                          <div>Line Item: {q.PO_NUMBER || q.SKU} - {q.MATERIAL_ID || q.LOCATION}</div>
                          {q._violations?.map((v, vIdx) => (
                            <div key={vIdx} className="text-rose-400 pl-2">↳ {v}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: SAP S/4HANA STAGING & ERP WRITEBACK */}
        {/* ========================================================================= */}
        {activeStepTab === 's4hana' && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-500/30 space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-xs font-bold border border-amber-500/20">
                  STAGE 03 • OPERATIONAL ERP WRITEBACK
                </span>
                <h3 className="text-2xl font-bold text-white font-display mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                  SAP S/4HANA BAPI & OData Dispatch Gate
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Validated purchase orders are staged into official SAP S/4HANA BAPI contracts. Human governance approval safeguards prevent automated erroneous writeback.
                </p>
              </div>

              {/* Approval Dispatch Button */}
              <div>
                {!s4hanaDispatched ? (
                  <button 
                    disabled={passedRecords.length === 0}
                    onClick={handleDispatchS4Hana}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    1-Click Approve & Post to S/4HANA
                  </button>
                ) : (
                  <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 font-bold" />
                    POSTED TO S/4HANA (DOC #{s4hanaDocNumber})
                  </div>
                )}
              </div>
            </div>

            {/* S/4HANA Payload JSON Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Formatted BAPI Contract */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>OUTGOING_BAPI_PAYLOAD.JSON</span>
                  <span className="text-cyan-400 font-bold">BAPI_PO_CREATE1</span>
                </div>
                <pre className="p-4 rounded-xl bg-[#050914] border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto h-[380px]">
                  {JSON.stringify({
                    orderType: "PO_CREATE",
                    targetSystem: "SAP_S4HANA_2023",
                    connectionMethod: "OData / RFC Protocol",
                    stagedTimestamp: new Date().toISOString(),
                    batchSummary: {
                      totalValidItems: passedRecords.length,
                      quarantinedExcluded: quarantinedRecords.length,
                      totalBatchAmountUSD: passedRecords.reduce((acc, r) => acc + Number(r.TOTAL_AMOUNT || 0), 0)
                    },
                    samplePayloadHeader: {
                      companyCode: "1000",
                      purchasingOrg: "PO10",
                      purchasingGroup: "PG1",
                      vendor: passedRecords[0]?.VENDOR_NAME || "Apex Industrial Supply Corp",
                      vendorCode: passedRecords[0]?.VENDOR_ID || "VEND-1001",
                    },
                    lineItems: passedRecords.map((r, i) => ({
                      itemNo: (i + 1) * 10,
                      sku: r.MATERIAL_ID || r.SKU,
                      orderQuantity: r.QUANTITY,
                      unitPrice: r.UNIT_PRICE,
                      netAmount: r.TOTAL_AMOUNT,
                      deliveryPlant: r.DELIVERY_PLANT,
                      storageLocation: r.STORAGE_LOC || "SL01"
                    }))
                  }, null, 2)}
                </pre>
              </div>

              {/* Right Column: Transaction Receipt & Verification */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                    S/4HANA Governance Receipt
                  </h4>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Target System:</span>
                      <span className="text-white font-bold">SAP S/4HANA (OData)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Transaction Status:</span>
                      <span className={s4hanaDispatched ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {s4hanaDispatched ? "CONFIRMED_POSTED" : "AWAITING_APPROVAL"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">SAP Document #:</span>
                      <span className="text-cyan-400 font-bold">
                        {s4hanaDispatched ? s4hanaDocNumber : "STAGED_TEMP"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Response Latency:</span>
                      <span className="text-emerald-400 font-bold">38ms</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Idempotency Key:</span>
                      <span className="text-slate-300 text-[10px]">d9f82a17-3b01-44e2</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    Budget ceiling rule ($500,000 threshold) satisfied. Cryptographic checksum validated.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: DATABRICKS LAKEHOUSE VIEW */}
        {/* ========================================================================= */}
        {activeStepTab === 'databricks' && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-emerald-500/30 space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/20">
                  STAGE 04 • ANALYTICAL LAKEHOUSE SYNC
                </span>
                <h3 className="text-2xl font-bold text-white font-display mt-2 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-emerald-400" />
                  Databricks Unity Catalog & Delta Lake
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Transformed SAP data is persisted into Databricks Delta Lake (<code className="text-emerald-400 font-mono">retaildata.default.sap_bw_modernized_gold</code>) with native types and high-compression Parquet.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  Catalog: <strong className="text-emerald-300">retaildata</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  Format: <strong className="text-emerald-300">DELTA (Parquet)</strong>
                </span>
              </div>
            </div>

            {/* Lakehouse Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-lg font-bold font-display text-emerald-400">{passedRecords.length || currentData.length}</div>
                <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">Rows Ingested</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-lg font-bold font-display text-cyan-400">Snappy / ZSTD</div>
                <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">Parquet Compression</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-lg font-bold font-display text-purple-400">DELIVERY_PLANT</div>
                <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">Partition Key</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-lg font-bold font-display text-blue-400">118ms</div>
                <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">Writeback Latency</div>
              </div>
            </div>

            {/* SQL Explorer preview */}
            <div className="p-4 rounded-xl bg-[#040814] border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                <span>DATABRICKS_SQL_QUERY_EDITOR</span>
                <span className="text-emerald-400">Status: Query Executed (0.04s)</span>
              </div>
              <div className="text-cyan-300">
                SELECT delivery_plant, COUNT(*) as po_count, SUM(total_amount) as total_spend_usd <br />
                FROM retaildata.default.sap_bw_modernized_gold <br />
                GROUP BY delivery_plant ORDER BY total_spend_usd DESC;
              </div>

              {/* Result Preview */}
              <div className="pt-2">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-2">delivery_plant</th>
                      <th className="p-2">po_count</th>
                      <th className="p-2">total_spend_usd</th>
                      <th className="p-2">quality_score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-2 text-white font-bold">P1000 (Dallas)</td>
                      <td className="p-2">4</td>
                      <td className="p-2 text-emerald-400">$16,550.00</td>
                      <td className="p-2">99.4%</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-white font-bold">P2000 (Chicago)</td>
                      <td className="p-2">3</td>
                      <td className="p-2 text-emerald-400">$11,299.00</td>
                      <td className="p-2">98.8%</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-white font-bold">P3000 (Atlanta)</td>
                      <td className="p-2">1</td>
                      <td className="p-2 text-emerald-400">$2,450.00</td>
                      <td className="p-2">100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 5: END-TO-END LINEAGE VIEW */}
        {/* ========================================================================= */}
        {activeStepTab === 'lineage' && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 animate-fadeIn">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-2xl font-bold text-white font-display flex items-center gap-2">
                <Workflow className="w-6 h-6 text-cyan-400" />
                End-to-End Enterprise Lineage Graph
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visualizing complete data provenance from SAP BW extraction through Agentic Validation to S/4HANA transactional and Databricks analytical destinations.
              </p>
            </div>

            {/* Lineage Graph Node Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-[#091224] border border-blue-500/40 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                  <Database className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-sm">SAP BW Extract</div>
                <div className="text-[11px] text-slate-400">InfoCube: 0PUR_C01</div>
                <div className="text-[10px] font-mono text-cyan-400">Extract Batch #9218</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#120f26] border border-purple-500/40 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-sm">DataX Agent Harness</div>
                <div className="text-[11px] text-slate-400">ReAct Tool Calling</div>
                <div className="text-[10px] font-mono text-purple-300">4 Rules Evaluated</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#1c140a] border border-amber-500/40 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-sm">SAP S/4HANA</div>
                <div className="text-[11px] text-slate-400">BAPI Writeback</div>
                <div className="text-[10px] font-mono text-amber-300">DOC #4500019284</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#091b15] border border-emerald-500/40 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-sm">Databricks Lakehouse</div>
                <div className="text-[11px] text-slate-400">Unity Catalog Gold</div>
                <div className="text-[10px] font-mono text-emerald-300">Delta Lake Snappy</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Auditable Meridian Lineage Certificate: <strong>#DL-94810-CERT-OK</strong></span>
              <span className="font-mono text-cyan-400">100% Deterministic Reproducibility</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
