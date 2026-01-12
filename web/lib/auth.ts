import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { query, queryOne } from './postgres';

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
  access?: {
    is_vip: boolean;
    reputation_score: number;
    xray_charges: number;
    xray_target: string | null;
    charges_refill_date: string | null;
  };
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

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check and update refill date and charges if needed
async function checkAndUpdateRefill(userId: string, currentRefillDate: string | null): Promise<void> {
  const today = getTodayDate();
  
  // If refill date is not today, update it to today and reset charges to 1
  if (currentRefillDate !== today) {
    await query(
      `UPDATE user_access 
       SET charges_refill_date = $1, xray_charges = 1 
       WHERE user_id = $2`,
      [today, userId]
    );
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
  const result = await queryOne<{
    id: string;
    email: string;
    username: string | null;
    provider: 'apple' | 'google';
    personal_info: Record<string, unknown>;
    settings: Record<string, unknown>;
    access_id: string | null;
    is_vip: boolean | null;
    reputation_score: number | null;
    xray_charges: number | null;
    xray_target: string | null;
    charges_refill_date: string | null;
  }>(
    `SELECT 
      u.id, 
      u.email, 
      u.username, 
      u.provider, 
      u.personal_info, 
      u.settings,
      ua.id as access_id,
      ua.is_vip,
      ua.reputation_score,
      ua.xray_charges,
      ua.xray_target,
      ua.charges_refill_date
    FROM users u
    LEFT JOIN user_access ua ON u.id = ua.user_id
    WHERE u.id = $1`,
    [userId]
  );
  
  if (!result) return null;
  
  // Check if user has reputation_score <= 0 (banned/restricted) - prevent login
  if (result.reputation_score !== null && result.reputation_score <= 0) {
    return null;
  }
  
  const user: AuthUser = {
    id: result.id,
    email: result.email,
    username: result.username,
    provider: result.provider,
    personal_info: result.personal_info,
    settings: result.settings,
  };

  // Include access if it exists
  if (result.access_id) {
    // Check and update refill date and charges if needed
    await checkAndUpdateRefill(result.id, result.charges_refill_date);
    
    // Re-fetch access data to get updated values
    const updatedAccess = await queryOne<{
      is_vip: boolean;
      reputation_score: number;
      xray_charges: number;
      xray_target: string | null;
      charges_refill_date: string | null;
    }>(
      'SELECT is_vip, reputation_score, xray_charges, xray_target, charges_refill_date FROM user_access WHERE user_id = $1',
      [result.id]
    );

    if (updatedAccess) {
      // Double-check reputation_score after refetch
      if (updatedAccess.reputation_score <= 0) {
        return null;
      }
      
      user.access = {
        is_vip: updatedAccess.is_vip,
        reputation_score: updatedAccess.reputation_score,
        xray_charges: updatedAccess.xray_charges,
        xray_target: updatedAccess.xray_target,
        charges_refill_date: updatedAccess.charges_refill_date,
      };
    } else {
      // Fallback to original values if update failed
      // But still check reputation_score
      if (result.reputation_score !== null && result.reputation_score <= 0) {
        return null;
      }
      
      user.access = {
        is_vip: result.is_vip!,
        reputation_score: result.reputation_score!,
        xray_charges: result.xray_charges!,
        xray_target: result.xray_target,
        charges_refill_date: result.charges_refill_date,
      };
    }
  }
  
  return user;
}


// Get or create Google user
export async function getOrCreateGoogleUser(
  email: string,
  username: string
): Promise<AuthUser> {
  // Check if user exists
  let result = await queryOne<{
    id: string;
    email: string;
    username: string | null;
    provider: 'apple' | 'google';
    personal_info: Record<string, unknown>;
    settings: Record<string, unknown>;
    access_id: string | null;
    is_vip: boolean | null;
    reputation_score: number | null;
    xray_charges: number | null;
    xray_target: string | null;
    charges_refill_date: string | null;
  }>(
    `SELECT 
      u.id, 
      u.email, 
      u.username, 
      u.provider, 
      u.personal_info, 
      u.settings,
      ua.id as access_id,
      ua.is_vip,
      ua.reputation_score,
      ua.xray_charges,
      ua.xray_target,
      ua.charges_refill_date
    FROM users u
    LEFT JOIN user_access ua ON u.id = ua.user_id
    WHERE u.email = $1`,
    [email]
  );

  if (result) {
    // Check if user has reputation_score <= 0 (banned/restricted) - prevent login
    if (result.reputation_score !== null && result.reputation_score <= 0) {
      throw new Error('Account restricted');
    }
    
    const user: AuthUser = {
      id: result.id,
      email: result.email,
      username: result.username,
      provider: result.provider,
      personal_info: result.personal_info,
      settings: result.settings,
    };

    // Include access if it exists
    if (result.access_id) {
      // Check and update refill date and charges if needed
      await checkAndUpdateRefill(result.id, result.charges_refill_date);
      
      // Re-fetch access data to get updated values
      const updatedAccess = await queryOne<{
        is_vip: boolean;
        reputation_score: number;
        xray_charges: number;
        xray_target: string | null;
        charges_refill_date: string | null;
      }>(
        'SELECT is_vip, reputation_score, xray_charges, xray_target, charges_refill_date FROM user_access WHERE user_id = $1',
        [result.id]
      );

      if (updatedAccess) {
        // Double-check reputation_score after refetch
        if (updatedAccess.reputation_score <= 0) {
          throw new Error('Account restricted');
        }
        
        user.access = {
          is_vip: updatedAccess.is_vip,
          reputation_score: updatedAccess.reputation_score,
          xray_charges: updatedAccess.xray_charges,
          xray_target: updatedAccess.xray_target,
          charges_refill_date: updatedAccess.charges_refill_date,
        };
      } else {
        // Fallback to original values if update failed
        // But still check reputation_score
        if (result.reputation_score !== null && result.reputation_score <= 0) {
          throw new Error('Account restricted');
        }
        
        user.access = {
          is_vip: result.is_vip!,
          reputation_score: result.reputation_score!,
          xray_charges: result.xray_charges!,
          xray_target: result.xray_target,
          charges_refill_date: result.charges_refill_date,
        };
      }
    }

    return user;
  }

  // Create new user
  const newUser = await queryOne<{
    id: string;
    email: string;
    username: string | null;
    provider: 'apple' | 'google';
    personal_info: Record<string, unknown>;
    settings: Record<string, unknown>;
  }>(
    `INSERT INTO users (email, username, provider, personal_info, settings)
     VALUES ($1, $2, 'google', $3, $4)
     RETURNING id, email, username, provider, personal_info, settings`,
    [email, username, {}, {}]
  );

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  // Query the newly created user with access join
  result = await queryOne<{
    id: string;
    email: string;
    username: string | null;
    provider: 'apple' | 'google';
    personal_info: Record<string, unknown>;
    settings: Record<string, unknown>;
    access_id: string | null;
    is_vip: boolean | null;
    reputation_score: number | null;
    xray_charges: number | null;
    xray_target: string | null;
    charges_refill_date: string | null;
  }>(
    `SELECT 
      u.id, 
      u.email, 
      u.username, 
      u.provider, 
      u.personal_info, 
      u.settings,
      ua.id as access_id,
      ua.is_vip,
      ua.reputation_score,
      ua.xray_charges,
      ua.xray_target,
      ua.charges_refill_date
    FROM users u
    LEFT JOIN user_access ua ON u.id = ua.user_id
    WHERE u.id = $1`,
    [newUser.id]
  );

  if (!result) {
    throw new Error('Failed to fetch created user');
  }

  const user: AuthUser = {
    id: result.id,
    email: result.email,
    username: result.username,
    provider: result.provider,
    personal_info: result.personal_info,
    settings: result.settings,
  };

  // Include access if it exists (will be undefined for newly created users)
  if (result.access_id) {
    // Check and update refill date and charges if needed
    await checkAndUpdateRefill(result.id, result.charges_refill_date);
    
    // Re-fetch access data to get updated values
    const updatedAccess = await queryOne<{
      is_vip: boolean;
      reputation_score: number;
      xray_charges: number;
      xray_target: string | null;
      charges_refill_date: string | null;
    }>(
      'SELECT is_vip, reputation_score, xray_charges, xray_target, charges_refill_date FROM user_access WHERE user_id = $1',
      [result.id]
    );

    if (updatedAccess) {
      user.access = {
        is_vip: updatedAccess.is_vip,
        reputation_score: updatedAccess.reputation_score,
        xray_charges: updatedAccess.xray_charges,
        xray_target: updatedAccess.xray_target,
        charges_refill_date: updatedAccess.charges_refill_date,
      };
    } else {
      // Fallback to original values if update failed
      user.access = {
        is_vip: result.is_vip!,
        reputation_score: result.reputation_score!,
        xray_charges: result.xray_charges!,
        xray_target: result.xray_target,
        charges_refill_date: result.charges_refill_date,
      };
    }
  }

  return user;
}

// Get or create Apple user
export async function getOrCreateAppleUser(
  email: string,
  username: string
): Promise<AuthUser> {
  // Check if user exists
  let result = await queryOne<{
    id: string;
    email: string;
    username: string | null;
    provider: 'apple' | 'google';
    personal_info: Record<string, unknown>;
    settings: Record<string, unknown>;
    access_id: string | null;
    is_vip: boolean | null;
    reputation_score: number | null;
    xray_charges: number | null;
    xray_target: string | null;
    charges_refill_date: string | null;
  }>(
    `SELECT 
      u.id, 
      u.email, 
      u.username, 
      u.provider, 
      u.personal_info, 
      u.settings,
      ua.id as access_id,
      ua.is_vip,
      ua.reputation_score,
      ua.xray_charges,
      ua.xray_target,
      ua.charges_refill_date
    FROM users u
    LEFT JOIN user_access ua ON u.id = ua.user_id
    WHERE u.email = $1`,
    [email]
  );

  if (result) {
    // Check if user has reputation_score <= 0 (banned/restricted) - prevent login
    if (result.reputation_score !== null && result.reputation_score <= 0) {
      throw new Error('Account restricted');
    }
    
    const user: AuthUser = {
      id: result.id,
      email: result.email,
      username: result.username,
      provider: result.provider,
      personal_info: result.personal_info,
      settings: result.settings,
    };

    // Include access if it exists
    if (result.access_id) {
      // Check and update refill date and charges if needed
      await checkAndUpdateRefill(result.id, result.charges_refill_date);
      
      // Re-fetch access data to get updated values
      const updatedAccess = await queryOne<{
        is_vip: boolean;
        reputation_score: number;
        xray_charges: number;
        xray_target: string | null;
        charges_refill_date: string | null;
      }>(
        'SELECT is_vip, reputation_score, xray_charges, xray_target, charges_refill_date FROM user_access WHERE user_id = $1',
        [result.id]
      );

      if (updatedAccess) {
        // Double-check reputation_score after refetch
        if (updatedAccess.reputation_score <= 0) {
          throw new Error('Account restricted');
        }
        
        user.access = {
          is_vip: updatedAccess.is_vip,
          reputation_score: updatedAccess.reputation_score,
          xray_charges: updatedAccess.xray_charges,
          xray_target: updatedAccess.xray_target,
          charges_refill_date: updatedAccess.charges_refill_date,
        };
      } else {
        // Fallback to original values if update failed
        // But still check reputation_score
        if (result.reputation_score !== null && result.reputation_score <= 0) {
          throw new Error('Account restricted');
        }
        
        user.access = {
          is_vip: result.is_vip!,
          reputation_score: result.reputation_score!,
          xray_charges: result.xray_charges!,
          xray_target: result.xray_target,
          charges_refill_date: result.charges_refill_date,
        };
      }
    }

    return user;
  }

  // Create new user
  const newUser = await queryOne<{
    id: string;
    email: string;
    username: string | null;
    provider: 'apple' | 'google';
    personal_info: Record<string, unknown>;
    settings: Record<string, unknown>;
  }>(
    `INSERT INTO users (email, username, provider, personal_info, settings)
     VALUES ($1, $2, 'apple', $3, $4)
     RETURNING id, email, username, provider, personal_info, settings`,
    [email, username, {}, {}]
  );

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  // Query the newly created user with access join
  result = await queryOne<{
    id: string;
    email: string;
    username: string | null;
    provider: 'apple' | 'google';
    personal_info: Record<string, unknown>;
    settings: Record<string, unknown>;
    access_id: string | null;
    is_vip: boolean | null;
    reputation_score: number | null;
    xray_charges: number | null;
    xray_target: string | null;
    charges_refill_date: string | null;
  }>(
    `SELECT 
      u.id, 
      u.email, 
      u.username, 
      u.provider, 
      u.personal_info, 
      u.settings,
      ua.id as access_id,
      ua.is_vip,
      ua.reputation_score,
      ua.xray_charges,
      ua.xray_target,
      ua.charges_refill_date
    FROM users u
    LEFT JOIN user_access ua ON u.id = ua.user_id
    WHERE u.id = $1`,
    [newUser.id]
  );

  if (!result) {
    throw new Error('Failed to fetch created user');
  }

  const user: AuthUser = {
    id: result.id,
    email: result.email,
    username: result.username,
    provider: result.provider,
    personal_info: result.personal_info,
    settings: result.settings,
  };

  // Include access if it exists (will be undefined for newly created users)
  if (result.access_id) {
    // Check and update refill date and charges if needed
    await checkAndUpdateRefill(result.id, result.charges_refill_date);
    
    // Re-fetch access data to get updated values
    const updatedAccess = await queryOne<{
      is_vip: boolean;
      reputation_score: number;
        xray_charges: number;
        xray_target: string | null;
        charges_refill_date: string | null;
      }>(
        'SELECT is_vip, reputation_score, xray_charges, xray_target, charges_refill_date FROM user_access WHERE user_id = $1',
      [result.id]
    );

    if (updatedAccess) {
      user.access = {
        is_vip: updatedAccess.is_vip,
        reputation_score: updatedAccess.reputation_score,
        xray_charges: updatedAccess.xray_charges,
        xray_target: updatedAccess.xray_target,
        charges_refill_date: updatedAccess.charges_refill_date,
      };
    } else {
      // Fallback to original values if update failed
      user.access = {
        is_vip: result.is_vip!,
        reputation_score: result.reputation_score!,
        xray_charges: result.xray_charges!,
        xray_target: result.xray_target,
        charges_refill_date: result.charges_refill_date,
      };
    }
  }

  return user;
}
