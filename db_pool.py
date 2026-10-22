"""
DataX Enterprise Database Connection Pooling
Manages thread-safe connection pools for PostgreSQL/Neon/Timescale to prevent connection exhaustion.
"""

import time
import threading
from contextlib import contextmanager
from typing import Dict, Any, Optional

import psycopg2
from psycopg2 import pool


class DatabasePoolManager:
    """
    Thread-safe connection pool manager.
    Maintains ThreadedConnectionPool instances per database URI.
    """

    def __init__(self, min_conn: int = 2, max_conn: int = 20):
        self.min_conn = min_conn
        self.max_conn = max_conn
        self._pools: Dict[str, pool.ThreadedConnectionPool] = {}
        self._lock = threading.Lock()
        self._active_checkouts: Dict[str, int] = {}

    def _get_or_create_pool(self, uri: str) -> pool.ThreadedConnectionPool:
        normalized = uri.strip()
        with self._lock:
            if normalized not in self._pools:
                # Initialize threaded pool
                new_pool = pool.ThreadedConnectionPool(
                    minconn=self.min_conn,
                    maxconn=self.max_conn,
                    dsn=normalized,
                    connect_timeout=10
                )
                self._pools[normalized] = new_pool
                self._active_checkouts[normalized] = 0
            return self._pools[normalized]

    @contextmanager
    def get_connection(self, uri: str):
        """
        Context manager to acquire a connection from the pool and return it on exit.
        Performs liveness check (SELECT 1) and auto-reconnects if broken.
        """
        normalized = uri.strip()
        p = self._get_or_create_pool(normalized)
        conn = None
        try:
            conn = p.getconn()
            with self._lock:
                self._active_checkouts[normalized] = self._active_checkouts.get(normalized, 0) + 1

            # Liveness ping
            try:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1;")
            except Exception:
                # Connection is stale; replace it
                try:
                    p.putconn(conn, close=True)
                except Exception:
                    pass
                conn = p.getconn()

            yield conn
        finally:
            if conn:
                try:
                    p.putconn(conn)
                except Exception:
                    pass
                with self._lock:
                    if normalized in self._active_checkouts:
                        self._active_checkouts[normalized] = max(0, self._active_checkouts[normalized] - 1)

    def get_stats(self) -> Dict[str, Any]:
        """Returns connection pool health and utilization telemetry."""
        with self._lock:
            stats = {
                "total_pools": len(self._pools),
                "min_connections_per_pool": self.min_conn,
                "max_connections_per_pool": self.max_conn,
                "pools": {}
            }
            for uri, p in self._pools.items():
                # Obfuscate URI password for security
                sanitized_uri = uri.split("@")[-1] if "@" in uri else uri[:15] + "..."
                active = self._active_checkouts.get(uri, 0)
                stats["pools"][sanitized_uri] = {
                    "active_checkouts": active,
                    "available_slots": max(0, self.max_conn - active),
                    "capacity_pct": round((active / self.max_conn) * 100, 1)
                }
            return stats

    def close_all(self):
        """Closes all connection pools gracefully."""
        with self._lock:
            for p in self._pools.values():
                try:
                    p.closeall()
                except Exception:
                    pass
            self._pools.clear()
            self._active_checkouts.clear()


# Global Singleton Pool Manager
db_pool = DatabasePoolManager(min_conn=2, max_conn=20)
