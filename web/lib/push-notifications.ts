import { query } from './postgres';

interface UserToken {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
}

interface ExpoPushNotificationRequest {
  to: string;
  title: string;
  body: string;
  sound?: 'default';
  priority?: 'default' | 'normal' | 'high';
  data?: Record<string, unknown>;
  badge?: number;
}

interface ExpoPushNotificationResponse {
  data: Array<{
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: {
      error?: string;
      errorType?: string;
    };
  }>;
}

/**
 * Get all push notification tokens for a user
 */
export async function getUserTokens(userId: string): Promise<string[]> {
  try {
    const tokens = await query<UserToken>(
      'SELECT token FROM user_tokens WHERE user_id = $1',
      [userId]
    );
    return tokens.map(t => t.token);
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return [];
  }
}

/**
 * Delete invalid tokens from the database
 */
async function deleteInvalidTokens(invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) {
    return;
  }

  try {
    // Delete tokens that are no longer registered
    await query(
      'DELETE FROM user_tokens WHERE token = ANY($1::text[])',
      [invalidTokens]
    );
    console.log(`Deleted ${invalidTokens.length} invalid push notification token(s)`);
  } catch (error) {
    console.error('Error deleting invalid tokens:', error);
  }
}

/**
 * Send push notifications to multiple tokens
 */
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ success: number; failed: number }> {
  if (tokens.length === 0) {
    return { success: 0, failed: 0 };
  }

  // Send notifications in parallel (Expo API supports batch sending)
  const messages: ExpoPushNotificationRequest[] = tokens.map(token => ({
    to: token,
    title,
    body,
    sound: 'default',
    data: data || {},
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error(`Failed to send push notifications: ${response.status} ${response.statusText}`);
      return { success: 0, failed: tokens.length };
    }

    const result: ExpoPushNotificationResponse = await response.json();
    
    let success = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    if (result.data) {
      result.data.forEach((notificationResult, index) => {
        if (notificationResult.status === 'ok') {
          success++;
        } else {
          failed++;
          const errorMessage = notificationResult.message || notificationResult.details?.error || '';
          const errorType = notificationResult.details?.errorType || '';
          
          console.error('Push notification error:', errorMessage);
          
          // Check if the error indicates the device is not registered
          // Expo returns "DeviceNotRegistered" error when the token is invalid
          if (
            errorType === 'DeviceNotRegistered' ||
            errorMessage.includes('DeviceNotRegistered') ||
            errorMessage.includes('not registered') ||
            errorMessage.includes('InvalidCredentials')
          ) {
            // The response array index corresponds to the request array index
            if (index < tokens.length) {
              invalidTokens.push(tokens[index]);
            }
          }
        }
      });
    }

    // Delete invalid tokens from the database
    if (invalidTokens.length > 0) {
      await deleteInvalidTokens(invalidTokens);
    }

    return { success, failed };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { success: 0, failed: tokens.length };
  }
}

/**
 * Send a push notification to a user by their user ID
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ success: number; failed: number }> {
  const tokens = await getUserTokens(userId);
  if (tokens.length === 0) {
    return { success: 0, failed: 0 };
  }
  return sendPushNotifications(tokens, title, body, data);
}

/**
 * Send a push notification for a new message
 * This is the main function to be used in the send-message route
 */
export async function sendMessageNotification(
  recipientUserId: string,
  chatId: string
): Promise<void> {

  const messages = [
    "有人傳送了訊息給你",
    "你的朋友有了新動靜",
    "有人留了言給你",
  ];

  try {
    await sendPushNotificationToUser(
      recipientUserId,
      'Wybra',
      messages[Math.floor(Math.random() * messages.length)],
      {
        type: 'message',
        chatId,
      }
    );
  } catch (error) {
    console.error('Error sending message notification:', error);
    // Don't throw - we don't want to fail the message send if push notification fails
  }
}
