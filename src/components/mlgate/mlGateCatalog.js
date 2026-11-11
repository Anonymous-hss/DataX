import {
  FileSpreadsheet,
  FileJson,
  Layers,
  Sliders,
  Scale,
  Sparkles,
  Award,
  Database,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Search,
  Filter,
  BarChart3,
  TrendingDown
} from 'lucide-react';

export const ML_GATE_NODE_CATALOG = [
  {
    category: '1. Dataset Ingestion',
    items: [
      {
        type: 'tabular_dataset',
        name: 'Candidate Tabular Training Dataset',
        desc: 'Ingest candidate ML training features from CSV, Parquet, or PostgreSQL',
        system: 'Tabular Ingest',
        icon: FileSpreadsheet,
        variant: 'blue',
        defaultConfig: {
          datasetName: 'credit_risk_applicant_features',
          rowCount: 271,
          features: 'income, credit_score, debt_to_income, loan_amount, target_default'
        }
      },
      {
        type: 'baseline_reference',
        name: 'Golden Baseline Reference Dataset',
        desc: 'Benchmark dataset used to calculate PSI distribution drift (historical golden sample or 70/30 split)',
        system: 'Baseline Gold',
        icon: Database,
        variant: 'blue',
        defaultConfig: {
          splitRatio: 0.30,
          sourceType: 'split_from_candidate'
        }
      },
      {
        type: 'sft_corpus',
        name: 'LLM Fine-Tuning SFT Corpus (JSONL)',
        desc: 'Ingest instruction-tuning prompt & completion pairs for model alignment',
        system: 'JSONL Ingest',
        icon: FileJson,
        variant: 'purple',
        defaultConfig: {
          corpusName: 'enterprise_support_sft_corpus.jsonl',
          promptColumn: 'prompt',
          completionColumn: 'completion',
          sampleCount: 150
        }
      }
    ]
  },
  {
    category: '2. Profiling & Statistical Drift',
    items: [
      {
        type: 'data_profiler',
        name: 'Dataset Profiler & Anomaly Detector',
        desc: 'Compute column cardinality, null missingness %, and IQR outlier boundaries',
        system: 'Data Profiler',
        icon: BarChart3,
        variant: 'blue',
        defaultConfig: {
          missingThreshold: 0.15,
          iqrMultiplier: 1.5
        }
      },
      {
        type: 'psi_drift_gate',
        name: '10-Quantile PSI Population Drift Gate',
        desc: 'Compute 10-bin Population Stability Index against golden baseline. Fails if PSI > 0.25 (EU AI Act Art. 10)',
        system: '10-Bin PSI',
        icon: TrendingDown,
        variant: 'orange',
        defaultConfig: {
          psiThreshold: 0.25,
          alertThreshold: 0.10,
          binningStrategy: 'quantile_10'
        }
      },
      {
        type: 'target_leakage',
        name: 'Pearson Target Leakage Detector',
        desc: 'Detect future-predicting or proxy columns leaking the target variable (|r| >= 0.75)',
        system: 'Pearson Leakage',
        icon: Search,
        variant: 'red',
        defaultConfig: {
          leakageThreshold: 0.75,
          targetColumn: 'target_default'
        }
      }
    ]
  },
  {
    category: '3. Fairness & Deterministic Auto-Repair',
    items: [
      {
        type: 'fairness_parity',
        name: 'Subgroup Parity & Demographic Bias Gate',
        desc: 'Enforce the EEOC 80% Four-Fifths rule across sensitive/protected attributes (age, gender, ethnicity)',
        system: 'Fairness Auditor',
        icon: Scale,
        variant: 'orange',
        defaultConfig: {
          protectedColumn: 'age_group',
          fourFifthsRatio: 0.80
        }
      },
      {
        type: 'auto_repair',
        name: 'Deterministic ML Auto-Repair Engine',
        desc: 'Impute missing values with medians, clip extreme IQR outliers, and drop leaky proxy features',
        system: 'Repair Engine',
        icon: Sparkles,
        variant: 'amber',
        defaultConfig: {
          dropLeakyColumns: true,
          clipOutliers: true,
          medianImpute: true,
          deduplicate: true
        }
      },
      {
        type: 'sft_cleanser',
        name: 'SFT Refusal Stripper & Secret Scrubber',
        desc: 'Strip model hedge prefixes ("As an AI language model..."), scrub PII/secrets, and deduplicate pairs',
        system: 'SFT Cleanser',
        icon: Filter,
        variant: 'purple',
        defaultConfig: {
          stripRefusals: true,
          scrubSecrets: true,
          scrubPii: true,
          deduplicatePairs: true
        }
      }
    ]
  },
  {
    category: '4. Certification & Sinks',
    items: [
      {
        type: 'sha256_cert',
        name: 'Cryptographic SHA-256 Release Card',
        desc: 'Issue an immutable cryptographic certificate sealing dataset distribution and EU AI Act compliance',
        system: 'Release Gate',
        icon: Award,
        variant: 'green',
        defaultConfig: {
          requireZeroPii: true,
          maxPsiAllowed: 0.25,
          signAlgorithm: 'SHA-256'
        }
      },
      {
        type: 'gold_db_sink',
        name: 'Certified Gold Training Database',
        desc: 'Commit cleansed and certified features into local PostgreSQL for GPU cluster ingestion',
        system: 'On-Prem PG',
        icon: Database,
        variant: 'green',
        defaultConfig: {
          targetTable: 'ml_gold_training_set',
          engine: 'postgres'
        }
      },
      {
        type: 'quarantine_dlq',
        name: 'Drift & Leakage Quarantine Store',
        desc: 'Audit isolation store for non-compliant training records and corrupt rows',
        system: 'Dead-Letter',
        icon: AlertTriangle,
        variant: 'red',
        defaultConfig: {
          targetTable: 'ml_quarantined_records'
        }
      }
    ]
  }
];

