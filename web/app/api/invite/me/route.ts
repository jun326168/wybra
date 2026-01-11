import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/postgres';

interface Invite {
  id: string;
  code: string;
  invited_user_id: string;
  used_by_user_id: string | null;
  status: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's invite code
    const invite = await queryOne<Invite>(
      'SELECT id, code, invited_user_id, used_by_user_id, status, created_at FROM invites WHERE invited_user_id = $1',
      [user.id]
    );

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        code: invite.code,
        status: invite.status,
        created_at: invite.created_at,
      },
    });
  } catch (error: unknown) {
    console.error('Get invite code error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
