import { Pusher } from '@pusher/pusher-websocket-react-native';
import { Message, Chat } from './types';

let pusherInitialized = false;

/**
 * Initialize Pusher client
 * Should be called once when the app starts
 */
export async function initializePusher(): Promise<void> {
  if (pusherInitialized) {
    console.log('[Pusher] Already initialized');
    return;
  }

  const key = process.env.EXPO_PUBLIC_PUSHER_KEY;
  const cluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'ap1';

  console.log('[Pusher] Initializing with key:', key?.substring(0, 5) + '...');

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
    console.log('[Pusher] Successfully initialized and connected');
  } catch (error) {
    console.error('[Pusher] Error initializing:', error);
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

  console.log('[Pusher] Subscribing to channel:', channelName);

  try {
    await pusher.subscribe({
      channelName,
      onEvent: (event) => {
        console.log('[Pusher] Raw event received');
        
        try {
          // Parse event data if it's a string
          let eventData = event.data;
          if (typeof eventData === 'string') {
            console.log('[Pusher] Parsing string data...');
            eventData = JSON.parse(eventData);
          }

          console.log('[Pusher] Event name:', event.eventName);

          if (event.eventName === 'new-message') {
            const data = eventData as { message: Message };
            if (data?.message) {
              console.log('[Pusher] New message received:', data.message.id);
              onNewMessage(data.message);
            } else {
              console.warn('[Pusher] new-message event missing message data');
            }
          } else if (event.eventName === 'chat-updated') {
            const data = eventData as { chat: Chat };
            if (data?.chat) {
              console.log('[Pusher] Chat updated:', data.chat.id);
              onChatUpdate(data.chat);
            } else {
              console.warn('[Pusher] chat-updated event missing chat data');
            }
          } else {
            console.log('[Pusher] Unknown event type:', event.eventName);
          }
        } catch (parseError) {
          console.error('[Pusher] Error parsing event data:', parseError);
        }
      },
      onSubscriptionSucceeded: (data) => {
        console.log('[Pusher] Subscription succeeded for channel:', channelName, data);
      },
      onSubscriptionError: (error) => {
        console.error('[Pusher] Subscription error for channel:', channelName, error);
      },
    });

    console.log('[Pusher] Successfully subscribed to:', channelName);

    // Return unsubscribe function
    return async () => {
      try {
        console.log('[Pusher] Unsubscribing from channel:', channelName);
        await pusher.unsubscribe({ channelName });
      } catch (error) {
        console.error('[Pusher] Error unsubscribing from channel:', error);
      }
    };
  } catch (error) {
    console.error('[Pusher] Error subscribing to channel:', error);
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
  const channelName = `chat-${chatId}`;
  console.log('[Pusher] Unsubscribing from:', channelName);
  try {
    await pusher.unsubscribe({ channelName });
    console.log('[Pusher] Successfully unsubscribed from:', channelName);
  } catch (error) {
    console.error('[Pusher] Error unsubscribing from channel:', error);
  }
}