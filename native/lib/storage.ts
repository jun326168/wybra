import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export const storage = {
  async getToken(): Promise<string | null> {
    try {
      // Try SecureStore first
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) return token;
    } catch (error) {
      console.warn('SecureStore read failed, checking AsyncStorage', error);
    }
    // Fallback to AsyncStorage
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('SecureStore save error:', error, error instanceof Error ? error.message : 'Unknown error');
      // Fallback save
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('SecureStore delete error:', e, e instanceof Error ? e.message : 'Unknown error');
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};


