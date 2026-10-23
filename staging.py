"""
DataX Target Safe Staging Protocol (ARC-01)
Stages writes into temporary tables, validates integrity, and executes atomic transaction commits.
"""

import re
import json
import time
from typing import List, Dict, Any, Tuple
from psycopg2.extras import execute_values
from streamer import bulk_upsert_chunked_pg


def execute_safe_staged_commit(
    conn,
    target_table: str,
    valid_records: List[Dict[str, Any]],
    primary_key: str,
    write_mode: str = "append",
    chunk_size: int = 5000
) -> Tuple[bool, int, str]:
    """
    ARC-01: Target Safe Staging Protocol.
    Stages records into temporary staging table, checks consistency, and merges/swaps atomically.
    Returns: (success: bool, rows_committed: int, message: str)
    """
    if not valid_records:
        return True, 0, "No records to commit."

    staging_table = f"{target_table}_staged_{int(time.time() * 1000) % 1000000}"
    sample_row = valid_records[0]

    # Generate sanitized column definitions
    col_defs = []
    for k, val in sample_row.items():
        clean_col = re.sub(r'[^a-zA-Z0-9_]', '_', k)
        if k.lower() == primary_key.lower():
            col_defs.append(f'"{clean_col}" VARCHAR(64) PRIMARY KEY')
        elif isinstance(val, (int, float)):
            col_defs.append(f'"{clean_col}" NUMERIC(16, 4)')
        else:
            col_defs.append(f'"{clean_col}" TEXT')

    col_defs.append('"datax_status" VARCHAR(64) DEFAULT \'AI_VERIFIED_CLEAN\'')
    col_defs.append('"reconciled_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP')
    cols_sql = ", ".join(col_defs)

    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            # 1. Create target table if it doesn't already exist
            cur.execute(f'CREATE TABLE IF NOT EXISTS "{target_table}" ({cols_sql});')

            # 2. Create isolated staging table
            cur.execute(f'CREATE TABLE "{staging_table}" ({cols_sql});')

            # 3. Load records into staging table via chunked bulk upsert
            bulk_upsert_chunked_pg(conn, staging_table, valid_records, primary_key, chunk_size=chunk_size)

            # 4. Consistency & Integrity Validation Check
            cur.execute(f'SELECT COUNT(*), COUNT("{primary_key}") FROM "{staging_table}";')
            staged_count, non_null_pks = cur.fetchone()

            if staged_count != len(valid_records):
                raise ValueError(
                    f"Integrity check failed: Expected {len(valid_records)} rows, staged {staged_count}."
                )
            if non_null_pks != staged_count:
                raise ValueError(
                    f"Integrity check failed: Found {staged_count - non_null_pks} null primary keys."
                )

            # 5. Atomic Transition
            if write_mode == "overwrite":
                # Atomic swap pattern
                old_table = f"{target_table}_old_{int(time.time() * 1000) % 1000000}"
                cur.execute(f'ALTER TABLE "{target_table}" RENAME TO "{old_table}";')
                cur.execute(f'ALTER TABLE "{staging_table}" RENAME TO "{target_table}";')
                cur.execute(f'DROP TABLE IF EXISTS "{old_table}";')
            else:
                # High-speed bulk upsert from staged table into production target
                sample_cols = [re.sub(r'[^a-zA-Z0-9_]', '_', c) for c in sample_row.keys()]
                col_names_str = ", ".join([f'"{c}"' for c in sample_cols])
                update_assignments = ", ".join([
                    f'"{c}" = EXCLUDED."{c}"'
                    for c in sample_cols
                    if c.lower() != primary_key.lower()
                ])
                on_conflict = f'ON CONFLICT ("{primary_key}") DO UPDATE SET {update_assignments}' if update_assignments else f'ON CONFLICT ("{primary_key}") DO NOTHING'

                cur.execute(f"""
                    INSERT INTO "{target_table}" ({col_names_str})
                    SELECT {col_names_str} FROM "{staging_table}"
                    {on_conflict};
                """)
                cur.execute(f'DROP TABLE IF EXISTS "{staging_table}";')

            conn.commit()
            return True, staged_count, f"Safely staged and committed {staged_count} records into '{target_table}'."

    except Exception as e:
        conn.rollback()
        # Clean up orphan staging table if it was created
        try:
            with conn.cursor() as cur:
                cur.execute(f'DROP TABLE IF EXISTS "{staging_table}";')
            conn.commit()
        except Exception:
            pass
        raise e
    finally:
        conn.autocommit = True
