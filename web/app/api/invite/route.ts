import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/postgres';

interface Invite {
  id: string;
  code: string;
  invited_user_id: string;
  used_by_user_id: string | null;
  status: string;
  created_at: string;
}

// Generate a random 6-character code (A-Z0-9)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate a unique invite code (retry if collision)
async function generateUniqueInviteCode(): Promise<string> {
  let code = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await queryOne(
      'SELECT id FROM invites WHERE code = $1',
      [code]
    );

    if (!existing) {
      return code;
    }

    code = generateInviteCode();
    attempts++;
  }

  throw new Error('Failed to generate unique invite code');
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create user_access if it doesn't exist
    const existingAccess = await queryOne(
      'SELECT id FROM user_access WHERE user_id = $1',
      [user.id]
    );

    if (!existingAccess) {
      await query(
        `INSERT INTO user_access (user_id, is_vip, reputation_score, xray_charges)
         VALUES ($1, false, 100, 1)`,
        [user.id]
      );
    }

    // Check if user has already created an invite
    const existingInvite = await queryOne(
      'SELECT id, code, status FROM invites WHERE invited_user_id = $1',
      [user.id]
    );

    if (existingInvite) {
      return NextResponse.json(
        { error: 'You have already created an invite code' },
        { status: 409 }
      );
    }

    // Generate unique code and create invite
    const code = await generateUniqueInviteCode();

    const newInvite = await queryOne<Invite>(
      `INSERT INTO invites (code, invited_user_id, status)
       VALUES ($1, $2, 'active')
       RETURNING id, code, invited_user_id, status, created_at`,
      [code, user.id]
    );

    if (!newInvite) {
      throw new Error('Failed to create invite');
    }

    return NextResponse.json({
      invite: {
        id: newInvite.id,
        code: newInvite.code,
        status: newInvite.status,
        created_at: newInvite.created_at,
      },
    });
  } catch (error: unknown) {
    console.error('Create invite error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
