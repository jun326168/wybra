import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/postgres';
import { Chat, Message } from '@/lib/type';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chat_id');
    const otherUserId = searchParams.get('other_user_id');

    // Must provide either chat_id or other_user_id
    if (!chatId && !otherUserId) {
      return NextResponse.json(
        { error: 'Either chat_id or other_user_id is required' },
        { status: 400 }
      );
    }

    // Cannot provide both
    if (chatId && otherUserId) {
      return NextResponse.json(
        { error: 'Provide either chat_id or other_user_id, not both' },
        { status: 400 }
      );
    }

    let chatWithDetails: Chat & {
      other_user_id: string;
      other_username: string | null;
      other_personal_info: Record<string, unknown> | null;
    } | null = null;

    if (chatId) {
      // Get chat by ID, ensuring user is part of it
      chatWithDetails = await queryOne<Chat & {
        other_user_id: string;
        other_username: string | null;
        other_personal_info: Record<string, unknown> | null;
      }>(
        `
        SELECT 
          c.id,
          c.user_1,
          c.user_2,
          c.last_message_id,
          c.chat_info,
          c.quiz_info,
          c.created_at,
          c.updated_at,
          CASE 
            WHEN c.user_1 = $1 THEN c.user_2
            ELSE c.user_1
          END as other_user_id,
          u.username as other_username,
          u.personal_info as other_personal_info
        FROM chats c
        LEFT JOIN users u ON (
          CASE 
            WHEN c.user_1 = $1 THEN u.id = c.user_2
            ELSE u.id = c.user_1
          END
        )
        WHERE c.id = $2 AND (c.user_1 = $1 OR c.user_2 = $1)
        `,
        [user.id, chatId]
      );
    } else if (otherUserId) {
      // Get chat by other_user_id
      chatWithDetails = await queryOne<Chat & {
        other_user_id: string;
        other_username: string | null;
        other_personal_info: Record<string, unknown> | null;
      }>(
        `
        SELECT 
          c.id,
          c.user_1,
          c.user_2,
          c.last_message_id,
          c.chat_info,
          c.quiz_info,
          c.created_at,
          c.updated_at,
          CASE 
            WHEN c.user_1 = $1 THEN c.user_2
            ELSE c.user_1
          END as other_user_id,
          u.username as other_username,
          u.personal_info as other_personal_info
        FROM chats c
        LEFT JOIN users u ON (
          CASE 
            WHEN c.user_1 = $1 THEN u.id = c.user_2
            ELSE u.id = c.user_1
          END
        )
        WHERE (c.user_1 = $1 AND c.user_2 = $2) OR (c.user_1 = $2 AND c.user_2 = $1)
        `,
        [user.id, otherUserId]
      );
    }

    if (!chatWithDetails) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Fetch all messages for this chat, ordered by created_at
    const messages = await query<Message>(
      `
      SELECT 
        id,
        chat_id,
        user_id,
        content,
        created_at,
        message_info
      FROM messages
      WHERE chat_id = $1
      ORDER BY created_at ASC
      `,
      [chatWithDetails.id]
    );

    // Format the response
    const formattedChat = {
      id: chatWithDetails.id,
      user_1: chatWithDetails.user_1,
      user_2: chatWithDetails.user_2,
      last_message_id: chatWithDetails.last_message_id,
      chat_info: chatWithDetails.chat_info,
      quiz_info: chatWithDetails.quiz_info,
      created_at: chatWithDetails.created_at,
      updated_at: chatWithDetails.updated_at,
      other_user: chatWithDetails.other_user_id ? {
        id: chatWithDetails.other_user_id,
        username: chatWithDetails.other_username,
        personal_info: chatWithDetails.other_personal_info,
      } : null,
    };

    return NextResponse.json({ chat: formattedChat, messages: messages });

  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chat_id');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chat_id is required' },
        { status: 400 }
      );
    }

    // Verify user is part of the chat
    const existingChat = await queryOne<Chat>(
      `
      SELECT * FROM chats 
      WHERE id = $1 AND (user_1 = $2 OR user_2 = $2)
      `,
      [chatId, user.id]
    );

    if (!existingChat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { chat_info, quiz_info } = body;

    // Build update query
    const updates: string[] = [];
    const values: (string | Record<string, unknown>)[] = [];
    let paramCount = 1;

    if (chat_info !== undefined) {
      updates.push(`chat_info = $${paramCount}`);
      values.push(chat_info);
      paramCount++;
    }

    if (quiz_info !== undefined) {
      updates.push(`quiz_info = $${paramCount}`);
      values.push(quiz_info);
      paramCount++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Add chat ID as last parameter
    values.push(chatId);

    const updateQuery = `
      UPDATE chats 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updatedChat = await queryOne<Chat>(updateQuery, values);

    if (!updatedChat) {
      return NextResponse.json(
        { error: 'Failed to update chat' },
        { status: 500 }
      );
    }

    // Fetch the updated chat with other user info and last message
    const chatWithDetails = await queryOne<Chat & {
      other_user_id: string;
      other_username: string | null;
      other_personal_info: Record<string, unknown> | null;
    }>(
      `
      SELECT 
        c.id,
        c.user_1,
        c.user_2,
        c.last_message_id,
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
      FROM chats c
      LEFT JOIN users u ON (
        CASE 
          WHEN c.user_1 = $1 THEN u.id = c.user_2
          ELSE u.id = c.user_1
        END
      )
      WHERE c.id = $2
      `,
      [user.id, chatId]
    );

    if (!chatWithDetails) {
      return NextResponse.json(
        { error: 'Failed to fetch updated chat' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedChat = {
      id: chatWithDetails.id,
      user_1: chatWithDetails.user_1,
      user_2: chatWithDetails.user_2,
      last_message_id: chatWithDetails.last_message_id,
      chat_info: chatWithDetails.chat_info,
      quiz_info: chatWithDetails.quiz_info,
      created_at: chatWithDetails.created_at,
      updated_at: chatWithDetails.updated_at,
      other_user: chatWithDetails.other_user_id ? {
        id: chatWithDetails.other_user_id,
        username: chatWithDetails.other_username,
        personal_info: chatWithDetails.other_personal_info,
      } : null,
    };

    return NextResponse.json({ chat: formattedChat });

  } catch (error) {
    console.error('Update chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

