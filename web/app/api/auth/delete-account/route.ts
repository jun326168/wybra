import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/postgres';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all related records for the user in the correct order
    // (respecting foreign key constraints)

    // 1. Delete all messages sent by the user
    await query('DELETE FROM messages WHERE user_id = $1', [user.id]);

    // 2. Get all chat IDs where the user is involved
    const userChats = await query<{ id: string }>(
      'SELECT id FROM chats WHERE user_1 = $1 OR user_2 = $1',
      [user.id]
    );
    const chatIds = userChats.map(chat => chat.id);

    // 3. Delete all messages in chats where the user is involved
    if (chatIds.length > 0) {
      await query('DELETE FROM messages WHERE chat_id = ANY($1::uuid[])', [chatIds]);
    }

    // 4. Delete all chats where the user is involved
    await query('DELETE FROM chats WHERE user_1 = $1 OR user_2 = $1', [user.id]);

    // 5. Delete user tokens
    await query('DELETE FROM user_tokens WHERE user_id = $1', [user.id]);

    // 6. Delete daily feeds
    await query('DELETE FROM daily_feeds WHERE user_id = $1', [user.id]);

    // 7. Delete user access
    await query('DELETE FROM user_access WHERE user_id = $1', [user.id]);

    // 8. Delete invites where user is the inviter or the one who used the invite
    await query('DELETE FROM invites WHERE invited_user_id = $1 OR used_by_user_id = $1', [user.id]);

    // 9. Delete user reports (though they should cascade, being explicit)
    await query('DELETE FROM user_reports WHERE reporter_id = $1 OR reported_id = $1', [user.id]);

    // 10. Finally delete the user record
    await query('DELETE FROM users WHERE id = $1', [user.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
