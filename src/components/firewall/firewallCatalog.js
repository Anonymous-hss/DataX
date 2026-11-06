import {
  FileText,
  Database,
  Globe,
  Bot,
  ShieldAlert,
  Lock,
  EyeOff,
  Split,
  DollarSign,
  UserCheck,
  GitBranch,
  Layers,
  FileCheck2,
  AlertTriangle,
  Play
} from 'lucide-react';

export const FIREWALL_NODE_CATALOG = [
  {
    category: '1. Ingestion Sources',
    items: [
      {
        type: 'file_doc',
        name: 'Document & Knowledge File Reader',
        desc: 'Extract text from PDF, DOCX, TXT, or Markdown documents',
        system: 'File Parser',
        icon: FileText,
        variant: 'blue',
        defaultConfig: {
          sampleDoc: 'Vendor_Master_Contract_2026.pdf',
          sampleText: 'This agreement entered into by Harshal (SSN: 987-65-4321, harshal@enterprise.internal) contains proprietary OpenAI key sk-live-9482019482019482014820 and database uri postgresql://admin:secretPass@127.0.0.1:5432/datax.',
          maxBytes: 10485760
        }
      },
      {
        type: 'db_source',
        name: 'Database Column Extractor',
        desc: 'Extract unstructured text chunks or agent logs from PostgreSQL or MongoDB',
        system: 'DB Extractor',
        icon: Database,
        variant: 'blue',
        defaultConfig: {
          engine: 'postgres',
          table: 'master_knowledge_docs',
          textColumn: 'body',
          limit: 100
        }
      },
      {
        type: 'web_crawler',
        name: 'Web & API Documentation Crawler',
        desc: 'Fetch public URLs or internal wiki pages with semantic tag strip',
        system: 'Web Crawler',
        icon: Globe,
        variant: 'blue',
        defaultConfig: {
          url: 'https://docs.datax.internal/api/security',
          stripNavAndFooter: true
        }
      },
      {
        type: 'agent_telemetry',
        name: 'Agent Live Tool Call Interceptor',
        desc: 'Synchronously capture in-flight tool calls (Stripe refund, SQL drop, AWS API)',
        system: 'In-Flight Hook',
        icon: Bot,
        variant: 'purple',
        defaultConfig: {
          agentName: 'support_bot_v2',
          targetTool: 'stripe_refund',
          sampleArgs: JSON.stringify({ amount: 1200, user_id: 'usr_84920', reason: 'customer disputed charge' }, null, 2)
        }
      }
    ]
  },
  {
    category: '2. Inspection & Scrubbers',
    items: [
      {
        type: 'prompt_injection',
        name: 'Prompt Injection & Jailbreak Guard',
        desc: 'Detect DAN, system-override, exfiltration, and adversarial escape payloads (<5ms AST scan)',
        system: 'AST Heuristic',
        icon: ShieldAlert,
        variant: 'red',
        defaultConfig: {
          action: 'quarantine', // 'quarantine' | 'strip' | 'flag'
          sensitivity: 0.85
        }
      },
      {
        type: 'secret_scrubber',
        name: 'API Key & Credential Scrubber',
        desc: 'Redact OpenAI, AWS, GitHub PATs, JWT bearer tokens, and high-entropy secrets',
        system: 'Entropy + Regex',
        icon: Lock,
        variant: 'amber',
        defaultConfig: {
          redactOpenAi: true,
          redactAws: true,
          redactJwt: true,
          redactDbUri: true,
          entropyThreshold: 4.2
        }
      },
      {
        type: 'pii_scrubber',
        name: 'PII Scrubbing & Masking Engine',
        desc: 'Deterministic masking of SSN, Credit Cards (Luhn check), Emails, and Phones',
        system: 'PII Scrub',
        icon: EyeOff,
        variant: 'amber',
        defaultConfig: {
          maskSsn: true,
          maskCards: true,
          maskEmails: true,
          maskPhones: true,
          replacementTag: '[REDACTED_{TYPE}]'
        }
      },
      {
        type: 'chunker_node',
        name: 'Smart Semantic Chunker',
        desc: 'Split documents into overlapping chunks before vector embedding calculation',
        system: 'Overlap Splitter',
        icon: Split,
        variant: 'blue',
        defaultConfig: {
          chunkSize: 1200,
          chunkOverlap: 120
        }
      }
    ]
  },
  {
    category: '3. Policy & Governance Gates',
    items: [
      {
        type: 'financial_guard',
        name: 'Financial Limit & Drain Guard',
        desc: 'Enforce maximum financial transaction bounds and rate-limit high-dollar agent actions',
        system: 'Financial Bounds',
        icon: DollarSign,
        variant: 'orange',
        defaultConfig: {
          hardCapLimit: 5000,
          hitlThreshold: 500,
          financialFields: 'amount, refund_amount, payout, price, transfer_amount'
        }
      },
      {
        type: 'hitl_gate',
        name: 'Human-In-The-Loop Approval Gate',
        desc: 'Pause execution and alert security stewards when high-risk actions are detected',
        system: 'HITL Reviewer',
        icon: UserCheck,
        variant: 'orange',
        defaultConfig: {
          timeoutSeconds: 300,
          fallbackAction: 'hold',
          approverRoles: 'Admin, Security Auditor'
        }
      },
      {
        type: 'router_gate',
        name: 'Policy Decision Router',
        desc: '3-way split: Compliant (pass-through), Sanitized (modified), Quarantined (blocked)',
        system: '3-Way Split',
        icon: GitBranch,
        variant: 'purple',
        defaultConfig: {
          allowClean: true,
          allowSanitized: true,
          quarantineRiskThreshold: 6.0
        }
      }
    ]
  },
  {
    category: '4. Sinks & Deliverables',
    items: [
      {
        type: 'rag_ledger',
        name: 'Verified RAG Document Ledger',
        desc: 'Commit clean text chunks to persistent on-prem ledger (datax_verified_rag_chunks)',
        system: 'On-Prem PG',
        icon: Layers,
        variant: 'green',
        defaultConfig: {
          tableName: 'datax_verified_rag_chunks',
          computeSha256Seal: true
        }
      },
      {
        type: 'vector_sink',
        name: 'Vector Database Sink',
        desc: 'Publish sanitized document chunks to pgvector or Pinecone embeddings table',
        system: 'Vector Store',
        icon: FileCheck2,
        variant: 'green',
        defaultConfig: {
          sinkType: 'pgvector',
          collection: 'enterprise_knowledge_base'
        }
      },
      {
        type: 'quarantine_sink',
        name: 'Audit Quarantine DLQ Store',
        desc: 'Isolate malicious prompt injections and credential leaks with cryptographic audit hash',
        system: 'Dead-Letter',
        icon: AlertTriangle,
        variant: 'red',
        defaultConfig: {
          tableName: 'datax_firewall_events',
          notifyOnQuarantine: true
        }
      },
      {
        type: 'agent_executor',
        name: 'Safe Agent Tool Execution',
        desc: 'Dispatch sanitized payload to live customer API/tool with tamper-evident audit receipt',
        system: 'Tool Dispatcher',
        icon: Play,
        variant: 'green',
        defaultConfig: {
          dispatchMode: 'dry_run_first'
        }
      }
    ]
  }
];

