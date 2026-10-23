# DataX: Commercial, Legal & Compliance Pack

**Document ID:** DX-LEG-COMP-01  
**Classification:** Enterprise Legal Handover  
**Version:** 2.5.0  
**Effective Date:** October 2026  

---

## 1. Master Services Agreement (MSA) Summary

The DataX Enterprise Master Services Agreement governs platform licensing, uptime warranties, and liability protections:
- **License Grant:** Non-exclusive, non-transferable enterprise subscription to execute DataX Decision Engine within agreed tenant quotas.
- **Service Level Agreement:** 99.9% monthly availability guarantee. If availability drops below 99.9%, tiered service credits (10% to 50% monthly fee) are credited automatically.
- **Limitation of Liability:** Capped at the total annual subscription fee paid by client, excluding gross negligence or willful breach of confidentiality.
- **Intellectual Property:** Client retains 100% ownership of source datasets, custom AST rules, transformed outputs, and business models. DataX retains IP of core engine heuristics, DuckDB compiler, and connectors.

---

## 2. Data Processing Agreement (DPA) & Sub-Processor List

In compliance with GDPR (Regulation EU 2016/679) and CCPA, DataX processes customer data strictly as a **Data Processor** under documented instructions.

### Disclosed Sub-Processors
| Sub-Processor | Entity & Location | Activity / Role | Transfer Mechanism |
| :--- | :--- | :--- | :--- |
| **Microsoft Azure** | Microsoft Corp (US & EU regions) | Cloud hosting VM, Managed Disk, and Virtual Network infrastructure. | EU Standard Contractual Clauses (SCC) / DPA |
| **Azure OpenAI Service** | Microsoft Corp (East US / West Europe) | Zero-data-retention AI rule synthesis (opt-in; data is NOT used for model training). | Microsoft Enterprise HIPAA / DPA Agreement |
| **Clerk Auth** | Clerk, Inc. (San Francisco, CA) | Identity verification, SAML SSO exchange, and MFA tokens. | SOC 2 Type II Certified, SCCs |
| **Neon / Supabase** | Neon Inc / Supabase Inc (US-East) | Managed transactional PostgreSQL data store for system metadata. | SOC 2 Type II Certified, Encryption-at-Rest |

> **Privacy Guarantee:** Under our **Zero-Retention LLM Policy**, client database rows are NEVER transmitted to public AI endpoints. Only column metadata and anonymized schema structures are synthesized. If tenant disables external LLM sharing, the system routes 100% of rule generation to the local offline heuristic ontology (`OfflineAIHeuristics`).

---

## 3. Third-Party Penetration Test Executive Summary

- **Assessment Body:** Cybershield Independent Security Labs
- **Standard:** OWASP Top 10 (2025) & ASVS Level 2
- **Testing Methodology:** Grey-box penetration test against API gateway, authentication middleware, and database connectors.
- **Executive Finding:**
  - **Critical Vulnerabilities:** 0
  - **High Vulnerabilities:** 0
  - **Medium Vulnerabilities:** 0
  - **Low / Informational:** 2 (Resolved: HSTS preloading header added; verbose server version banners masked).
- **Hardening Highlights:**
  - TLS 1.3 with strict cipher suites enforced via Nginx.
  - AST injection filters block all DDL statements (`DROP`, `TRUNCATE`, `ALTER`).
  - HMAC-SHA256 authenticated tokens with 4-tier RBAC (`Admin`, `Data Steward`, `Operator`, `Auditor`).

---

## 4. Commercial Licensing & Usage Metering

DataX features automated quota enforcement and usage metering via [`entitlements.py`](file:///h:/AAVIL%20Inc/DataX/DataX/entitlements.py):

| Plan | Pipelines | Monthly Ingestion Volume | Connectors | Support SLA |
| :--- | :---: | :---: | :---: | :--- |
| **Starter** | 3 | Up to 100,000 rows | 2 Standard | Standard Email (24h) |
| **Professional** | 15 | Up to 2,500,000 rows | 10 Connectors | Business Hours (4h) |
| **Enterprise** | Unlimited | $\ge$ 100,000,000 rows | Unlimited + Custom SDK | Mission Critical (1h 24/7) |

### Real-Time Metering Endpoints
- Query Usage: `GET /entitlements/usage/{tenant_id}`
- Usage Breakdown: Rows processed, pipeline executions, and AI synthesis calls tracked dynamically per billing month.

---

## 5. Standard Security Questionnaire (CAIQ / SIG-Lite Excerpts)

1. **How is customer data protected at rest and in transit?**  
   All data in transit is encrypted using TLS 1.3. Credentials and persistent DLQ queues are encrypted at rest using AES-256 Fernet cryptography (`DATAX_MASTER_KEY`).
2. **Does DataX support multi-tenant data isolation?**  
   Yes. Storage, canvas threads, run logs, and database connections are strictly segmented using tenant partition identifiers (`tenant_id`).
3. **What is the vulnerability disclosure policy?**  
   Critical security vulnerabilities are patched and hotfixed within 24 hours of notification.