export const ML_GATE_TEMPLATES = [
  {
    id: 'credit_risk_gate',
    shortLabel: 'Credit risk',
    name: 'Credit Risk & PSI Gate',
    description: 'Ingest candidate tabular features, split baseline reference, compute 10-bin PSI drift, catch target leakage, audit fairness disparity, and issue cryptographic SHA-256 release card.',
    nodes: [
      {
        id: 'node_ml1',
        type: 'tabular_dataset',
        category: 'Ingest',
        title: 'Candidate ingestion',
        system: 'Tabular feature dataset',
        status: 'Demo',
        metaKey: 'Table',
        metaVal: 'credit_risk_appl',
        x: 80,
        y: 240,
        variant: 'blue',
        config: {
          datasetName: 'credit_risk_appl',
          rowCount: 271,
          features: 'income, credit_score, debt_to_income, age_group, target_default'
        }
      },
      {
        id: 'node_ml2',
        type: 'baseline_reference',
        category: 'Baseline',
        title: 'Baseline split',
        system: 'Golden reference slice',
        status: 'Active',
        metaKey: 'Split',
        metaVal: '30 / 70',
        x: 300,
        y: 240,
        variant: 'indigo',
        config: { splitRatio: 0.30 }
      },
      {
        id: 'node_ml3',
        type: 'psi_drift_gate',
        category: 'Drift',
        title: '10-bin PSI drift gate',
        system: 'Covariate drift engine',
        status: 'Armed',
        metaKey: 'Max PSI',
        metaVal: '≤ 0.25',
        x: 530,
        y: 130,
        variant: 'purple',
        config: { psiThreshold: 0.25 }
      },
      {
        id: 'node_ml4',
        type: 'target_leakage',
        category: 'Leakage',
        title: 'Target leakage gate',
        system: 'Pearson correlation audit',
        status: 'Armed',
        metaKey: 'Block',
        metaVal: '|r| ≥ 0.75',
        x: 530,
        y: 360,
        variant: 'purple',
        config: { leakageThreshold: 0.75, targetColumn: 'target_default' }
      },
      {
        id: 'node_ml5',
        type: 'fairness_parity',
        category: 'Fairness',
        title: 'Subgroup fairness gate',
        system: 'EEOC four-fifths audit',
        status: 'Armed',
        metaKey: 'Ratio',
        metaVal: '≥ 0.80',
        x: 760,
        y: 240,
        variant: 'orange',
        config: { protectedColumn: 'age_group', fourFifthsRatio: 0.80 }
      },
      {
        id: 'node_ml6',
        type: 'sha256_cert',
        category: 'Release',
        title: 'SHA-256 release card',
        system: 'EU AI Act Art. 10 ledger',
        status: 'Ready',
        metaKey: 'Table',
        metaVal: 'ml_certification',
        x: 990,
        y: 140,
        variant: 'green',
        config: { signAlgorithm: 'SHA-256' }
      },
      {
        id: 'node_ml7',
        type: 'quarantine_dlq',
        category: 'DLQ',
        title: 'Quarantine store',
        system: 'Drift & leakage isolation',
        status: 'Locked',
        metaKey: 'Table',
        metaVal: 'ml_quarantined_d',
        x: 990,
        y: 340,
        variant: 'orange',
        config: { tableName: 'ml_quarantined_d' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node_ml1', target: 'node_ml2', label: 'Rows', variant: 'blue' },
      { id: 'e2-3', source: 'node_ml2', target: 'node_ml3', label: '10 quantiles', variant: 'blue' },
      { id: 'e2-4', source: 'node_ml2', target: 'node_ml4', label: '', variant: 'blue' },
      { id: 'e3-5', source: 'node_ml3', target: 'node_ml5', label: 'PSI ≤ 0.25', variant: 'blue' },
      { id: 'e4-5', source: 'node_ml4', target: 'node_ml5', label: '', variant: 'blue' },
      { id: 'e5-6', source: 'node_ml5', target: 'node_ml6', label: 'Certified', variant: 'blue' },
      { id: 'e5-7', source: 'node_ml5', target: 'node_ml7', label: 'Violations', variant: 'dashed' }
    ]
  },
  {
    id: 'sft_cleanse_pipeline',
    shortLabel: 'LLM Fine-Tuning SFT',
    name: 'Enterprise LLM Fine-Tuning Corpus Cleanse',
    description: 'Ingest instruction-tuning JSONL pairs, strip AI refusal prefixes ("As an AI..."), scrub PII/secrets, deduplicate, and issue cryptographic release card.',
    nodes: [
      {
        id: 'node_sft1',
        type: 'sft_corpus',
        title: 'SFT JSONL Ingest',
        system: 'Instruction-Tuning Corpus',
        status: 'Demo Sandbox',
        metricLabel: 'support_sft.jsonl',
        x: 60,
        y: 175,
        variant: 'blue',
        config: { corpusName: 'enterprise_support_sft.jsonl', sampleCount: 150 }
      },
      {
        id: 'node_sft2',
        type: 'sft_cleanser',
        title: 'Refusal & PII Cleanser',
        system: 'Strip Hedges & Secrets',
        status: 'Auto-Fix Armed',
        metricLabel: 'Zero-Egress Scrub',
        x: 370,
        y: 175,
        variant: 'purple',
        config: { stripRefusals: true, scrubSecrets: true, scrubPii: true }
      },
      {
        id: 'node_sft3',
        type: 'auto_repair',
        title: 'Pair Deduplicator',
        system: 'Exact & Semantic Dedupe',
        status: 'Active',
        metricLabel: 'Min 8 Chars Check',
        x: 680,
        y: 175,
        variant: 'indigo',
        config: { deduplicate: true }
      },
      {
        id: 'node_sft4',
        type: 'sha256_cert',
        title: 'SHA-256 Release Card',
        system: 'Cryptographic Corpus Seal',
        status: 'Ready to Commit',
        metricLabel: 'sft_gold_release',
        x: 990,
        y: 175,
        variant: 'green',
        config: { signAlgorithm: 'SHA-256' }
      }
    ],
    edges: [
      { id: 'esft1-2', source: 'node_sft1', target: 'node_sft2', label: 'Raw JSONL Pairs', variant: 'blue' },
      { id: 'esft2-3', source: 'node_sft2', target: 'node_sft3', label: 'Sanitized Pairs', variant: 'blue' },
      { id: 'esft3-4', source: 'node_sft3', target: 'node_sft4', label: 'Certified Corpus', variant: 'green' }
    ]
  }
];

