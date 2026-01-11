import type { User, Chat, Message } from './types';
import { storage } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Helper to get headers with auth token
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await storage.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Auth APIs
export const signInWithGoogle = async (email: string, username: string) => {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, username }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign in with Google');
  }

  const data = await response.json();
  await storage.setToken(data.token);
  return data.user as User;
};

export const signInWithApple = async (identityToken: string, username?: string) => {
  const response = await fetch(`${API_URL}/auth/apple`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identityToken, username }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign in with Apple');
  }

  const data = await response.json();
  await storage.setToken(data.token);
  return data.user as User;
};

export const signOut = async () => {
  await storage.removeToken();

  // Call the API to invalidate the token (if needed in the future)
  try {
    // const headers = await getAuthHeaders();
    // await fetch(`${API_URL}/auth/signout`, {
    //   method: 'POST',
    //   headers,
    // });
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export const getUser = async (): Promise<User | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/auth/me`, {
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: {
    username?: string;
    personal_info?: Record<string, unknown>;
  }
): Promise<User> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  const data = await response.json();
  return data.user as User;
};

export const uploadUserPhoto = async (
  userId: string,
  photoUri: string
): Promise<string> => {
  const token = await storage.getToken();
  
  // Create form data
  const formData = new FormData();
  
  // Get file extension from URI
  const uriParts = photoUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  
  // Create file object for upload
  const file = {
    uri: photoUri,
    type: `image/${fileType}`,
    name: `photo.${fileType}`,
  } as any;
  
  formData.append('photo', file);

  const response = await fetch(`${API_URL}/users/${userId}/photo`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload photo');
  }

  const data = await response.json();
  return data.avatarUrl as string;
};

export const fetchProfiles = async (): Promise<User[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/profiles`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch profiles');
  }

  const data = await response.json();
  return data.users as User[];
};

export const createChat = async (
  user_2: string,
  message?: string
): Promise<Chat> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/chats/create-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_2, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create chat');
  }

  const data = await response.json();
  return data.chat as Chat;
};

export const fetchChats = async (): Promise<Chat[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/chats`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch chats');
  }

  const data = await response.json();
  return data.chats as Chat[];
};

export const fetchChat = async (chatId?: string, otherUserId?: string): Promise<{ chat: Chat, messages: Message[] }> => {
  const queryString = chatId ? `chat_id=${chatId}` : otherUserId ? `other_user_id=${otherUserId}` : '';
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/chats/one?${queryString}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch chat');
  }
  const data = await response.json();
  return { chat: data.chat as Chat, messages: data.messages as Message[] };
};

export const sendMessage = async (userId: string, chatId: string, message: string): Promise<{ message: Message, chat: Chat }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/send-message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id: userId, chat_id: chatId, content: message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  const data = await response.json();
  return { message: data.message as Message, chat: data.chat as Chat };
};

export const markMessageAsRead = async (chatId: string): Promise<Chat> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/chats/one?chat_id=${chatId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ last_message_read: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark message as read');
  }

  const data = await response.json();
  return data.chat as Chat;
};

export const updateChatInfo = async (chatId: string, chatInfo: Record<string, unknown>): Promise<Chat> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/chats/one?chat_id=${chatId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ chat_info: chatInfo }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update chat info');
  }

  const data = await response.json();
  return data.chat as Chat;
};

// Token APIs
export interface UserToken {
  id: string;
  token: string;
  created_at: string;
}

export const createToken = async (token: string): Promise<UserToken> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/tokens`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create token');
  }

  const data = await response.json();
  return data.token as UserToken;
};

export const getTokens = async (): Promise<UserToken[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/tokens`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get tokens');
  }

  const data = await response.json();
  return data.tokens as UserToken[];
};