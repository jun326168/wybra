import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/postgres';
import { Chat } from '@/lib/type';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_2, message } = body;

    // Validate input
    if (!user_2) {
      return NextResponse.json(
        { error: 'user_2 is required' },
        { status: 400 }
      );
    }

    // Cannot create chat with yourself
    if (user.id === user_2) {
      return NextResponse.json(
        { error: 'Cannot create chat with yourself' },
        { status: 400 }
      );
    }

    // Check if user_2 exists
    const otherUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE id = $1',
      [user_2]
    );

    if (!otherUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if chat already exists between these two users
    const existingChat = await queryOne<Chat>(
      `
      SELECT * FROM chats 
      WHERE (user_1 = $1 AND user_2 = $2) OR (user_1 = $2 AND user_2 = $1)
      `,
      [user.id, user_2]
    );

    if (existingChat) {
      return NextResponse.json(
        { error: 'Chat already exists', chat: existingChat },
        { status: 409 }
      );
    }

    const messageContent = message || 'Hi!'; // Default message if none provided
    
    // Step 1: Create chat first with last_message_id as NULL
    const chat = await queryOne<Chat>(
      `
      INSERT INTO chats (user_1, user_2, last_message_id)
      VALUES ($1, $2, NULL)
      RETURNING *
      `,
      [
        user.id,
        user_2,
      ]
    );

    if (!chat) {
      return NextResponse.json(
        { error: 'Failed to create chat' },
        { status: 500 }
      );
    }

    // Step 2: Create the message with the chat_id
    const initialMessage = await queryOne<{ id: string }>(
      `
      INSERT INTO messages (chat_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [chat.id, user.id, messageContent]
    );

    if (!initialMessage) {
      return NextResponse.json(
        { error: 'Failed to create initial message' },
        { status: 500 }
      );
    }

    // Step 3: Update the chat with the message ID and progress
    await queryOne<Chat>(
      `
      UPDATE chats
      SET 
        last_message_id = $1,
        chat_info = jsonb_set(
          COALESCE(chat_info, '{}'::jsonb),
          '{user_1_progress}',
          '5'::jsonb,
          true
        ),
        message_count = message_count + 1
      WHERE id = $2
      RETURNING *
      `,
      [initialMessage.id, chat.id]
    );

    // Fetch the created chat with other user info and last message
    const chatWithDetails = await queryOne<Chat & { 
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
        c.last_message_read,
        c.chat_info,
        c.quiz_info,
        c.created_at,
        c.updated_at,
        u.id as other_user_id,
        u.username as other_username,
        u.personal_info as other_personal_info,
        m.content as last_message_content,
        m.user_id as last_message_sender_id,
        m.created_at as last_message_created_at
      FROM chats c
      LEFT JOIN users u ON u.id = c.user_2
      LEFT JOIN messages m ON m.id = c.last_message_id
      WHERE c.id = $1
      `,
      [chat.id]
    );

    if (!chatWithDetails) {
      return NextResponse.json(
        { error: 'Failed to fetch created chat' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedChat = {
      id: chatWithDetails.id,
      user_1: chatWithDetails.user_1,
      user_2: chatWithDetails.user_2,
      last_message_id: chatWithDetails.last_message_id,
      last_message_read: chatWithDetails.last_message_read ?? false,
      chat_info: chatWithDetails.chat_info,
      quiz_info: chatWithDetails.quiz_info,
      created_at: chatWithDetails.created_at,
      updated_at: chatWithDetails.updated_at,
      other_user: {
        id: chatWithDetails.other_user_id,
        username: chatWithDetails.other_username,
        personal_info: chatWithDetails.other_personal_info,
      },
      last_message: {
        id: chatWithDetails.last_message_id,
        content: chatWithDetails.last_message_content,
        sender_id: chatWithDetails.last_message_sender_id,
        created_at: chatWithDetails.last_message_created_at,
      },
    };

    return NextResponse.json({ chat: formattedChat }, { status: 201 });

  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

