"""
DataX Enterprise Authentication & User Management Engine (Postgres + Offline Durable Fallback)
Provides secure password hashing (bcrypt / PBKDF2), JWT token lifecycle,
and dual-layer persistence (Neon PostgreSQL with local fallback).
"""

import os
import json
import time
import uuid
import hmac
import hashlib
import logging
from typing import Optional, Dict, Any

from jwt_config import JWT_SECRET

try:
    import jwt
except ImportError:
    jwt = None

try:
    import bcrypt
except ImportError:
    bcrypt = None

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None

logger = logging.getLogger("DataX.AuthEngine")

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

NEON_POSTGRES_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("DATAX_DATABASE_URI")
    or os.getenv("NEON_DATABASE_URI")
    or "postgresql://neondb_owner:npg_Eim1u6bIldRL@ep-square-breeze-aqokq2fe-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
)

LOCAL_STORE_PATH = os.path.join(os.getcwd(), ".datax_auth_store.json")


def _hash_password(password: str) -> str:
    """Hash password using bcrypt if available, else PBKDF2-SHA256."""
    if bcrypt:
        salt = bcrypt.gensalt(10)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2:{salt}:{dk.hex()}"


def _verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt or PBKDF2 hash."""
    if not hashed:
        return False
    if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
        if bcrypt:
            return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        return False
    if hashed.startswith("pbkdf2:"):
        parts = hashed.split(":")
        if len(parts) == 3:
            salt = parts[1]
            original_dk = parts[2]
            dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
            return hmac.compare_digest(dk.hex(), original_dk)
    # Plain text comparison only for legacy test mock accounts
    return hmac.compare_digest(password, hashed)


def _sign_jwt(user: Dict[str, Any]) -> str:
    """Sign standard JWT bearer token."""
    payload = {
        "userId": str(user.get("id")),
        "email": user.get("email"),
        "fullName": user.get("full_name") or user.get("fullName"),
        "role": user.get("role", "data_engineer"),
        "tenantId": user.get("tenant_id") or user.get("tenantId", "tenant_enterprise"),
        "exp": int(time.time()) + (JWT_EXPIRATION_HOURS * 3600),
        "iat": int(time.time())
    }
    if jwt:
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    # Fallback signed bearer token
    body = json.dumps(payload, sort_keys=True)
    sig = hmac.new(JWT_SECRET.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"dx_token.{body.encode('utf-8').hex()}.{sig}"


def _verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify JWT token."""
    if not token:
        return None
    token = token.replace("Bearer ", "").strip()
    if jwt:
        try:
            return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except Exception:
            pass
    if token.startswith("dx_token."):
        try:
            parts = token.split(".")
            if len(parts) == 3:
                body_bytes = bytes.fromhex(parts[1])
                expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
                if hmac.compare_digest(expected_sig, parts[2]):
                    return json.loads(body_bytes.decode("utf-8"))
        except Exception:
            pass
    return None


class AuthDatabase:
    """Dual-layer Auth Database: Neon PostgreSQL with local JSON backup store."""
    def __init__(self):
        self._db_initialized = False

    def _get_pg_connection(self):
        if not psycopg2 or not NEON_POSTGRES_URL or not NEON_POSTGRES_URL.strip():
            return None
        try:
            return psycopg2.connect(NEON_POSTGRES_URL, connect_timeout=5)
        except Exception as e:
            logger.warning(f"Postgres connect error: {e}")
            return None

    def init_db(self):
        if self._db_initialized:
            return
        conn = self._get_pg_connection()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS datax_tenants (
                            id VARCHAR(64) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            plan VARCHAR(50) DEFAULT 'enterprise',
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );

                        CREATE TABLE IF NOT EXISTS datax_users (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            tenant_id VARCHAR(64) REFERENCES datax_tenants(id) ON DELETE SET NULL,
                            email VARCHAR(255) UNIQUE NOT NULL,
                            password_hash VARCHAR(255) NOT NULL,
                            full_name VARCHAR(255) NOT NULL,
                            avatar_url TEXT,
                            role VARCHAR(50) DEFAULT 'data_engineer',
                            is_active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );

                        CREATE INDEX IF NOT EXISTS idx_datax_users_email ON datax_users(email);
                        CREATE INDEX IF NOT EXISTS idx_datax_users_tenant_id ON datax_users(tenant_id);

                        INSERT INTO datax_tenants (id, name, plan)
                        VALUES ('tenant_enterprise', 'Enterprise Production SaaS', 'enterprise')
                        ON CONFLICT (id) DO NOTHING;
                    """)
                    conn.commit()
                self._db_initialized = True
            except Exception as e:
                logger.error(f"Postgres schema init error: {e}")
                conn.rollback()
            finally:
                conn.close()

    def _load_local_users(self) -> Dict[str, Any]:
        if os.path.exists(LOCAL_STORE_PATH):
            try:
                with open(LOCAL_STORE_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_local_users(self, store: Dict[str, Any]):
        try:
            with open(LOCAL_STORE_PATH, "w", encoding="utf-8") as f:
                json.dump(store, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save local auth store: {e}")

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        self.init_db()
        email_clean = email.strip().lower()
        conn = self._get_pg_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT * FROM datax_users WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                    row = cur.fetchone()
                    if row:
                        return dict(row)
            except Exception as e:
                logger.warning(f"Error querying user by email in Postgres: {e}")
            finally:
                conn.close()
        # Fallback local store
        store = self._load_local_users()
        return store.get(email_clean)

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        self.init_db()
        conn = self._get_pg_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT * FROM datax_users WHERE id = %s LIMIT 1", (user_id,))
                    row = cur.fetchone()
                    if row:
                        return dict(row)
            except Exception as e:
                logger.warning(f"Error querying user by id in Postgres: {e}")
            finally:
                conn.close()
        store = self._load_local_users()
        for u in store.values():
            if str(u.get("id")) == str(user_id):
                return u
        return None

    def create_user(self, email: str, password_hash: str, full_name: str,
                    role: str = "data_engineer", tenant_id: str = "tenant_enterprise",
                    avatar_url: Optional[str] = None) -> Dict[str, Any]:
        self.init_db()
        email_clean = email.strip().lower()
        user_id = str(uuid.uuid4())
        created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        conn = self._get_pg_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        INSERT INTO datax_users (email, password_hash, full_name, role, tenant_id, avatar_url)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id, tenant_id, email, full_name, avatar_url, role, is_active, created_at
                    """, (email_clean, password_hash, full_name, role, tenant_id, avatar_url))
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        res = dict(row)
                        # Also backup locally
                        store = self._load_local_users()
                        store[email_clean] = res
                        store[email_clean]["password_hash"] = password_hash
                        self._save_local_users(store)
                        return res
            except Exception as e:
                logger.error(f"Error inserting user in Postgres: {e}")
                conn.rollback()
            finally:
                conn.close()

        # Local fallback store
        user_record = {
            "id": user_id,
            "tenant_id": tenant_id,
            "email": email_clean,
            "password_hash": password_hash,
            "full_name": full_name,
            "avatar_url": avatar_url,
            "role": role,
            "is_active": True,
            "created_at": created_at
        }
        store = self._load_local_users()
        store[email_clean] = user_record
        self._save_local_users(store)
        return user_record


