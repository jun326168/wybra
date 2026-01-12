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
    const { target_user_id, reason } = body;

    // Validate input
    if (!target_user_id || !reason) {
      return NextResponse.json(
        { error: 'target_user_id and reason are required' },
        { status: 400 }
      );
    }

    // Cannot report yourself
    if (user.id === target_user_id) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
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

    // Create the report
    await queryOne<{ id: string }>(
      `
      INSERT INTO user_reports (reporter_id, reported_id, reason)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [user.id, target_user_id, reason]
    );

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error('Report user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
