import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has any chats
    const chats = await query<{ id: string }[]>(
      'SELECT id FROM chats WHERE user_1 = $1 OR user_2 = $1 LIMIT 1',
      [user.id]
    );

    const hasChat = chats.length > 0;

    return NextResponse.json({ user: { ...user, has_chat: hasChat } });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