db = AuthDatabase()


def format_user_payload(u: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(u.get("id", "")),
        "email": str(u.get("email", "")),
        "fullName": str(u.get("full_name") or u.get("fullName") or ""),
        "avatarUrl": u.get("avatar_url") or u.get("avatarUrl") or None,
        "role": str(u.get("role", "data_engineer")),
        "tenantId": str(u.get("tenant_id") or u.get("tenantId", "tenant_enterprise")),
        "createdAt": str(u.get("created_at", ""))
    }


def register_user(email: str, password: str, full_name: str, tenant_id: str = "tenant_enterprise"):
    if not email or not password or not full_name:
        return {"status": 400, "data": {"error": "Email, password, and full name are required."}}

    email_clean = email.strip().lower()
    if "@" not in email_clean or len(email_clean) < 5:
        return {"status": 400, "data": {"error": "Please provide a valid enterprise email address."}}

    if len(password) < 6:
        return {"status": 400, "data": {"error": "Password must be at least 6 characters."}}

    existing = db.get_user_by_email(email_clean)
    if existing:
        return {"status": 409, "data": {"error": "An account with this email already exists."}}

    password_hash = _hash_password(password)
    user_record = db.create_user(
        email=email_clean,
        password_hash=password_hash,
        full_name=full_name.strip(),
        tenant_id=tenant_id or "tenant_enterprise"
    )

    token = _sign_jwt(user_record)
    return {
        "status": 201,
        "data": {
            "message": "Account created successfully.",
            "token": token,
            "user": format_user_payload(user_record)
        }
    }


def login_user(email: str, password: str):
    if not email or not password:
        return {"status": 400, "data": {"error": "Email and password are required."}}

    email_clean = email.strip().lower()
    user_record = db.get_user_by_email(email_clean)
    if not user_record:
        return {"status": 401, "data": {"error": "Invalid email or password."}}

    if not user_record.get("is_active", True):
        return {"status": 403, "data": {"error": "This enterprise account has been deactivated."}}

    if not _verify_password(password, user_record.get("password_hash", "")):
        return {"status": 401, "data": {"error": "Invalid email or password."}}

    token = _sign_jwt(user_record)
    return {
        "status": 200,
        "data": {
            "message": "Authentication successful.",
            "token": token,
            "user": format_user_payload(user_record)
        }
    }


def get_current_user_profile(auth_header: Optional[str]):
    if not auth_header:
        return {"status": 401, "data": {"error": "Authorization header missing or invalid format."}}

    decoded = _verify_jwt(auth_header)
    if not decoded or not decoded.get("userId"):
        return {"status": 401, "data": {"error": "Invalid or expired JWT token."}}

    user_record = db.get_user_by_id(decoded.get("userId"))
    if not user_record:
        # Fallback to token payload if user record in DB was removed
        user_record = {
            "id": decoded.get("userId"),
            "email": decoded.get("email"),
            "full_name": decoded.get("fullName"),
            "role": decoded.get("role"),
            "tenant_id": decoded.get("tenantId")
        }

    return {
        "status": 200,
        "data": {
            "user": format_user_payload(user_record)
        }
    }
