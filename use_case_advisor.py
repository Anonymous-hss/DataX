"""
DataX Interactive Use-Case Discovery Advisor
Recommends tailored, concrete DataX blueprints based on user role, stack, and business goals.
"""

from typing import Dict, Any, List, Optional


def recommend_use_cases(
    role: Optional[str] = None,
    stack: Optional[List[str]] = None,
    goal: Optional[str] = None,
    schema_columns: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Generates 3 tailored, concrete use cases in plain English with 1-click launch parameters."""
    stack_str = " ".join(stack or []).lower()
    goal_str = (goal or "").lower()
    role_str = (role or "").lower()

    # Determine primary matches
    blueprints = []

    # 1. AI Firewall Match
    if any(k in stack_str or k in goal_str or k in role_str for k in ["ai", "llm", "rag", "langgraph", "langchain", "pinecone", "weaviate", "agent", "tool", "pdf", "prompt", "vector"]):
        blueprints.append({
            "id": "ai_rag_firewall",
            "pillar": "AI_FIREWALL",
            "badge": "Pillar 2 · GenAI Trust",
            "title": "AI Agent & RAG Pre-Embedding Data Firewall",
            "tagline": "Stop hidden prompt injections, leaked credentials, and hallucinated $50k tool calls before they strike.",
            "theRisk": "Enterprise RAG vector databases get poisoned with indirect prompt injections from uploaded vendor PDFs. Furthermore, customer-support LLM agents can hallucinate massive refunds or run destructive SQL queries directly against production databases.",
            "howDataXSolvesIt": [
                "1. Pre-Embedding Scan: Detects system-prompt overrides & auto-redacts API keys/SSNs in <25ms before vectorization.",
                "2. Synchronous Agent Guard: Intercepts tool calls like refund_amount or SQL query, enforcing strict financial ceilings and read-only AST guards.",
                "3. Human-in-the-Loop Gate: High-dollar or ambiguous transactions are automatically paused for human sign-off."
            ],
            "recommendedNodes": ["RAG Ingest", "Injection & Secret Shield", "Tool Call Interceptor", "Pinecone Sink"],
            "route": "ai-firewall",
            "canvasTemplate": "ai_firewall_rag",
            "actionLabel": "Launch AI Firewall Studio",
            "isFeatured": True
        })

    # 2. ML & LLM Fine-Tuning Certification Match
    if any(k in stack_str or k in goal_str or k in role_str for k in ["ml", "scientist", "fine-tuning", "sft", "training", "huggingface", "vertex", "sagemaker", "drift", "leakage", "model", "feature"]):
        blueprints.append({
            "id": "ml_dataset_certification",
            "pillar": "ML_CERTIFY",
            "badge": "Pillar 3 · ML Trust",
            "title": "ML Training & LLM Fine-Tuning Dataset Certification Gate",
            "tagline": "Detect target leakage, distribution shift, and memorized secrets before wasting $20k on GPU training.",
            "theRisk": "Training or fine-tuning models on dirty datasets causes catastrophic post-deployment failures: target leakage features (r >= 0.90) artificially inflate validation accuracy, distribution drift (PSI >= 0.25) destroys live inference, and LLMs memorize leaked customer API keys and SSNs from uncurated SFT JSONL datasets.",
            "howDataXSolvesIt": [
                "1. Real PSI Covariate Drift: Computes 10-bucket quantile Population Stability Index to catch feature shifts.",
                "2. Automatic Target Leakage Scanner: Flags features that suspiciously predict the label post-event.",
                "3. Cryptographic Governance Dossier: Issues an EU AI Act & SR 11-7 release card with SHA-256 seal."
            ],
            "recommendedNodes": ["Baseline & Candidate Ingest", "PSI Drift & Leakage Auditor", "SFT JSONL Hygiene Filter", "Model Gate"],
            "route": "ml-certify",
            "canvasTemplate": "ml_dataset_certification",
            "actionLabel": "Launch ML Certification Studio",
            "isFeatured": True
        })

    # 3. Database & Financial Clean-Core Match (Default Core Pillar)
    blueprints.append({
        "id": "financial_clean_core",
        "pillar": "DATA_PIPELINE",
        "badge": "Pillar 1 · Data Pipelines",
        "title": "Autonomous Database Clean-Core & Migration Gate",
        "tagline": "Migrate and sync data between MongoDB, Postgres, Snowflake & ERP with zero dirty records.",
        "theRisk": "Raw operational databases contain negative numbers, broken foreign keys, invalid emails, and unvalidated status transitions that break downstream ledgers and crash analytics dashboards.",
        "howDataXSolvesIt": [
            "1. In-Memory Vectorized AST: Compiles and evaluates plain-English business rules in <50ms using DuckDB.",
            "2. Autonomous Auto-Fix: Normalizes whitespace, casing, and inverted signs deterministically.",
            "3. Durable DLQ: Quarantines non-compliant records for data steward review while staging 100% clean rows."
        ],
        "recommendedNodes": ["MongoDB / Source DB", "Intelligence Engine (AST)", "CleanFlow Router", "PostgreSQL / ERP Target"],
        "route": "canvas",
        "canvasTemplate": "mongodb_postgres_pipeline",
        "actionLabel": "Open Canvas Pipeline",
        "isFeatured": False
    })

    # If we still have fewer than 3, add Multi-Source Reconciliation
    if len(blueprints) < 3:
        blueprints.append({
            "id": "multi_source_reconciliation",
            "pillar": "RECONCILIATION",
            "badge": "Pillar 1 · Arbitrator",
            "title": "Cross-System Financial & Multi-Ledger Reconciliation",
            "tagline": "Pinpoint exactly where money is leaking across Stripe, your database, and your ERP ledger.",
            "theRisk": "Order-to-cash discrepancies between payment gateways, application databases, and ERP general ledgers silently cause revenue leaks, uncollected fees, and failed SOX audit certifications.",
            "howDataXSolvesIt": [
                "1. Multi-Input Ingest: Streams records from 2 or 3 distinct operational systems simultaneously.",
                "2. Semantic Vector Alignment: Matches mismatched reference IDs and transaction aliases.",
                "3. SOX-Certified Parity: Emits a cryptographic shadow parity report with dollar-exact discrepancies."
            ],
            "recommendedNodes": ["Stripe / Gateway", "Application DB", "Reconciler", "Audit Ledger"],
            "route": "shadow",
            "canvasTemplate": "sap_bw_s4hana",
            "actionLabel": "Open Shadow Reconciler",
            "isFeatured": False
        })

    return blueprints[:3]

