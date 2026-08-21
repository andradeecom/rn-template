import { secureStorage } from './storage';

/**
 * The REST provider's credentials, named.
 *
 * A thin domain layer over `secureStorage` rather than a second storage API:
 * the keychain options, chunking, and key layout all live in
 * `@/lib/storage/secure.ts`, and this file only fixes which key holds what.
 *
 * These names are deliberately provider-specific — an opaque session id and a
 * CSRF token are what the REST backend issues. Other providers store their own
 * credentials under their own keys through the same port; nothing here is meant
 * to be shared with them.
 */
const SESSION_KEY = 'session_id';
const CSRF_KEY = 'csrf_token';

export async function getSessionId(): Promise<string | null> {
  return secureStorage.get(SESSION_KEY);
}

export async function setSessionId(sessionId: string): Promise<void> {
  await secureStorage.set(SESSION_KEY, sessionId);
}

export async function removeSessionId(): Promise<void> {
  await secureStorage.remove(SESSION_KEY);
}

/**
 * The CSRF token is not a credential — it only has to round-trip back to the
 * server — but it is kept alongside the session id so the two are cleared
 * together and never drift apart.
 */
export async function getCsrfToken(): Promise<string | null> {
  return secureStorage.get(CSRF_KEY);
}

export async function setCsrfToken(token: string): Promise<void> {
  await secureStorage.set(CSRF_KEY, token);
}

export async function removeCsrfToken(): Promise<void> {
  await secureStorage.remove(CSRF_KEY);
}
