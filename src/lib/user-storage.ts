import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types/auth';

const USER_KEY = 'user_data';

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function removeStoredUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}
