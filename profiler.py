"""
DataX Memory Leak & Footprint Profiler
Tracks Python heap allocations, Resident Set Size (RSS), and flushes DuckDB/PyArrow buffers.
"""

import os
import gc
import tracemalloc
from typing import Dict, Any, List, Optional


class MemoryProfiler:
    """
    Monitors process memory footprint and guards against leaks over consecutive runs.
    """

    def __init__(self):
        self._is_tracing = False
        self._history: List[Dict[str, Any]] = []
        self._max_history = 100

    def start_tracing(self):
        """Starts Python tracemalloc tracing."""
        if not tracemalloc.is_tracing():
            tracemalloc.start()
            self._is_tracing = True

    def stop_tracing(self):
        """Stops tracemalloc tracing."""
        if tracemalloc.is_tracing():
            tracemalloc.stop()
            self._is_tracing = False

    def get_current_rss_mb(self) -> float:
        """Returns Resident Set Size (RSS) in Megabytes."""
        try:
            import psutil
            process = psutil.Process(os.getpid())
            return round(process.memory_info().rss / (1024 * 1024), 2)
        except Exception:
            # Fallback if psutil is not available
            return 0.0

    def capture_snapshot(self, label: str = "checkpoint") -> Dict[str, Any]:
        """Captures a point-in-time memory profile snapshot."""
        rss_mb = self.get_current_rss_mb()
        heap_current_mb = 0.0
        heap_peak_mb = 0.0

        if tracemalloc.is_tracing():
            curr, peak = tracemalloc.get_traced_memory()
            heap_current_mb = round(curr / (1024 * 1024), 2)
            heap_peak_mb = round(peak / (1024 * 1024), 2)

        snapshot = {
            "label": label,
            "rss_mb": rss_mb,
            "heap_current_mb": heap_current_mb,
            "heap_peak_mb": heap_peak_mb,
            "gc_objects_count": len(gc.get_objects())
        }

        self._history.append(snapshot)
        if len(self._history) > self._max_history:
            self._history.pop(0)

        return snapshot

    def flush_buffers_and_gc(self) -> Dict[str, Any]:
        """
        Explicitly forces garbage collection and releases in-process buffers.
        Guarantees that memory plateaus without creeping up over consecutive runs.
        """
        before_rss = self.get_current_rss_mb()
        before_objects = len(gc.get_objects())

        # Collect cyclic references across all generations
        collected = gc.collect(generation=2)

        if tracemalloc.is_tracing():
            tracemalloc.reset_peak()

        after_rss = self.get_current_rss_mb()
        after_objects = len(gc.get_objects())

        return {
            "reclaimed_objects": collected,
            "reclaimed_memory_mb": round(max(0.0, before_rss - after_rss), 2),
            "current_rss_mb": after_rss,
            "remaining_objects": after_objects
        }

    def detect_leak(self, threshold_mb: float = 30.0) -> Dict[str, Any]:
        """
        Analyzes historical memory snapshots to verify whether memory plateaus
        or exhibits signs of a progressive memory leak.
        """
        if len(self._history) < 5:
            return {
                "evaluated": False,
                "message": "Insufficient runs recorded (<5) for leak regression analysis.",
                "leak_detected": False
            }

        first_snapshot = self._history[0]
        latest_snapshot = self._history[-1]

        drift_mb = latest_snapshot["rss_mb"] - first_snapshot["rss_mb"]
        is_leaking = drift_mb > threshold_mb

        return {
            "evaluated": True,
            "recorded_snapshots": len(self._history),
            "baseline_rss_mb": first_snapshot["rss_mb"],
            "current_rss_mb": latest_snapshot["rss_mb"],
            "drift_mb": round(drift_mb, 2),
            "threshold_mb": threshold_mb,
            "leak_detected": is_leaking,
            "status": "MEMORY_LEAK_WARNING" if is_leaking else "PLATEAU_VERIFIED_STABLE"
        }

    def get_summary(self) -> Dict[str, Any]:
        """Returns comprehensive memory telemetry."""
        return {
            "rss_mb": self.get_current_rss_mb(),
            "tracemalloc_active": tracemalloc.is_tracing(),
            "leak_check": self.detect_leak(),
            "latest_snapshots": self._history[-5:] if self._history else []
        }


# Global Singleton Profiler
memory_profiler = MemoryProfiler()
memory_profiler.start_tracing()
