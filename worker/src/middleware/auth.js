/**
 * Authentication Middleware
 * Validates X-Session-Token header against KV sessions store
 */

export async function authenticate(request, env) {
  const token = request.headers.get('X-Session-Token');
  if (!token) return null;

  try {
    const sessionJson = await env.SESSIONS.get(`session:${token}`);
    if (!sessionJson) return null;

    const session = JSON.parse(sessionJson);

    // Check expiry
    if (session.expiresAt && Date.now() > session.expiresAt) {
      await env.SESSIONS.delete(`session:${token}`);
      return null;
    }

    return session;
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return null;
  }
}
