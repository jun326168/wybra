import { Pusher } from '@pusher/pusher-websocket-react-native';
import { Message, Chat } from './types';

let pusherInitialized = false;

/**
 * Initialize Pusher client
 * Should be called once when the app starts
 */
export async function initializePusher(): Promise<void> {
  if (pusherInitialized) {
    return;
  }

  const key = process.env.EXPO_PUBLIC_PUSHER_KEY;
  const cluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'ap1';

  if (!key) {
    console.warn(
      'Pusher environment variables are not set. Please set EXPO_PUBLIC_PUSHER_KEY'
    );
    return;
  }

  try {
    const pusher = Pusher.getInstance();
    await pusher.init({
      apiKey: key,
      cluster,
    });
    await pusher.connect();
    pusherInitialized = true;
  } catch (error) {
    console.error('Error initializing Pusher:', error);
  }
}

/**
 * Get Pusher instance
 */
export function getPusherClient(): Pusher {
  return Pusher.getInstance();
}

/**
 * Subscribe to a chat channel and listen for new messages
 * @param chatId - The chat ID
 * @param onNewMessage - Callback when a new message is received
 * @param onChatUpdate - Callback when chat is updated
 * @returns Promise that resolves to unsubscribe function
 */
export async function subscribeToChat(
  chatId: string,
  onNewMessage: (message: Message) => void,
  onChatUpdate: (chat: Chat) => void
): Promise<() => Promise<void>> {
  const pusher = getPusherClient();
  const channelName = `chat-${chatId}`;

  try {
    await pusher.subscribe({
      channelName,
      onEvent: (event) => {
        if (event.eventName === 'new-message') {
          const data = event.data as { message: Message };
          if (data?.message) {
            onNewMessage(data.message);
          }
        } else if (event.eventName === 'chat-updated') {
          const data = event.data as { chat: Chat };
          if (data?.chat) {
            onChatUpdate(data.chat);
          }
        }
      },
    });

    // Return unsubscribe function
    return async () => {
      try {
        await pusher.unsubscribe({ channelName });
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
      }
    };
  } catch (error) {
    console.error('Error subscribing to channel:', error);
    // Return a no-op unsubscribe function if subscription fails
    return async () => {};
  }
}

/**
 * Unsubscribe from a chat channel
 * @param chatId - The chat ID
 */
export async function unsubscribeFromChat(chatId: string): Promise<void> {
  const pusher = getPusherClient();
  try {
    await pusher.unsubscribe({ channelName: `chat-${chatId}` });
  } catch (error) {
    console.error('Error unsubscribing from channel:', error);
  }
}
