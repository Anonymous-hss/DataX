"""
DataX Prometheus Metrics Collector & Exporter (OBS-05)
Formats runtime telemetry into Prometheus / OpenMetrics exposition format.
"""

import os
import time
import threading
from typing import Dict, Any


class PrometheusMetricsCollector:
    """Thread-safe Prometheus metrics collector and text generator."""

    def __init__(self):
        self._lock = threading.Lock()
        self._pipeline_runs_total = {"success": 0, "failure": 0}
        self._records_processed_total = {"valid": 0, "autofixed": 0, "quarantined": 0}
        self._last_duration_seconds = 0.0
        self._circuit_breakers = {
            "azure_openai": 0,
            "source_database": 0,
            "target_database": 0
        }

    def record_run(self, success: bool, valid: int, autofixed: int, quarantined: int, duration_sec: float):
        with self._lock:
            status_key = "success" if success else "failure"
            self._pipeline_runs_total[status_key] += 1
            self._records_processed_total["valid"] += valid
            self._records_processed_total["autofixed"] += autofixed
            self._records_processed_total["quarantined"] += quarantined
            self._last_duration_seconds = duration_sec

    def update_circuit_breaker(self, name: str, is_open: bool):
        with self._lock:
            self._circuit_breakers[name] = 1 if is_open else 0

    def export_metrics(self) -> str:
        """Renders standard Prometheus text format."""
        with self._lock:
            lines = [
                "# HELP datax_pipeline_runs_total Total number of executed pipeline runs.",
                "# TYPE datax_pipeline_runs_total counter",
                f'datax_pipeline_runs_total{{status="success"}} {self._pipeline_runs_total["success"]}',
                f'datax_pipeline_runs_total{{status="failure"}} {self._pipeline_runs_total["failure"]}',
                "",
                "# HELP datax_pipeline_records_processed_total Total records processed by classification.",
                "# TYPE datax_pipeline_records_processed_total counter",
                f'datax_pipeline_records_processed_total{{type="valid"}} {self._records_processed_total["valid"]}',
                f'datax_pipeline_records_processed_total{{type="autofixed"}} {self._records_processed_total["autofixed"]}',
                f'datax_pipeline_records_processed_total{{type="quarantined"}} {self._records_processed_total["quarantined"]}',
                "",
                "# HELP datax_pipeline_duration_seconds Last pipeline run execution duration in seconds.",
                "# TYPE datax_pipeline_duration_seconds gauge",
                f'datax_pipeline_duration_seconds {round(self._last_duration_seconds, 4)}',
                "",
                "# HELP datax_circuit_breaker_open Binary status indicating if circuit breaker is tripped (1=open, 0=closed).",
                "# TYPE datax_circuit_breaker_open gauge"
            ]

            for name, val in self._circuit_breakers.items():
                lines.append(f'datax_circuit_breaker_open{{name="{name}"}} {val}')

            # Add process memory RSS gauge
            try:
                import psutil
                process = psutil.Process(os.getpid())
                rss_bytes = process.memory_info().rss
                lines.extend([
                    "",
                    "# HELP datax_process_memory_rss_bytes Process resident set size memory in bytes.",
                    "# TYPE datax_process_memory_rss_bytes gauge",
                    f'datax_process_memory_rss_bytes {rss_bytes}'
                ])
            except Exception:
                pass

            return "\n".join(lines) + "\n"


# Global Singleton Metrics Collector
metrics_collector = PrometheusMetricsCollector()
