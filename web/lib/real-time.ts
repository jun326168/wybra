import Pusher from 'pusher';
import { Chat, Message } from './type';

let pusherClient: Pusher | null = null;

/**
 * Initialize and return Pusher client
 * Uses singleton pattern to reuse the same client instance
 */
export function getPusherClient(): Pusher {
  if (!pusherClient) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER || 'ap1';

    if (!appId || !key || !secret) {
      throw new Error(
        'Pusher environment variables are not set. Please set PUSHER_APP_ID, PUSHER_KEY, and PUSHER_SECRET'
      );
    }

    pusherClient = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return pusherClient;
}

export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: unknown
): Promise<void> {
  try {
    const pusher = getPusherClient();
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error('Error triggering Pusher event:', error);
    throw error;
  }
}

export async function triggerNewMessage(
  chatId: string,
  userId: string,
  message: Message,
  chat: Chat & { last_message: { id: string, content: string, sender_id: string, created_at: string } }
): Promise<void> {
  const chatChannel = `chat-${chatId}`;
  const userChannel = `user-${userId}`;
  try {
    await triggerPusherEvent(chatChannel, 'new-message', { message: message });
    await triggerPusherEvent(userChannel, 'new-message', { chat: chat });
  } catch (error) {
    console.error('Error triggering Pusher event:', error);
    throw error;
  }
}

export async function triggerChatUpdate(
  chatId: string,
  chat: Chat
): Promise<void> {
  const channel = `chat-${chatId}`;
  try {
    await triggerPusherEvent(channel, 'chat-updated', { chat: chat });
  } catch (error) {
    console.error('Error triggering Pusher event:', error);
    throw error;
  }
}