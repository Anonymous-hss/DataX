"""
DataX Multi-Channel Alerting & Policy Dispatcher (OBS-01 & OBS-02)
Supports SMTP Email and Slack/Teams Webhooks with configurable alert thresholds.
"""

import os
import time
import json
import smtplib
import threading
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, List, Optional

ALERTS_STORE_FILE = os.path.join(
    os.environ.get("DATAX_VAULT_DIR", "/home/azureuserSDH/Production/datax-service"),
    ".alerts_policies.json"
)
ALERTS_HISTORY_FILE = os.path.join(
    os.environ.get("DATAX_VAULT_DIR", "/home/azureuserSDH/Production/datax-service"),
    ".alerts_history.json"
)

# Default Enterprise Alert Policies (OBS-02)
DEFAULT_POLICIES = [
    {
        "id": "policy_pipe_failure",
        "name": "Pipeline Fatal Failure",
        "condition": "status == 'FAILED'",
        "severity": "CRITICAL",
        "channels": ["email", "webhook"],
        "enabled": True,
        "desc": "Triggered when a pipeline fails due to unhandled exceptions or connection loss."
    },
    {
        "id": "policy_high_quarantine",
        "name": "Quarantine Spike Alert",
        "condition": "quarantine_rate_pct > 15.0",
        "threshold_value": 15.0,
        "severity": "WARNING",
        "channels": ["email", "webhook"],
        "enabled": True,
        "desc": "Triggered when quarantined record ratio breaches 15% of total extracted records."
    },
    {
        "id": "policy_schema_drift",
        "name": "Distribution & Schema Drift Alert",
        "condition": "drift_status == 'DRIFT_DETECTED'",
        "severity": "WARNING",
        "channels": ["webhook"],
        "enabled": True,
        "desc": "Triggered when distribution anomalies or missing column ratios exceed thresholds."
    }
]


