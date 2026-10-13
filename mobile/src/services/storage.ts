// ============================================================================
// BUS STOP — SECURE ASYNC STORAGE SERVICE
// Persistent local storage for authentication tokens, user profile, and cached state
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserRole } from '../types';

const KEYS = {
  ACTIVE_USER: 'bus_stop_active_user',
  CONFIRMED_ROLE: 'bus_stop_confirmed_role',
  AUTH_TOKEN: 'bus_stop_auth_token',
  SAVED_SEARCHES: 'bus_stop_saved_searches',
  API_BASE_URL: 'bus_stop_api_base_url',
  ONBOARDING_DONE: 'bus_stop_onboarding_done',
};

export const storageService = {
  async saveUser(user: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(user));
      await AsyncStorage.setItem(KEYS.CONFIRMED_ROLE, user.role);
    } catch (err) {
      console.warn('Storage saveUser error:', err);
    }
  },

  async getUser(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACTIVE_USER);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn('Storage getUser error:', err);
      return null;
    }
  },

  async getRole(): Promise<UserRole | null> {
    try {
      return (await AsyncStorage.getItem(KEYS.CONFIRMED_ROLE)) as UserRole | null;
    } catch {
      return null;
    }
  },

  async setRole(role: UserRole): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CONFIRMED_ROLE, role);
    } catch (err) {
      console.warn('Storage setRole error:', err);
    }
  },

  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.ACTIVE_USER);
      await AsyncStorage.removeItem(KEYS.CONFIRMED_ROLE);
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    } catch (err) {
      console.warn('Storage clearUser error:', err);
    }
  },

  async getApiBaseUrl(): Promise<string> {
    try {
      const customUrl = await AsyncStorage.getItem(KEYS.API_BASE_URL);
      return customUrl || 'http://localhost:3000';
    } catch {
      return 'http://localhost:3000';
    }
  },

  async setApiBaseUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.API_BASE_URL, url);
    } catch (err) {
      console.warn('Storage setApiBaseUrl error:', err);
    }
  },

  async isOnboardingDone(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setOnboardingDone(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
    } catch (err) {
      console.warn('Storage setOnboardingDone error:', err);
    }
  },
};
