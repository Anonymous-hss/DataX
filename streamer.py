"""
DataX High-Throughput Streaming & Chunked Execution Engine
Provides server-side cursor generators and batch upsert writers to guarantee constant memory footprint.
"""

import re
import json
from decimal import Decimal
from datetime import datetime
from typing import Generator, List, Dict, Any, Optional

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values

from db_pool import db_pool


def stream_postgresql_records(
    uri: str,
    table_name: str,
    columns: Optional[List[str]] = None,
    limit: Optional[int] = None,
    chunk_size: int = 5000
) -> Generator[List[Dict[str, Any]], None, None]:
    """
    Streams records from PostgreSQL using a server-side named cursor.
    Yields micro-batches of `chunk_size` rows to maintain a constant memory footprint.
    """
    col_str = ", ".join([f'"{c}"' for c in columns]) if columns else "*"
    limit_clause = f"LIMIT {limit}" if limit else ""
    query = f"SELECT {col_str} FROM {table_name} {limit_clause};"

    cursor_name = f"datax_stream_{int(datetime.utcnow().timestamp() * 1000) % 1000000}"

    with db_pool.get_connection(uri) as conn:
        with conn.cursor(name=cursor_name, cursor_factory=RealDictCursor) as cur:
            cur.itersize = chunk_size
            cur.execute(query)

            while True:
                rows = cur.fetchmany(chunk_size)
                if not rows:
                    break

                batch = []
                for r in rows:
                    row_dict = {}
                    for k, v in r.items():
                        if isinstance(v, Decimal):
                            row_dict[k] = float(v)
                        elif isinstance(v, datetime):
                            row_dict[k] = v.isoformat()
                        else:
                            row_dict[k] = v
                    batch.append(row_dict)

                yield batch


def stream_synthetic_batches(
    generator_func,
    total_count: int,
    chunk_size: int = 5000
) -> Generator[List[Dict[str, Any]], None, None]:
    """
    Generates synthetic enterprise datasets in micro-batches.
    Prevents large array allocations for 100K-1M record benchmarks.
    """
    generated = 0
    while generated < total_count:
        current_batch_size = min(chunk_size, total_count - generated)
        batch = generator_func(count=current_batch_size)
        generated += len(batch)
        yield batch


def bulk_upsert_chunked_pg(
    conn,
    table_name: str,
    records: List[Dict[str, Any]],
    primary_key: str,
    chunk_size: int = 5000
) -> int:
    """
    High-throughput bulk upsert using psycopg2 execute_values with page_size=5000.
    Replaces row-by-row iteration with fast vector writes.
    """
    if not records:
        return 0

    sample_cols = list(records[0].keys())
    sanitized_cols = [re.sub(r'[^a-zA-Z0-9_]', '_', c) for c in sample_cols]
    col_names_str = ", ".join([f'"{c}"' for c in sanitized_cols])

    # Build ON CONFLICT DO UPDATE clause
    update_assignments = ", ".join([
        f'"{sc}" = EXCLUDED."{sc}"'
        for sc in sanitized_cols
        if sc.lower() != primary_key.lower()
    ])

    if update_assignments:
        on_conflict = f'ON CONFLICT ("{primary_key}") DO UPDATE SET {update_assignments}'
    else:
        on_conflict = f'ON CONFLICT ("{primary_key}") DO NOTHING'

    query = f"""
        INSERT INTO {table_name} ({col_names_str})
        VALUES %s
        {on_conflict};
    """

    total_committed = 0
    with conn.cursor() as cur:
        for i in range(0, len(records), chunk_size):
            chunk = records[i : i + chunk_size]
            data_tuples = [
                tuple(
                    json.dumps(r.get(c)) if isinstance(r.get(c), (dict, list)) else r.get(c)
                    for c in sample_cols
                )
                for r in chunk
            ]
            execute_values(
                cur,
                query,
                data_tuples,
                template=None,
                page_size=chunk_size
            )
            total_committed += len(chunk)

    return total_committed
