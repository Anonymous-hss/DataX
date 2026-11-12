import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.DATAX_DATABASE_URI || '';

export const pool = connectionString ? new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}) : null;

let dbInitialized = false;
let isPostgresAvailable = false;

// In-memory fallback map for local development when PostgreSQL is not connected
const inMemoryUsers = new Map();

/**
 * Initializes the required auth tables if they don't already exist.
 */
export async function initAuthDb() {
  if (dbInitialized) return;
  if (!pool) {
    dbInitialized = true;
    isPostgresAvailable = false;
    console.log('[DataX Auth DB] Running with local in-memory auth store (PostgreSQL connection string not provided).');
    return;
  }
  try {
    const client = await pool.connect();
    try {
      await client.query(`
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

        -- Default enterprise tenant
        INSERT INTO datax_tenants (id, name, plan)
        VALUES ('tenant_enterprise', 'Enterprise Production SaaS', 'enterprise')
        ON CONFLICT (id) DO NOTHING;
      `);
      dbInitialized = true;
      isPostgresAvailable = true;
      console.log('[DataX Auth DB] Connected to PostgreSQL auth database successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    dbInitialized = true;
    isPostgresAvailable = false;
    console.warn('[DataX Auth DB] PostgreSQL connection unavailable, falling back to local in-memory auth store:', err.message);
  }
}

export async function getUserByEmail(email) {
  await initAuthDb();
  const normalized = String(email || '').trim().toLowerCase();
  if (isPostgresAvailable && pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM datax_users WHERE LOWER(email) = $1 LIMIT 1',
        [normalized]
      );
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      console.warn('[DataX Auth DB] PostgreSQL query failed, checking in-memory store:', err.message);
    }
  }
  for (const user of inMemoryUsers.values()) {
    if (user.email.toLowerCase() === normalized) {
      return user;
    }
  }
  return null;
}

export async function getUserById(id) {
  await initAuthDb();
  if (isPostgresAvailable && pool) {
    try {
      const res = await pool.query(
        'SELECT id, tenant_id, email, full_name, avatar_url, role, is_active, created_at FROM datax_users WHERE id = $1 LIMIT 1',
        [id]
      );
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      console.warn('[DataX Auth DB] PostgreSQL query failed, checking in-memory store:', err.message);
    }
  }
  return inMemoryUsers.get(id) || null;
}

export async function createUser({ email, passwordHash, fullName, role = 'data_engineer', tenantId = 'tenant_enterprise', avatarUrl = null }) {
  await initAuthDb();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (isPostgresAvailable && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO datax_users (email, password_hash, full_name, role, tenant_id, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, tenant_id, email, full_name, avatar_url, role, is_active, created_at`,
        [normalizedEmail, passwordHash, fullName.trim(), role, tenantId, avatarUrl]
      );
      return res.rows[0];
    } catch (err) {
      console.warn('[DataX Auth DB] PostgreSQL insert failed, saving to in-memory store:', err.message);
    }
  }
  const newUser = {
    id: crypto.randomUUID(),
    tenant_id: tenantId || 'tenant_enterprise',
    email: normalizedEmail,
    password_hash: passwordHash,
    full_name: fullName.trim(),
    avatar_url: avatarUrl,
    role,
    is_active: true,
    created_at: new Date().toISOString()
  };
  inMemoryUsers.set(newUser.id, newUser);
  return newUser;
}
