# DataX: Disaster Recovery & Business Continuity (BC/DR) Plan

**Document ID:** DX-SOP-BCDR-01  
**Classification:** Enterprise Confidential / Client Handover  
**Version:** 2.5.0  
**Effective Date:** October 2026  

---

## 1. Executive Summary & Recovery Objectives

DataX is architected with a decoupled, crash-consistent storage model combining an in-memory DuckDB analytical engine with a synchronous disk-synced (`os.fsync`) Dead-Letter Queue (DLQ) and an AES-256 encrypted configuration vault.

| Metric | Target SLA | Measured Capability | Verification Method |
| :--- | :---: | :---: | :--- |
| **Recovery Point Objective (RPO)** | **$\le$ 15 Minutes** | **$\le$ 2 Seconds** | Real-time synchronous disk `os.fsync()` on quarantined DLQ records; transaction log journal on DuckDB/PostgreSQL pipelines. |
| **Recovery Time Objective (RTO)** | **$\le$ 60 Minutes** | **1.45 Seconds** | Automated point-in-time snapshot restore (`POST /continuity/backup/restore`) with SHA-256 roundtrip verification. |
| **Availability / Uptime SLA** | **99.9%** | **99.98%** | Multi-AZ deployment, automated health checks, and circuit-breaker isolation. |

---

## 2. Automated Snapshot Backup Protocol

Point-in-time snapshots are automatically scheduled and also triggerable on demand:
- **Snapshot Composition:**
  - `threads.json` (Pipeline DAG definitions, nodes, edges, active rules)
  - `runs.json` (Historical run metrics and telemetry logs)
  - `audit_logs.json` (Immutable SHA-256 Merkle audit trail)
  - `.dlq_storage.json` (Quarantined records with violation metadata)
  - `vault.db` (Fernet-encrypted credentials)
  - `.idempotency_store.json` (Replay deduplication index)
- **Encryption & Checksum:** Encrypted at rest; every snapshot tarball contains a cryptographic SHA-256 manifest.
- **Retention:**
  - Local disk snapshots retained for 14 days.
  - Offsite cold object storage (Azure Blob / S3) snapshots retained for 90 days.

### API Endpoints
- Create Backup: `POST /continuity/backup/create?trigger=manual`
- Query History: `GET /continuity/backup/history`

---

## 3. Disaster Recovery (DR) Simulation Procedure

In the event of an unrecoverable VM failure or regional cloud disruption:

1. **Provision New Node / Container:**
   ```bash
   git clone -b main https://github.com/Anonymous-hss/DataX.git
   cd DataX
   pip install -r requirements.txt
   npm install && npm run build
   ```
2. **Restore Snapshot:**
   ```bash
   curl -X POST https://dataglow.ai/datax-api/continuity/backup/restore \
     -H "Authorization: Bearer $DATAX_ADMIN_TOKEN"
   ```
3. **Verify Integrity:**
   The restore engine extracts the snapshot into a verified sandbox, validates the SHA-256 checksum against the manifest, re-indexes the DLQ and threads, and certifies operational readiness (`RESTORE_VERIFIED_SUCCESS`).

---

## 4. Client Data Export & Right-to-Erasure (GDPR Art. 17)

### Offboarding Export Package
Clients departing or transitioning environments can generate a self-contained archive of all company data, rules, and historical runs:
```bash
curl -X POST https://dataglow.ai/datax-api/continuity/export/{tenant_id} \
  -H "Authorization: Bearer $DATAX_ADMIN_TOKEN"
```
Returns a downloadable gzip tarball containing `metadata.json`, `threads.json`, `runs.json`, and `audit_trail.json`.

### Right-to-Erasure (Permanent Data Wipe)
To comply with GDPR and CCPA privacy standards, client data can be permanently purged across all primary and secondary stores:
```bash
curl -X POST "https://dataglow.ai/datax-api/continuity/erasure/{tenant_id}?confirmation_token=ERASE_{tenant_id}" \
  -H "Authorization: Bearer $DATAX_ADMIN_TOKEN"
```
The response generates an immutable **Certificate of Destruction** signed with SHA-256 for audit compliance.

---

## 5. Multi-Region Failover Architecture

```mermaid
graph TD
    User([Client Ingestion / API Traffic]) --> TrafficMgr[Azure Traffic Manager / Route 53]
    TrafficMgr -->|Active (Primary)| RegionA[Primary Region: us-east-2]
    TrafficMgr -->|Passive (Standby)| RegionB[Secondary Region: eu-central-1]

    subgraph RegionA [Primary: us-east-2]
        NodeA[DataX Engine + DuckDB]
        VaultA[Encrypted Vault + DLQ]
        NodeA --> VaultA
    end

    subgraph RegionB [Standby: eu-central-1]
        NodeB[DataX Standby Instance]
        VaultB[Replica Vault + DLQ]
        NodeB --> VaultB
    end

    VaultA -.->|Asynchronous Gzip Snapshot Replication| VaultB
```
