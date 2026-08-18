import axios from 'axios';
import NitroCookies from 'react-native-nitro-cookies';
import {
  getCsrfToken,
  getSessionId,
  removeCsrfToken,
  removeSessionId,
  setCsrfToken,
  setSessionId,
} from './secure-store';
import { removeStoredUser } from './user-storage';

export const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Cookie name the backend issues. The `__Host-` prefix is required over HTTPS
 * and is dropped for plain-http local development, mirroring the server.
 */
export const SESSION_COOKIE = __DEV__ ? 'session' : '__Host-session';

/**
 * Double-submit CSRF token. A native app is not actually CSRF-exposed — it
 * attaches its session by hand rather than having it sent ambiently — but the
 * backend applies one rule to every cookie-authenticated caller, so the token
 * is echoed back whenever the server has issued one.
 */
export const CSRF_COOKIE = __DEV__ ? 'csrf_token' : '__Host-csrf_token';

export const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Native apps have no same-origin policy and no CSRF exposure, but they do
 * share a cookie jar across the whole app (including any WebView). The session
 * id is therefore kept in the OS keystore and attached explicitly, so the
 * credential's lifetime is controlled by this module rather than by whatever
 * else touches the jar.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

apiClient.interceptors.request.use(async (config) => {
  const [sessionId, csrfToken] = await Promise.all([getSessionId(), getCsrfToken()]);

  const cookieParts: string[] = [];
  if (sessionId) cookieParts.push(`${SESSION_COOKIE}=${sessionId}`);
  if (csrfToken) cookieParts.push(`${CSRF_COOKIE}=${csrfToken}`);
  if (cookieParts.length) config.headers.Cookie = cookieParts.join('; ');

  if (csrfToken) config.headers[CSRF_HEADER] = csrfToken;

  return config;
});

/**
 * Reads a rotated session id out of the response and persists it.
 *
 * The server rotates the id periodically, so every response may carry a
 * replacement. Missing one would mean presenting a revoked id on the next call,
 * which the server treats as reuse and punishes by killing the whole family.
 */
function captureRotatedSession(headers: unknown): { sessionId: string | null; csrfToken: string | null } {
  const setCookie = (headers as Record<string, unknown> | undefined)?.['set-cookie'];
  const values = Array.isArray(setCookie) ? (setCookie as string[]) : [];

  let sessionId: string | null = null;
  let csrfToken: string | null = null;

  for (const header of values) {
    const session = header.match(/(?:^|;\s*)(?:__Host-)?session=([^;]+)/);
    if (session) sessionId = session[1];

    const csrf = header.match(/(?:^|;\s*)(?:__Host-)?csrf_token=([^;]+)/);
    if (csrf) csrfToken = csrf[1];
  }

  return { sessionId, csrfToken };
}

/**
 * Called when the server rejects the session. Unlike a JWT there is nothing to
 * refresh — the row is gone, so the only correct response is to drop the local
 * credential and let the auth guard route back to login.
 */
async function clearLocalSession(): Promise<void> {
  await removeSessionId();
  await removeCsrfToken();
  await removeStoredUser();
  await NitroCookies.clearAll();
}

apiClient.interceptors.response.use(
  async (response) => {
    const { sessionId, csrfToken } = captureRotatedSession(response.headers);
    if (sessionId) await setSessionId(sessionId);
    if (csrfToken) await setCsrfToken(csrfToken);
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await clearLocalSession();
    }
    return Promise.reject(error);
  }
);

export { captureRotatedSession, clearLocalSession };
