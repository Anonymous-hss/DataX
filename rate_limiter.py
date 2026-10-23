"""
DataX Rate Limiting & Abuse Prevention Middleware (SEC-06)
Implements sliding-window rate limiting per client IP (60 req/min default).
"""

import time
import threading
from typing import Dict, List, Tuple, Any
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SlidingWindowRateLimiter:
    """
    Thread-safe sliding-window rate limiter per client IP.
    """

    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def is_allowed(self, client_ip: str) -> Tuple[bool, int, int]:
        """
        Checks if the client IP is allowed.
        Returns: (is_allowed, remaining_requests, retry_after_seconds)
        """
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            if client_ip not in self._requests:
                self._requests[client_ip] = []

            # Prune timestamps outside current window
            self._requests[client_ip] = [
                ts for ts in self._requests[client_ip] if ts > window_start
            ]

            current_count = len(self._requests[client_ip])
            if current_count >= self.max_requests:
                oldest = self._requests[client_ip][0]
                retry_after = max(1, int(oldest + self.window_seconds - now))
                return False, 0, retry_after

            # Record this request
            self._requests[client_ip].append(now)
            remaining = max(0, self.max_requests - (current_count + 1))
            return True, remaining, 0

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "active_tracked_ips": len(self._requests),
                "limit_per_minute": self.max_requests,
                "window_seconds": self.window_seconds
            }


rate_limiter = SlidingWindowRateLimiter(max_requests=60, window_seconds=60)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Starlette middleware intercepting requests to enforce rate limits."""

    async def dispatch(self, request: Request, call_next):
        # Exempt health probes and CORS pre-flight OPTIONS
        path = request.url.path
        if request.method == "OPTIONS" or path in ["/", "/health", "/favicon.ico"]:
            return await call_next(request)

        # Extract client IP (handling X-Forwarded-For if behind reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        allowed, remaining, retry_after = rate_limiter.is_allowed(client_ip)
        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests from {client_ip}. Maximum allowed is 60 requests per minute.",
                    "retry_after_seconds": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(rate_limiter.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
