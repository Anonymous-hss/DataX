# DataX: Enterprise Operations Runbook

**Document ID:** DX-OPS-RUN-01  
**Classification:** Client Operations Handover  
**Version:** 2.5.0  
**Target Audience:** DevOps Engineers, Cloud Platform SREs, System Administrators  

---

## 1. System Architecture & Component Topology

DataX is composed of three interconnected tiers designed for high-concurrency analytical reconciliation:

```
[ Client Traffic / Browser / Ingestion Webhooks ]
                     │
                     ▼
             [ Nginx Reverse Proxy ]
             (TLS 1.3 Termination & Static UI)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  [ React 18 SPA ]       [ FastAPI API Gateway ] (Port 8003)
                         ├── DuckDB In-Memory AST Engine
                         ├── Fernet Encrypted Credential Vault
                         ├── Durable DLQ (fsync crash-consistent)
                         └── Connection Pooler (Postgres, HANA, Mongo)
```

---

## 2. Day-1 Quickstart & Deployment

### Option A: Docker Compose (Single VM / Staging / Production)
1. **Clone repository and configure environment:**
   ```bash
   git clone https://github.com/Anonymous-hss/DataX.git
   cd DataX
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials and MASTER_KEY
   ```
2. **Boot the complete stack:**
   ```bash
   docker compose up -d --build
   ```
3. **Verify stack health:**
   ```bash
   curl http://localhost:8003/health
   # Expected: {"status":"healthy","service":"datax-service","version":"2.5.0",...}
   ```

### Option B: Kubernetes via Helm (Enterprise Multi-Node)
1. **Add Helm values configuration:**
   ```bash
   helm upgrade --install datax ./deploy/helm/datax \
     --namespace datax-prod --create-namespace \
     --values ./deploy/helm/datax/values.yaml
   ```
2. **Verify pod rollout:**
   ```bash
   kubectl get pods -n datax-prod
   ```

---

## 3. Routine Operations & Maintenance Procedures

### 3.1 Automated Snapshot Backup
Backups are triggered on demand or scheduled via cron:
```bash
curl -X POST "https://dataglow.ai/datax-api/continuity/backup/create?trigger=scheduled_ops" \
  -H "Authorization: Bearer $DATAX_ADMIN_TOKEN"
```
Snapshots are stored in `.backups/` as `.tar.gz` archives with SHA-256 manifests.

### 3.2 Non-Destructive Restore Drill
To verify data integrity and certify RTO SLA without overwriting active data:
```bash
curl -X POST "https://dataglow.ai/datax-api/continuity/backup/restore" \
  -H "Authorization: Bearer $DATAX_ADMIN_TOKEN"
```
Returns `RESTORE_VERIFIED_SUCCESS` and measured latency (typically < 0.01s).

### 3.3 TLS Certificate Rotation
For Let's Encrypt certificates managed by cert-manager:
```bash
kubectl delete secret datax-tls-cert -n datax-prod
# cert-manager will immediately request a new cert from Let's Encrypt
```
For bare-metal Nginx instances:
```bash
sudo certbot renew --nginx
sudo nginx -s reload
```

### 3.4 Fernet Master Key Rotation
If rotating the platform `DATAX_MASTER_KEY`:
1. Generate new key:
   ```bash
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```
2. Update key in environment variables or Kubernetes Secret.
3. Restart backend service (`pm2 reload 6` or `kubectl rollout restart deployment/datax-backend`).

---

## 4. Node Sizing & Concurrency Guidelines

| Deployment Tier | Concurrency | Memory Request / Limit | CPU Request / Limit | Target Ingestion Throughput |
| :--- | :---: | :---: | :---: | :---: |
| **Standard** | 5 Pipelines | 512Mi / 2Gi | 0.5 Core / 2 Cores | 10,000 rows/sec |
| **High-Throughput** | 25 Pipelines | 2Gi / 8Gi | 2 Cores / 8 Cores | 50,000 rows/sec |
| **Enterprise Grid** | 100+ Pipelines | 8Gi / 32Gi | 8 Cores / 16 Cores | 250,000 rows/sec |

---

## 5. Troubleshooting & Incident Playbooks

### Playbook 1: 502 Bad Gateway / Backend Unresponsive
- **Symptoms:** Nginx returns 502; API health checks fail.
- **Diagnosis:**
  ```bash
  pm2 status
  pm2 logs 6 --lines 50
  ```
- **Remediation:**
  ```bash
  pm2 restart 6
  ```

### Playbook 2: Database Connection Pool Exhausted
- **Symptoms:** API returns `503 Service Unavailable: Database pool timeout`.
- **Diagnosis:** Inspect active connections in PostgreSQL (`SELECT count(*) FROM pg_stat_activity;`).
- **Remediation:** In `db_pool.py`, increase `max_size` or run cleanup:
  ```bash
  curl -X POST "https://dataglow.ai/datax-api/db/pool/reset" -H "Authorization: Bearer $DATAX_ADMIN_TOKEN"
  ```

### Playbook 3: Circuit Breaker Open on External LLM
- **Symptoms:** AI rule synthesis returns `OfflineAIHeuristics` fallback rules.
- **Diagnosis:** Check `GET /resilience/status` to confirm `openai_breaker.state == "OPEN"`.
- **Remediation:** Check Azure OpenAI quota or connectivity; circuit breaker automatically resets after a 30-second cooldown once connectivity recovers.