export const FIREWALL_TEMPLATES = [
  {
    id: 'rag_pre_embedding',
    shortLabel: 'RAG Sanitizer',
    name: 'Enterprise RAG Pre-Embedding Sanitizer',
    description: 'Ingest raw documents, split into chunks, scrub credentials and PII, block prompt injections, and commit verified chunks to pgvector.',
    nodes: [
      {
        id: 'node_f1',
        type: 'file_doc',
        title: 'Document Ingestion',
        system: 'Vendor Contract PDF / Docs',
        status: 'Demo Sandbox',
        metricLabel: 'Vendor_Contract.pdf',
        x: 50,
        y: 165,
        variant: 'blue',
        config: {
          sampleDoc: 'Vendor_Contract_2026.pdf',
          sampleText: 'Vendor agreement between AAVIL Inc and Partner Corp. Contact Harshal at harshal@enterprise.internal (SSN: 987-65-4321). OpenAI credentials: sk-ant-live9841298412984129. DB connection: postgresql://admin:secret@127.0.0.1:5432/datax.'
        }
      },
      {
        id: 'node_f2',
        type: 'chunker_node',
        title: 'Semantic Chunker',
        system: 'Overlap Token Splitter',
        status: 'Active',
        metricLabel: '1,200 Token Window',
        x: 340,
        y: 165,
        variant: 'indigo',
        config: { chunkSize: 1200, chunkOverlap: 120 }
      },
      {
        id: 'node_f3',
        type: 'secret_scrubber',
        title: 'Secret & Key Scrubber',
        system: 'High Entropy + Key Filter',
        status: 'Auto-Redact',
        metricLabel: '4 Key Signatures',
        x: 630,
        y: 85,
        variant: 'orange',
        config: { redactOpenAi: true, redactAws: true, redactJwt: true, redactDbUri: true }
      },
      {
        id: 'node_f4',
        type: 'pii_scrubber',
        title: 'PII Redactor',
        system: 'SSN, Card & Email Masker',
        status: 'Auto-Mask',
        metricLabel: 'AES-GCM Tokenize',
        x: 630,
        y: 255,
        variant: 'purple',
        config: { maskSsn: true, maskCards: true, maskEmails: true }
      },
      {
        id: 'node_f5',
        type: 'prompt_injection',
        title: 'Prompt Injection Guard',
        system: 'Deterministic AST Scanner',
        status: 'Armed',
        metricLabel: 'Jailbreak Filter',
        x: 920,
        y: 165,
        variant: 'purple',
        config: { action: 'quarantine', sensitivity: 0.85 }
      },
      {
        id: 'node_f6',
        type: 'rag_ledger',
        title: 'Verified RAG Ledger',
        system: 'PostgreSQL pgvector Sink',
        status: 'Ready to Commit',
        metricLabel: 'rag_chunks_clean',
        x: 1210,
        y: 85,
        variant: 'green',
        config: { tableName: 'datax_verified_rag_chunks' }
      },
      {
        id: 'node_f7',
        type: 'quarantine_sink',
        title: 'Quarantine Store',
        system: 'Dead-Letter Isolation',
        status: 'Audit Locked',
        metricLabel: 'firewall_dlq',
        x: 1210,
        y: 255,
        variant: 'orange',
        config: { tableName: 'datax_firewall_events' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node_f1', target: 'node_f2', label: 'Raw Stream', variant: 'blue' },
      { id: 'e2-3', source: 'node_f2', target: 'node_f3', label: 'Chunks', variant: 'blue' },
      { id: 'e2-4', source: 'node_f2', target: 'node_f4', label: 'Chunks', variant: 'blue' },
      { id: 'e3-5', source: 'node_f3', target: 'node_f5', label: 'Key Scrubbed', variant: 'blue' },
      { id: 'e4-5', source: 'node_f4', target: 'node_f5', label: 'PII Masked', variant: 'blue' },
      { id: 'e5-6', source: 'node_f5', target: 'node_f6', label: 'Compliant Chunks', variant: 'green' },
      { id: 'e5-7', source: 'node_f5', target: 'node_f7', label: 'Violations', variant: 'orange' }
    ]
  },
  {
    id: 'agent_tool_guard',
    shortLabel: 'Agent Tool Guard',
    name: 'Autonomous Agent Financial & Tool Guard',
    description: 'Intercept in-flight autonomous agent tool calls, verify financial bounds, scrub secrets, trigger HITL on high amounts, and safely dispatch.',
    nodes: [
      {
        id: 'node_ag1',
        type: 'agent_telemetry',
        title: 'Agent Tool Interceptor',
        system: 'In-Flight Webhook Proxy',
        status: 'Listening',
        metricLabel: 'support_bot_v2',
        x: 50,
        y: 175,
        variant: 'blue',
        config: {
          agentName: 'support_bot_v2',
          targetTool: 'stripe_refund',
          sampleArgs: JSON.stringify({ amount: 1200, user_id: 'usr_84920', reason: 'client requested compensation' }, null, 2)
        }
      },
      {
        id: 'node_ag2',
        type: 'financial_guard',
        title: 'Financial Drain Guard',
        system: 'Transaction Bound Gate',
        status: 'Armed',
        metricLabel: 'Max Cap: $5,000',
        x: 340,
        y: 175,
        variant: 'purple',
        config: { hardCapLimit: 5000, hitlThreshold: 500 }
      },
      {
        id: 'node_ag3',
        type: 'hitl_gate',
        title: 'Human in Loop',
        system: 'Security Steward Gate',
        status: 'Armed',
        metricLabel: 'Hold if > $500',
        x: 630,
        y: 95,
        variant: 'orange',
        config: { approverRoles: 'Admin, Security Lead', timeoutSeconds: 300 }
      },
      {
        id: 'node_ag4',
        type: 'secret_scrubber',
        title: 'In-Flight Arg Sanitizer',
        system: 'Payload Key & PII Masker',
        status: 'Active',
        metricLabel: 'Zero-Egress Scrub',
        x: 630,
        y: 265,
        variant: 'indigo',
        config: { redactOpenAi: true, redactJwt: true }
      },
      {
        id: 'node_ag5',
        type: 'agent_executor',
        title: 'Safe Tool Execution',
        system: 'Stripe / Production API',
        status: 'Ready to Commit',
        metricLabel: 'stripe_refund',
        x: 940,
        y: 175,
        variant: 'green',
        config: { dispatchMode: 'dry_run_first' }
      }
    ],
    edges: [
      { id: 'eag1-2', source: 'node_ag1', target: 'node_ag2', label: 'Tool Payload', variant: 'blue' },
      { id: 'eag2-3', source: 'node_ag2', target: 'node_ag3', label: 'Amount > $500', variant: 'orange' },
      { id: 'eag2-4', source: 'node_ag2', target: 'node_ag4', label: 'Within Cap', variant: 'blue' },
      { id: 'eag3-5', source: 'node_ag3', target: 'node_ag5', label: 'Steward Approved', variant: 'green' },
      { id: 'eag4-5', source: 'node_ag4', target: 'node_ag5', label: 'Sanitized Args', variant: 'green' }
    ]
  }
];

