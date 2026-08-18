import { captureRotatedSession } from '@/lib/api-client';

/**
 * The response interceptor captures rotated session ids out of `set-cookie`.
 *
 * This is the sharpest edge in the mobile client: the server rotates the id
 * periodically, and missing a rotation means presenting a revoked id on the
 * next call — which the server reads as replay and answers by killing the
 * entire session family. A parsing slip here logs the user out for good, so
 * the matching is pinned rather than assumed.
 */
describe('captureRotatedSession', () => {
  it('reads a rotated session id', () => {
    const result = captureRotatedSession({
      'set-cookie': ['session=rotated-abc; Path=/; HttpOnly; SameSite=Lax'],
    });

    expect(result.sessionId).toBe('rotated-abc');
  });

  // Production uses the __Host- prefix; development drops it because the
  // prefix requires HTTPS. Both must parse, or rotation silently stops
  // working in exactly one environment.
  it('reads the __Host- prefixed name too', () => {
    const result = captureRotatedSession({
      'set-cookie': ['__Host-session=rotated-xyz; Path=/; Secure; HttpOnly'],
    });

    expect(result.sessionId).toBe('rotated-xyz');
  });

  it('reads the session and CSRF token from separate headers', () => {
    const result = captureRotatedSession({
      'set-cookie': ['session=abc123; Path=/; HttpOnly', 'csrf_token=tok456; Path=/; SameSite=Lax'],
    });

    expect(result).toEqual({ sessionId: 'abc123', csrfToken: 'tok456' });
  });

  it('returns nulls when the response rotates nothing', () => {
    expect(captureRotatedSession({})).toEqual({ sessionId: null, csrfToken: null });
  });

  it('tolerates a missing or malformed set-cookie', () => {
    expect(captureRotatedSession(undefined)).toEqual({ sessionId: null, csrfToken: null });
    expect(captureRotatedSession({ 'set-cookie': 'not-an-array' })).toEqual({
      sessionId: null,
      csrfToken: null,
    });
  });

  /*
   * The regex is anchored to a cookie-name boundary. Without that anchor a
   * cookie whose name merely ends in "session" would be captured as the
   * session id, and the real one silently ignored — the exact failure that
   * burns the session family.
   */
  it('does not mistake a lookalike cookie name for the session', () => {
    const result = captureRotatedSession({
      'set-cookie': ['other_session=wrong-value; Path=/'],
    });

    expect(result.sessionId).not.toBe('wrong-value');
  });

  it('picks the session out of a batch of unrelated cookies', () => {
    const result = captureRotatedSession({
      'set-cookie': ['analytics_id=zzz; Path=/', 'session=right-value; Path=/; HttpOnly', 'theme=dark; Path=/'],
    });

    expect(result.sessionId).toBe('right-value');
  });
});
