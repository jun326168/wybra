import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target_user_id } = body;

    // Validate input
    if (!target_user_id) {
      return NextResponse.json(
        { error: 'target_user_id is required' },
        { status: 400 }
      );
    }

    // Cannot block yourself
    if (user.id === target_user_id) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE id = $1',
      [target_user_id]
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already blocked (reputation_score <= 0)
    const targetUserAccess = await queryOne<{ reputation_score: number | null }>(
      `SELECT reputation_score FROM user_access WHERE user_id = $1`,
      [target_user_id]
    );

    if (targetUserAccess && targetUserAccess.reputation_score !== null && targetUserAccess.reputation_score <= 0) {
      return NextResponse.json(
        { error: 'User already blocked' },
        { status: 409 }
      );
    }

    // Block the user by setting their reputation_score to 0
    // Create user_access record if it doesn't exist
    await queryOne<{ reputation_score: number }>(
      `
      INSERT INTO user_access (user_id, reputation_score)
      VALUES ($1, 0)
      ON CONFLICT (user_id)
      DO UPDATE SET reputation_score = 0
      RETURNING reputation_score
      `,
      [target_user_id]
    );

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