class AlertDispatcher:
    """Manages multi-channel notification dispatching and policy evaluations."""

    def __init__(self):
        self.smtp_host = os.environ.get("SMTP_HOST", "smtp.dataglow.ai")
        self.smtp_port = int(os.environ.get("SMTP_PORT", 587))
        self.smtp_user = os.environ.get("SMTP_USER", "alerts@dataglow.ai")
        self.smtp_pass = os.environ.get("SMTP_PASS", "")
        self.webhook_url = os.environ.get("DATAX_ALERT_WEBHOOK_URL", "")
        self.alert_recipient = os.environ.get("ALERT_RECIPIENT_EMAIL", "stewards@dataglow.ai")
        self._lock = threading.Lock()

    def get_policies(self) -> List[Dict[str, Any]]:
        if os.path.exists(ALERTS_STORE_FILE):
            try:
                with open(ALERTS_STORE_FILE, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        return DEFAULT_POLICIES

    def save_policies(self, policies: List[Dict[str, Any]]):
        with open(ALERTS_STORE_FILE, "w") as f:
            json.dump(policies, f, indent=2)

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        if os.path.exists(ALERTS_HISTORY_FILE):
            try:
                with open(ALERTS_HISTORY_FILE, "r") as f:
                    data = json.load(f)
                    return data[:limit]
            except Exception:
                pass
        return []

    def _record_history(self, alert_entry: Dict[str, Any]):
        with self._lock:
            history = self.get_history(limit=100)
            history.insert(0, alert_entry)
            try:
                with open(ALERTS_HISTORY_FILE, "w") as f:
                    json.dump(history[:100], f, indent=2)
            except Exception:
                pass

    def dispatch_email(self, subject: str, html_body: str, recipient: Optional[str] = None) -> bool:
        """Sends formatted HTML email alert via SMTP or logs delivery simulation."""
        target_email = recipient or self.alert_recipient
        if self.smtp_pass and self.smtp_host:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"DataX Alert Engine <{self.smtp_user}>"
                msg["To"] = target_email
                msg.attach(MIMEText(html_body, "html"))

                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=8) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_pass)
                    server.sendmail(self.smtp_user, target_email, msg.as_string())
                return True
            except Exception as e:
                print(f"[ALERT SMTP ERROR] {e}")
                return False
        else:
            # Simulated SMTP Dispatch
            print(f"[ALERT EMAIL SIMULATION] To: {target_email} | Subject: {subject}")
            return True

    def dispatch_webhook(self, payload: Dict[str, Any]) -> bool:
        """Sends formatted alert payload to Slack/Teams/Generic Webhook."""
        if not self.webhook_url:
            print(f"[ALERT WEBHOOK SIMULATION] Dispatched payload: {json.dumps(payload)[:120]}...")
            return True

        try:
            req = urllib.request.Request(
                self.webhook_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status in [200, 201, 204]
        except Exception as e:
            print(f"[ALERT WEBHOOK ERROR] {e}")
            return False

    def evaluate_and_dispatch(self, run_result: Dict[str, Any]):
        """
        OBS-02: Evaluates active policies against pipeline run results and dispatches alerts.
        """
        policies = self.get_policies()
        counts = run_result.get("counts", {})
        total = max(1, counts.get("totalChecked", run_result.get("extracted", 1)))
        quarantined = counts.get("quarantined", run_result.get("quarantined", 0))
        q_rate_pct = round((quarantined / total) * 100, 1)

        drift = run_result.get("driftMetrics", {})
        drift_status = drift.get("status", "STABLE")
        run_status = run_result.get("status", "SUCCESS").upper()

        for policy in policies:
            if not policy.get("enabled", True):
                continue

            pid = policy.get("id")
            triggered = False
            trigger_reason = ""

            if pid == "policy_pipe_failure" and run_status == "FAILED":
                triggered = True
                trigger_reason = f"Pipeline execution failed: {run_result.get('error', 'Execution Exception')}"
            elif pid == "policy_high_quarantine" and q_rate_pct > policy.get("threshold_value", 15.0):
                triggered = True
                trigger_reason = f"Quarantine rate of {q_rate_pct}% breached threshold ({policy.get('threshold_value', 15.0)}%)"
            elif pid == "policy_schema_drift" and drift_status == "DRIFT_DETECTED":
                triggered = True
                trigger_reason = f"Distribution drift detected ({drift.get('driftScore', 0.0)}% drift anomaly score)"

            if triggered:
                alert_entry = {
                    "alert_id": f"alert_{int(time.time()*1000)%1000000}",
                    "policy_id": pid,
                    "policy_name": policy.get("name"),
                    "severity": policy.get("severity", "WARNING"),
                    "trigger_reason": trigger_reason,
                    "pipeline_name": run_result.get("pipelineName", "DataX Pipeline"),
                    "run_id": run_result.get("runId", "adhoc"),
                    "quarantine_count": quarantined,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }

                self._record_history(alert_entry)

                # HTML Email Template
                html_body = f"""
                <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
                    <h2 style="color: #ef4444; margin-top: 0;">🚨 DataX Enterprise Alert: {policy.get('name')}</h2>
                    <p style="font-size: 14px; color: #94a3b8;"><strong>Pipeline:</strong> {run_result.get('pipelineName')} (Run ID: {run_result.get('runId')})</p>
                    <div style="background: #1e293b; padding: 16px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 16px 0;">
                        <p style="margin: 0; font-size: 15px;"><strong>Alert Breach:</strong> {trigger_reason}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
                        <tr><td style="padding: 6px 0;">Extracted Records:</td><td><strong>{total}</strong></td></tr>
                        <tr><td style="padding: 6px 0;">Quarantined Records:</td><td><strong style="color: #f87171;">{quarantined} ({q_rate_pct}%)</strong></td></tr>
                        <tr><td style="padding: 6px 0;">Health Score:</td><td><strong>{run_result.get('healthMetrics', {}).get('score', 'N/A')}%</strong></td></tr>
                    </table>
                    <div style="margin-top: 24px;">
                        <a href="https://dataglow.ai/datax/quarantine" style="background: #0284c7; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                            Inspect Quarantine Workbench ➔
                        </a>
                    </div>
                </div>
                """

                # Dispatch in background thread so caller latency is unaffected
                threading.Thread(
                    target=lambda: self.dispatch_email(
                        f"[{policy.get('severity')}] DataX Alert: {policy.get('name')}",
                        html_body
                    )
                ).start()

                threading.Thread(
                    target=lambda: self.dispatch_webhook({
                        "text": f"🚨 *DataX Alert:* {policy.get('name')}\n• Pipeline: {run_result.get('pipelineName')}\n• Reason: {trigger_reason}\n• Quarantine: {quarantined} records",
                        "severity": policy.get("severity"),
                        "runId": run_result.get("runId")
                    })
                ).start()


# Global Singleton Dispatcher
alert_dispatcher = AlertDispatcher()
