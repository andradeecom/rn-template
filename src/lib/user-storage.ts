import { deviceStorage } from './storage';
import type { User } from '@/types/auth';

/**
 * The cached profile — a name, an email, a role — not a credential, so it goes
 * to device storage rather than the keystore. `secure-store.ts` holds the
 * session id that actually authenticates the user.
 */
const USER_KEY = 'user_data';

export async function getStoredUser(): Promise<User | null> {
  const raw = await deviceStorage.get(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User): Promise<void> {
  await deviceStorage.set(USER_KEY, JSON.stringify(user));
}

export async function removeStoredUser(): Promise<void> {
  await deviceStorage.remove(USER_KEY);
}
