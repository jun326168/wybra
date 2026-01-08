import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/postgres';
import { Chat, Message } from '@/lib/type';
import { auditMessage } from '@/lib/chat-audit';
import { triggerChatUpdate, triggerNewMessage } from '@/lib/real-time';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, chat_id, content } = body;

    // Validate input
    if (!user_id || !chat_id || !content) {
      return NextResponse.json(
        { error: 'user_id, chat_id, and content are required' },
        { status: 400 }
      );
    }

    // Verify the user_id matches the authenticated user
    if (user.id !== user_id) {
      return NextResponse.json(
        { error: 'user_id does not match authenticated user' },
        { status: 403 }
      );
    }

    // Verify user is part of the chat
    const existingChat = await queryOne<Chat>(
      `
      SELECT * FROM chats 
      WHERE id = $1 AND (user_1 = $2 OR user_2 = $2)
      `,
      [chat_id, user.id]
    );

    if (!existingChat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    // Create the message
    const message = await queryOne<Message>(
      `
      INSERT INTO messages (chat_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [chat_id, user.id, content]
    );

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // Trigger Pusher event for new message
    try {
      await triggerNewMessage(chat_id, message);
    } catch (error) {
      console.error('Error triggering Pusher event:', error);
      // Don't fail the request if Pusher fails
    }

    const newMessageCount = existingChat.message_count + 1;

    // Update the chat with the new last_message_id and increment message_count
    await queryOne<Chat>(
      `
      UPDATE chats
      SET 
        last_message_id = $1,
        message_count = $3
      WHERE id = $2
      RETURNING *
      `,
      [message.id, chat_id, newMessageCount]
    );

    // Run chat audit (progress updates, AI scoring, quiz generation)
    await auditMessage(chat_id, user.id, content, newMessageCount);

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
        u.personal_info as other_personal_info
      FROM chats c
      LEFT JOIN users u ON (
        CASE 
          WHEN c.user_1 = $1 THEN u.id = c.user_2
          ELSE u.id = c.user_1
        END
      )
      WHERE c.id = $2
      `,
      [user.id, chat_id]
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
      message_count: chatWithDetails.message_count,
      chat_info: chatWithDetails.chat_info,
      quiz_info: chatWithDetails.quiz_info,
      created_at: chatWithDetails.created_at,
      updated_at: chatWithDetails.updated_at,
      other_user: {
        id: chatWithDetails.other_user_id,
        username: chatWithDetails.other_username,
        personal_info: chatWithDetails.other_personal_info,
      },
    };

    // Trigger Pusher event for chat update for both users
    try {
      await triggerChatUpdate(chat_id, chatWithDetails);
    } catch (error) {
      console.error('Error triggering Pusher event:', error);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({ message, chat: formattedChat });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

