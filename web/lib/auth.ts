import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { queryOne } from './postgres';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '90d';

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  provider: 'apple' | 'google';
  personal_info: Record<string, unknown>;
  settings: Record<string, unknown>;
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Get user from request (extract from Authorization header)
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("Auth Failed: Missing Authorization header");
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return getUserById(payload.userId);
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await queryOne<AuthUser>(
    'SELECT id, email, username, provider, personal_info, settings FROM users WHERE id = $1',
    [userId]
  );
  
  if (!user) return null;
  
  return user;
}


// Get or create Google user
export async function getOrCreateGoogleUser(
  email: string,
  username: string
): Promise<AuthUser> {
  // Check if user exists
  let user = await queryOne<AuthUser>(
    'SELECT id, email, username, provider, personal_info, settings FROM users WHERE email = $1',
    [email]
  );

  if (user) {
    return user;
  }

  user = await queryOne<AuthUser>(
    `INSERT INTO users (email, username, provider, personal_info, settings)
     VALUES ($1, $2, 'google', $3, $4)
     RETURNING id, email, username, provider, personal_info, settings`,
    [email, username, {}, {}]
  );

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user!;
}

// Get or create Apple user
export async function getOrCreateAppleUser(
  email: string,
  username: string
): Promise<AuthUser> {
  // Check if user exists
  let user = await queryOne<AuthUser>(
    'SELECT id, email, username, provider, personal_info, settings FROM users WHERE email = $1',
    [email]
  );

  if (user) {
    return user;
  }

  user = await queryOne<AuthUser>(
    `INSERT INTO users (email, username, provider, personal_info, settings)
     VALUES ($1, $2, 'apple', $3, $4)
     RETURNING id, email, username, provider, personal_info, settings`,
    [email, username, {}, {}]
  );

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user!;
}
