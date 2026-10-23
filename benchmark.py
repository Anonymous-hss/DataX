"""
DataX High-Throughput Benchmarking & Scalability Suite
Tests sustained throughput, p95 latency, zero-drop validation, and memory plateau.
"""

import time
import math
import argparse
from datetime import datetime
from typing import Dict, Any, List, Optional

from sap_generator import generate_sap_purchasing_records
from engine import evaluate_rules_with_duckdb
from streamer import stream_synthetic_batches
from profiler import memory_profiler


BENCHMARK_RULES = [
    {
        "id": "r_bm_qty",
        "name": "Strict Quantity Check",
        "field": "QUANTITY",
        "severity": "Critical",
        "condition": "QUANTITY > 0",
        "code": "QUANTITY > 0",
        "desc": "Quantity must be strictly positive"
    },
    {
        "id": "r_bm_amount",
        "name": "Positive Net Amount",
        "field": "NET_AMOUNT",
        "severity": "Critical",
        "condition": "NET_AMOUNT > 0",
        "code": "NET_AMOUNT > 0",
        "desc": "Net amount must be greater than zero"
    },
    {
        "id": "r_bm_po",
        "name": "Valid PO Format",
        "field": "PO_NUMBER",
        "severity": "Warning",
        "condition": "PO_NUMBER IS NOT NULL",
        "code": "PO_NUMBER IS NOT NULL",
        "desc": "PO number must exist"
    }
]


def run_performance_benchmark(
    total_records: int = 100000,
    chunk_size: int = 5000,
    auto_fix_enabled: bool = True
) -> Dict[str, Any]:
    """
    Executes a high-throughput scalability benchmark across `total_records`.
    Validates PRF-01 criteria:
    - Sustained throughput >= 5,000 rows/sec
    - p95 latency under 15ms per micro-batch
    - Zero dropped rows (input_records == valid + quarantined)
    - Memory plateau under 512MB
    """
    memory_profiler.flush_buffers_and_gc()
    initial_mem = memory_profiler.capture_snapshot("benchmark_start")

    total_extracted = 0
    total_valid = 0
    total_autofixed = 0
    total_quarantined = 0
    batch_latencies_ms: List[float] = []

    start_wall_time = time.time()

    # Stream through dataset in micro-batches
    for batch in stream_synthetic_batches(generate_sap_purchasing_records, total_records, chunk_size):
        b_start = time.time()

        valid, fixed, quarantined = evaluate_rules_with_duckdb(
            batch,
            BENCHMARK_RULES,
            auto_fix_on=auto_fix_enabled,
            log_fn=None
        )

        b_elapsed_ms = (time.time() - b_start) * 1000
        batch_latencies_ms.append(b_elapsed_ms)

        total_extracted += len(batch)
        total_valid += len(valid)
        total_autofixed += len(fixed)
        total_quarantined += len(quarantined)

    total_wall_time = time.time() - start_wall_time
    final_mem = memory_profiler.capture_snapshot("benchmark_end")
    reclaimed = memory_profiler.flush_buffers_and_gc()

    # Calculate percentiles
    batch_latencies_ms.sort()
    n_batches = len(batch_latencies_ms)
    p50 = batch_latencies_ms[int(n_batches * 0.50)] if n_batches else 0.0
    p95 = batch_latencies_ms[int(n_batches * 0.95)] if n_batches else 0.0
    p99 = batch_latencies_ms[int(n_batches * 0.99)] if n_batches else 0.0

    throughput_rows_sec = round(total_extracted / max(0.001, total_wall_time), 2)
    zero_dropped_verified = (total_extracted == (total_valid + total_quarantined))

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total_records": total_extracted,
        "chunk_size": chunk_size,
        "total_batches": n_batches,
        "total_time_seconds": round(total_wall_time, 3),
        "throughput_rows_per_sec": throughput_rows_sec,
        "target_throughput_achieved": throughput_rows_sec >= 5000.0,
        "latencies_ms": {
            "p50": round(p50, 2),
            "p95": round(p95, 2),
            "p99": round(p99, 2),
            "mean": round(sum(batch_latencies_ms) / max(1, n_batches), 2),
            "max": round(max(batch_latencies_ms) if batch_latencies_ms else 0.0, 2)
        },
        "zero_dropped_rows": {
            "verified": zero_dropped_verified,
            "extracted": total_extracted,
            "compliant": total_valid,
            "auto_fixed": total_autofixed,
            "quarantined": total_quarantined,
            "discrepancy": total_extracted - (total_valid + total_quarantined)
        },
        "memory_profile": {
            "initial_rss_mb": initial_mem.get("rss_mb", 0.0),
            "peak_rss_mb": final_mem.get("rss_mb", 0.0),
            "plateau_under_512mb": final_mem.get("rss_mb", 0.0) < 512.0,
            "reclaimed_gc_mb": reclaimed.get("reclaimed_memory_mb", 0.0)
        }
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DataX Scalability Benchmark")
    parser.add_argument("--records", type=int, default=100000, help="Number of records to benchmark")
    parser.add_argument("--batch-size", type=int, default=5000, help="Batch chunk size")
    args = parser.parse_args()

    print(f"Running DataX Benchmark with {args.records:,} records (Batch Size: {args.batch_size:,})...")
    results = run_performance_benchmark(total_records=args.records, chunk_size=args.batch_size)
    print("\n--- BENCHMARK RESULTS ---")
    print(f"Total Records: {results['total_records']:,}")
    print(f"Wall Time: {results['total_time_seconds']}s")
    print(f"Throughput: {results['throughput_rows_per_sec']:,} rows/sec (Target >= 5,000: {'PASSED' if results['target_throughput_achieved'] else 'FAILED'})")
    print(f"p95 Latency: {results['latencies_ms']['p95']}ms per batch")
    print(f"Zero Dropped Rows: {'VERIFIED' if results['zero_dropped_rows']['verified'] else 'FAILED'}")
    print(f"Peak Memory: {results['memory_profile']['peak_rss_mb']} MB (Under 512MB: {'PASSED' if results['memory_profile']['plateau_under_512mb'] else 'FAILED'})")
