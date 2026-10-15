import React, { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { SAP_BW_PROCUREMENT_DATA, SAP_BW_INVENTORY_DATA } from '../data/sampleDatasets';
import { ONTOLOGY_GRAPH } from '../data/ontologyGraph';

const RuleEngineContext = createContext(null);

export function RuleEngineProvider({ children }) {
  const [selectedDatasetKey, setSelectedDatasetKey] = useState('procurement');
  const [currentData, setCurrentData] = useState(SAP_BW_PROCUREMENT_DATA);
  
  // Pipeline status & telemetry
  const [pipelineStatus, setPipelineStatus] = useState('IDLE'); // 'IDLE' | 'RUNNING' | 'COMPLETED'
  const [agentStepIndex, setAgentStepIndex] = useState(0);
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // Active rules
  const [activeRules, setActiveRules] = useState([
    {
      id: 'R01',
      name: 'Positive Line Quantity',
      condition: 'QUANTITY > 0',
      severity: 'CRITICAL',
      active: true,
      desc: 'Line item quantity must be greater than zero',
      passRate: '98.5%',
    },
    {
      id: 'R02',
      name: 'Calculation Sanity',
      condition: 'TOTAL_AMOUNT == QUANTITY * UNIT_PRICE',
      severity: 'CRITICAL',
      active: true,
      desc: 'Total amount equals unit price multiplied by quantity',
      passRate: '99.2%',
    },
    {
      id: 'R03',
      name: 'Mandatory Vendor Code',
      condition: 'len(VENDOR_ID) > 0',
      severity: 'CRITICAL',
      active: true,
      desc: 'Valid vendor assigned for procurement writeback',
      passRate: '96.4%',
    },
    {
      id: 'R04',
      name: 'Authorized Delivery Plant',
      condition: "DELIVERY_PLANT in ['P1000', 'P2000', 'P3000']",
      severity: 'WARNING',
      active: true,
      desc: 'Delivery plant matches active S/4HANA plant',
      passRate: '88.6%',
    },
  ]);

  // Execution Results
  const [passedRecords, setPassedRecords] = useState([]);
  const [quarantinedRecords, setQuarantinedRecords] = useState([]);
  const [autoFixedRecords, setAutoFixedRecords] = useState([]);
  const [s4hanaDispatched, setS4HanaDispatched] = useState(false);
  const [s4hanaDocNumber, setS4HanaDocNumber] = useState('4500019284');

  // Initial Calculation on Mount
  useEffect(() => {
    evaluateDataLocally(currentData, activeRules);
  }, [currentData, activeRules]);

  const evaluateDataLocally = (data, rules) => {
    const passed = [];
    const quarantined = [];

    data.forEach((row) => {
      const violations = [];
      const qty = Number(row.QUANTITY ?? 0);
      const price = Number(row.UNIT_PRICE ?? 0);
      const total = Number(row.TOTAL_AMOUNT ?? 0);
      const vendor = row.VENDOR_ID ? String(row.VENDOR_ID).trim() : '';

      if (rules.find((r) => r.id === 'R01' && r.active) && qty <= 0) {
        violations.push('QUANTITY must be > 0');
      }
      if (
        rules.find((r) => r.id === 'R02' && r.active) &&
        Math.abs(total - qty * price) > 0.01
      ) {
        violations.push('Total amount mismatch');
      }
      if (rules.find((r) => r.id === 'R03' && r.active) && !vendor) {
        violations.push('Missing vendor code');
      }

      if (violations.length > 0) {
        quarantined.push({ ...row, _violations: violations });
      } else {
        passed.push(row);
      }
    });

    setPassedRecords(passed);
    setQuarantinedRecords(quarantined);
  };

  // Switch Dataset
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
    setS4HanaDispatched(false);
  };

  // Toggle Rule
  const toggleRule = (id) => {
    setActiveRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  // Add Rule
  const addRule = (rule) => {
    setActiveRules((prev) => [
      ...prev,
      {
        id: `R0${prev.length + 1}`,
        active: true,
        passRate: '100%',
        severity: 'CRITICAL',
        ...rule,
      },
    ]);
  };

  // Run the Full Agentic Pipeline (ReAct loop simulation)
  const runAgenticPipeline = (onDone) => {
    resetPipeline();
    setPipelineStatus('RUNNING');
    setAgentStepIndex(1);

    const logs = [];
    const addLog = (role, message, meta) => {
      const entry = {
        time: new Date().toLocaleTimeString(),
        role,
        message,
        meta,
      };
      logs.push(entry);
      setTelemetryLogs([...logs]);
    };

    addLog(
      'AGENT_HARNESS',
      `[START] Initialized DataX Orchestrator. Processing ${currentData.length} records from SAP BW extraction.`
    );

    setTimeout(() => {
      setAgentStepIndex(2);
      addLog(
        'THOUGHT',
        'Inspecting records for unmapped legacy naming conventions. Legacy strings detected. Invoking ontology_graph_lookup.'
      );

      const fixed = [];
      const transformed = currentData.map((row) => {
        const item = { ...row };
        const plant = item.DELIVERY_PLANT || item.LOCATION;
        if (plant && (plant.startsWith('Plant-') || !plant.startsWith('P'))) {
          const res = ONTOLOGY_GRAPH.lookupPlant(plant);
          if (res.resolved) {
            item.DELIVERY_PLANT = res.sapCode;
            item._ontology_mapped = true;
            fixed.push({ ...item, _originalPlant: plant });
          }
        }
        return item;
      });

      setAutoFixedRecords(fixed);
      addLog(
        'TOOL_CALL',
        'ontology_graph_lookup(entities=["Plant-Dallas", "Plant-Chicago", "Plant-Atlanta"])',
        {
          resolvedEntities: [
            { legacy: 'Plant-Dallas', sapPlant: 'P1000', plantName: 'Dallas Precision Operations' },
            { legacy: 'Plant-Chicago', sapPlant: 'P2000', plantName: 'Chicago Central Assembly' },
            { legacy: 'Plant-Atlanta', sapPlant: 'P3000', plantName: 'Atlanta Logistics Hub' },
          ],
        }
      );

      setTimeout(() => {
        setAgentStepIndex(3);
        addLog(
          'THOUGHT',
          'Executing business rule evaluator over all records.'
        );

        evaluateDataLocally(transformed, activeRules);

        setTimeout(() => {
          setAgentStepIndex(4);
          setPipelineStatus('COMPLETED');
          setS4HanaDispatched(true);
          const generatedDoc = '45000' + Math.floor(10000 + Math.random() * 90000);
          setS4HanaDocNumber(generatedDoc);

          addLog(
            'SYSTEM',
            `[SUCCESS] Reconciled orders staged. SAP S/4HANA Writeback completed. Purchase Order Doc: #${generatedDoc}`
          );

          if (onDone) onDone();
        }, 1200);
      }, 1000);
    }, 1000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(passedRecords.length > 0 ? passedRecords : currentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clean_Records');
    XLSX.writeFile(wb, `DataX_${selectedDatasetKey}_Clean_Core.xlsx`);
  };

  const value = {
    selectedDatasetKey,
    currentData,
    activeRules,
    pipelineStatus,
    agentStepIndex,
    telemetryLogs,
    passedRecords,
    quarantinedRecords,
    autoFixedRecords,
    s4hanaDispatched,
    s4hanaDocNumber,
    handleDatasetChange,
    toggleRule,
    addRule,
    resetPipeline,
    runAgenticPipeline,
    handleExportExcel,
  };

  return (
    <RuleEngineContext.Provider value={value}>
      {children}
    </RuleEngineContext.Provider>
  );
}

export function useRuleEngine() {
  const context = useContext(RuleEngineContext);
  if (!context) {
    throw new Error('useRuleEngine must be used within a RuleEngineProvider');
  }
  return context;
}
