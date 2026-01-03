import type { User } from './types';
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
    const headers = await getAuthHeaders();
    await fetch(`${API_URL}/auth/signout`, {
      method: 'POST',
      headers,
    });
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

