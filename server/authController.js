import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getUserByEmail, getUserById, createUser } from './db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'datax_enterprise_jwt_super_secret_key_2026_secure';
const JWT_EXPIRES_IN = '7d';

export function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      tenantId: user.tenant_id
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url || null,
    role: user.role || 'data_engineer',
    tenantId: user.tenant_id || 'tenant_enterprise',
    createdAt: user.created_at
  };
}

export async function handleRegister({ email, password, fullName, tenantId }) {
  if (!email || !password || !fullName) {
    return { status: 400, data: { error: 'Email, password, and full name are required.' } };
  }

  const emailTrimmed = String(email).trim().toLowerCase();
  if (!emailTrimmed.includes('@') || emailTrimmed.length < 5) {
    return { status: 400, data: { error: 'Please provide a valid enterprise email address.' } };
  }

  if (password.length < 6) {
    return { status: 400, data: { error: 'Password must be at least 6 characters.' } };
  }

  const existing = await getUserByEmail(emailTrimmed);
  if (existing) {
    return { status: 409, data: { error: 'An account with this email already exists.' } };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await createUser({
    email: emailTrimmed,
    passwordHash,
    fullName: fullName.trim(),
    tenantId: tenantId || 'tenant_enterprise'
  });

  const token = signToken(newUser);
  return {
    status: 201,
    data: {
      message: 'Account created successfully.',
      token,
      user: formatUserResponse(newUser)
    }
  };
}

export async function handleLogin({ email, password }) {
  if (!email || !password) {
    return { status: 400, data: { error: 'Email and password are required.' } };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return { status: 401, data: { error: 'Invalid email or password.' } };
  }

  if (!user.is_active) {
    return { status: 403, data: { error: 'This enterprise account has been deactivated.' } };
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return { status: 401, data: { error: 'Invalid email or password.' } };
  }

  const token = signToken(user);
  return {
    status: 200,
    data: {
      message: 'Authentication successful.',
      token,
      user: formatUserResponse(user)
    }
  };
}

export async function handleGetCurrentUser(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 401, data: { error: 'Authorization header missing or invalid format.' } };
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return { status: 401, data: { error: 'Invalid or expired JWT token.' } };
  }

  const user = await getUserById(decoded.userId);
  if (!user) {
    return { status: 404, data: { error: 'User account not found.' } };
  }

  return {
    status: 200,
    data: {
      user: formatUserResponse(user)
    }
  };
}
