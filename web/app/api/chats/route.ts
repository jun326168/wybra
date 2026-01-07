import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/postgres';
import { Chat } from '@/lib/type';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all chats where the user is either user_1 or user_2
    // Order by updated_at descending (most recent first)
    // Use JOIN to get the other user's information and last message in a single query
    const chatsWithOtherUser = await query<Chat & { 
      other_user_id: string; 
      other_username: string | null; 
      other_personal_info: Record<string, unknown> | null;
      last_message_content: string | null;
      last_message_sender_id: string | null;
      last_message_created_at: string | null;
    }>(
      `
      SELECT 
        c.id,
        c.user_1,
        c.user_2,
        c.last_message_id,
        c.message_count,
        c.chat_info,
        c.quiz_info,
        c.created_at,
        c.updated_at,
        CASE 
          WHEN c.user_1 = $1 THEN c.user_2
          ELSE c.user_1
        END as other_user_id,
        u.username as other_username,
        u.personal_info as other_personal_info,
        m.content as last_message_content,
        m.user_id as last_message_sender_id,
        m.created_at as last_message_created_at
      FROM chats c
      LEFT JOIN users u ON (
        CASE 
          WHEN c.user_1 = $1 THEN u.id = c.user_2
          ELSE u.id = c.user_1
        END
      )
      LEFT JOIN messages m ON m.id = c.last_message_id
      WHERE c.user_1 = $1 OR c.user_2 = $1
      ORDER BY c.updated_at DESC
      `,
      [user.id]
    );

    // Transform the result to match the expected format
    const formattedChats = chatsWithOtherUser.map((chat) => ({
      id: chat.id,
      user_1: chat.user_1,
      user_2: chat.user_2,
      last_message_id: chat.last_message_id,
      message_count: chat.message_count,
      chat_info: chat.chat_info,
      quiz_info: chat.quiz_info,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
      other_user: chat.other_user_id ? {
        id: chat.other_user_id,
        username: chat.other_username,
        personal_info: chat.other_personal_info,
      } : null,
      last_message: chat.last_message_id ? {
        id: chat.last_message_id,
        content: chat.last_message_content,
        sender_id: chat.last_message_sender_id,
        created_at: chat.last_message_created_at,
      } : null,
    }));

    return NextResponse.json({ chats: formattedChats });

  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

