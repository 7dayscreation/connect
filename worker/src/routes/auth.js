/**
 * Auth Routes: /api/auth/*
 *
 * POST /api/auth/send-otp   → Validate email (whitelist), send OTP via Resend
 * POST /api/auth/verify-otp → Verify OTP → issue session token in KV
 * GET  /api/auth/me         → Validate current session
 * POST /api/auth/logout     → Invalidate session token from KV
 */

import { jsonResponse, errorResponse, generateOTP, generateSessionToken, corsHeaders, verifyTurnstile, generateBase32Secret, verifyTOTP } from '../utils/helpers.js';

const OTP_TTL_SECONDS = 600; // 10 minutes
const SESSION_TTL_SECONDS = 86400 * 7; // 7 days

// ── Lockout Helpers ───────────────────────────────────────────
async function checkLockout(email, env) {
  const lockoutTime = await env.OTP_STORE.get(`lockout:time:${email}`);
  if (lockoutTime) {
    const expiration = parseInt(lockoutTime);
    const now = Date.now();
    if (now < expiration) {
      const remainingMinutes = Math.ceil((expiration - now) / 60000);
      return `This account is temporarily locked due to too many failed attempts. Please try again in ${remainingMinutes} minute(s).`;
    } else {
      // Lockout expired, clean up
      await env.OTP_STORE.delete(`lockout:time:${email}`);
    }
  }
  return null;
}

async function handleFailedAttempt(email, env) {
  const rawConfig = await env.APP_CONFIG.get('app_config');
  const config = rawConfig ? JSON.parse(rawConfig) : {};
  const maxAttempts = config.maxAttempts || 5;
  const lockoutDuration = config.lockoutDuration || 15;

  const attemptsKey = `lockout:attempts:${email}`;
  const currentAttemptsStr = await env.OTP_STORE.get(attemptsKey) || '0';
  const attempts = parseInt(currentAttemptsStr) + 1;

  if (attempts >= maxAttempts) {
    const unlockTime = Date.now() + lockoutDuration * 60000;
    await env.OTP_STORE.put(`lockout:time:${email}`, String(unlockTime), { expirationTtl: lockoutDuration * 60 });
    await env.OTP_STORE.delete(attemptsKey);
    return `Too many failed attempts. Your account has been locked for ${lockoutDuration} minutes.`;
  } else {
    await env.OTP_STORE.put(attemptsKey, String(attempts), { expirationTtl: 3600 }); // Keep attempts record for 1 hour
    const remaining = maxAttempts - attempts;
    return `Invalid verification code. You have ${remaining} attempt(s) remaining.`;
  }
}

async function clearFailedAttempts(email, env) {
  await env.OTP_STORE.delete(`lockout:attempts:${email}`);
  await env.OTP_STORE.delete(`lockout:time:${email}`);
}

// ── Send OTP ──────────────────────────────────────────────────
async function sendOTP(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, env);
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email) return errorResponse('Email is required.', 400, env);

  // Check lockout status
  const lockoutMsg = await checkLockout(email, env);
  if (lockoutMsg) return errorResponse(lockoutMsg, 423, env);

  // Turnstile Verification
  const rawConfig = await env.APP_CONFIG.get('app_config');
  const config = rawConfig ? JSON.parse(rawConfig) : {};
  const turnstileSecret = env.TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY || config.turnstileSecretKey;
  const turnstileEnabled = env.TURNSTILE_ENABLED === 'true' || env.TURNSTILE_ENABLED === true || config.turnstileEnabled || (!!turnstileSecret && env.TURNSTILE_ENABLED !== 'false');
  if (turnstileEnabled && (config.turnstileApplyLogin !== false)) {
    const turnstileToken = body.turnstileToken;
    if (!turnstileToken) {
      return errorResponse('Captcha verification is required.', 400, env);
    }
    const isValid = await verifyTurnstile(turnstileToken, turnstileSecret);
    if (!isValid) {
      return errorResponse('Captcha verification failed. Please try again.', 400, env);
    }
  }

  // Check against D1 whitelist
  const stmt = env.DB.prepare('SELECT * FROM admin_users WHERE email = ? AND is_active = 1');
  const admin = await stmt.bind(email).first();

  if (!admin) {
    return errorResponse('This email is not authorized to access the admin portal.', 403, env);
  }

  // Generate OTP and store in KV with TTL
  const otp = generateOTP();
  const otpKey = `otp:${email}`;
  const otpPayload = JSON.stringify({ otp, email, createdAt: Date.now() });
  await env.OTP_STORE.put(otpKey, otpPayload, { expirationTtl: OTP_TTL_SECONDS });

  // Send OTP via Resend API
  const emailSent = await sendOTPEmail(env, email, admin.name, otp);

  if (!emailSent.success) {
    console.error('[OTP Email Error]', emailSent.error);
    // In dev mode, still return success but log OTP
    console.log(`[DEV] OTP for ${email}: ${otp}`);
  }

  return jsonResponse({
    success: true,
    message: `OTP sent to ${maskEmail(email)}`,
    masked: maskEmail(email),
    // DEV ONLY: remove in production
    dev_otp: env.CORS_ORIGIN !== 'production' ? otp : undefined
  }, 200, env);
}

// ── Verify OTP ────────────────────────────────────────────────
async function verifyOTP(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, env);
  }

  const email = (body.email || '').trim().toLowerCase();
  const otp   = (body.otp   || '').trim();

  if (!email || !otp) return errorResponse('Email and OTP are required.', 400, env);

  // Check lockout status
  const lockoutMsg = await checkLockout(email, env);
  if (lockoutMsg) return errorResponse(lockoutMsg, 423, env);

  // Retrieve stored OTP
  const otpKey    = `otp:${email}`;
  const otpJson   = await env.OTP_STORE.get(otpKey);
  
  // Check for temporary test fallback OTP "123456" for admin email
  const isFallbackOTP = (email === 'info@7dayscreation.com' && otp === '123456');

  if (!otpJson && !isFallbackOTP) {
    return errorResponse('OTP expired or not found. Please request a new code.', 400, env);
  }

  if (isFallbackOTP) {
    // Valid fallback, bypass verification checks
  } else {
    const stored = JSON.parse(otpJson);
    // Validate
    if (stored.otp !== otp) {
      const failMsg = await handleFailedAttempt(email, env);
      return errorResponse(failMsg, 401, env);
    }
    // Delete OTP so it can't be reused
    await env.OTP_STORE.delete(otpKey);
  }

  // Fetch admin details
  const admin = await env.DB.prepare('SELECT * FROM admin_users WHERE email = ?').bind(email).first();

  // Check if 2FA is active
  const twoFASecret = await env.OTP_STORE.get(`2fa_secret:${email}`);
  if (twoFASecret) {
    // Generate a temporary 2FA verification token
    const tempToken = await generateSessionToken(email, env.SESSION_SECRET + '_temp');
    await env.OTP_STORE.put(`temp_2fa:${tempToken}`, email, { expirationTtl: 300 }); // 5 minutes TTL
    
    return jsonResponse({
      success: true,
      require2FA: true,
      tempToken
    }, 200, env);
  }

  // Clear failed attempts
  await clearFailedAttempts(email, env);

  const rawConfig = await env.APP_CONFIG.get('app_config');
  const config = rawConfig ? JSON.parse(rawConfig) : {};
  const sessionTimeoutMin = config.sessionTimeout || 10080; // default 7 days (10080 minutes) if not set
  const ttlSeconds = sessionTimeoutMin * 60;

  // Generate session token
  const token = await generateSessionToken(email, env.SESSION_SECRET);
  const session = {
    token,
    email,
    name: admin?.name || email,
    role: admin?.role || 'admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000
  };

  // Store session in KV with TTL
  await env.SESSIONS.put(`session:${token}`, JSON.stringify(session), { expirationTtl: ttlSeconds });

  return jsonResponse({
    success: true,
    token,
    user: { email: session.email, name: session.name, role: session.role }
  }, 200, env);
}

// ── Get Me ────────────────────────────────────────────────────
async function getMe(request, env) {
  const token = request.headers.get('X-Session-Token');
  if (!token) return errorResponse('No session token provided.', 401, env);

  const sessionJson = await env.SESSIONS.get(`session:${token}`);
  if (!sessionJson) return errorResponse('Session expired. Please log in again.', 401, env);

  const session = JSON.parse(sessionJson);

  return jsonResponse({
    success: true,
    user: { email: session.email, name: session.name, role: session.role }
  }, 200, env);
}

// ── Logout ────────────────────────────────────────────────────
async function logout(request, env) {
  const token = request.headers.get('X-Session-Token');
  if (token) {
    await env.SESSIONS.delete(`session:${token}`);
  }
  return jsonResponse({ success: true, message: 'Logged out successfully.' }, 200, env);
}

// ── Send OTP Email via Resend ─────────────────────────────────
async function sendOTPEmail(env, to, name, otp) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `7 Days Creation <no-reply@7dayscreation.com>`,
        to: [to],
        subject: `${otp} — Your Admin Portal OTP`,
        html: buildOTPEmailHtml(name, otp),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── OTP Email HTML Template ───────────────────────────────────
function buildOTPEmailHtml(name, otp) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#111111;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:2px;">7 DAYS CREATION</h1>
          <p style="margin:6px 0 0;color:#888888;font-size:12px;letter-spacing:1px;">ADMIN PORTAL</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;color:#333333;font-size:16px;">Hello <strong>${name}</strong>,</p>
          <p style="margin:0 0 32px;color:#555555;font-size:15px;line-height:1.6;">
            Your one-time password for the 7 Days Creation Communication Portal is:
          </p>
          <!-- OTP Box -->
          <div style="background:#f8f8f8;border:2px dashed #dddddd;border-radius:8px;padding:28px;text-align:center;margin:0 0 32px;">
            <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#111111;">${otp}</span>
          </div>
          <p style="margin:0 0 16px;color:#777777;font-size:13px;line-height:1.6;">
            This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.
          </p>
          <p style="margin:0;color:#777777;font-size:13px;">If you did not request this, please ignore this email.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
          <p style="margin:0;color:#aaaaaa;font-size:12px;">© 2026 7 Days Creation. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Public Branding Config ────────────────────────────────────
async function getBranding(request, env) {
  const raw = await env.APP_CONFIG.get('app_config');
  const config = raw ? JSON.parse(raw) : {};
  const turnstileSecret = env.TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY || config.turnstileSecretKey;
  const turnstileEnabled = env.TURNSTILE_ENABLED === 'true' || env.TURNSTILE_ENABLED === true || config.turnstileEnabled || (!!turnstileSecret && env.TURNSTILE_ENABLED !== 'false');
  return jsonResponse({
    success: true,
    data: {
      brandName: config.brandName || 'Connect',
      brandTagline: config.brandTagline || '',
      brandUrl: config.brandUrl || '',
      logoBase64: config.logoBase64 || null,
      faviconBase64: config.faviconBase64 || null,
      turnstileEnabled: turnstileEnabled,
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || config.turnstileSiteKey || '',
      turnstileTheme: config.turnstileTheme || 'light'
    }
  }, 200, env);
}

// ── requireSession Helper ─────────────────────────────────────
async function requireSession(request, env) {
  const token = request.headers.get('X-Session-Token');
  if (!token) return null;
  const sessionJson = await env.SESSIONS.get(`session:${token}`);
  return sessionJson ? JSON.parse(sessionJson) : null;
}

// ── Generate 2FA Secret Endpoint ──────────────────────────────
async function generate2FASecretEndpoint(request, env) {
  const session = await requireSession(request, env);
  if (!session) return errorResponse('Unauthorized', 401, env);

  const secret = generateBase32Secret(16);
  const appName = encodeURIComponent(env.APP_NAME || '7 Days Creation');
  const email = encodeURIComponent(session.email);
  const otpauthUrl = `otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${appName}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`;

  return jsonResponse({
    success: true,
    secret,
    qrCodeUrl
  }, 200, env);
}

// ── Verify 2FA Setup Endpoint ─────────────────────────────────
async function verify2FASetupEndpoint(request, env) {
  const session = await requireSession(request, env);
  if (!session) return errorResponse('Unauthorized', 401, env);

  let body;
  try { body = await request.json(); }
  catch { return errorResponse('Invalid JSON body', 400, env); }

  const { secret, code } = body;
  if (!secret || !code) return errorResponse('Secret and code are required.', 400, env);

  const isValid = await verifyTOTP(secret, code);
  if (!isValid) return errorResponse('Invalid verification code. Setup failed.', 400, env);

  // Store secret in OTP_STORE KV namespace associated with user email
  await env.OTP_STORE.put(`2fa_secret:${session.email}`, secret);

  return jsonResponse({
    success: true,
    message: '2FA enabled successfully!'
  }, 200, env);
}

// ── Disable 2FA Endpoint ──────────────────────────────────────
async function disable2FAEndpoint(request, env) {
  const session = await requireSession(request, env);
  if (!session) return errorResponse('Unauthorized', 401, env);

  await env.OTP_STORE.delete(`2fa_secret:${session.email}`);

  return jsonResponse({
    success: true,
    message: '2FA disabled successfully.'
  }, 200, env);
}

// ── Get 2FA Status Endpoint ───────────────────────────────────
async function get2FAStatusEndpoint(request, env) {
  const session = await requireSession(request, env);
  if (!session) return errorResponse('Unauthorized', 401, env);

  const secret = await env.OTP_STORE.get(`2fa_secret:${session.email}`);

  return jsonResponse({
    success: true,
    enabled: !!secret
  }, 200, env);
}

// ── Verify 2FA Endpoint (Login verification step) ─────────────
async function verify2FAEndpoint(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse('Invalid JSON body', 400, env); }

  const { tempToken, code } = body;
  if (!tempToken || !code) return errorResponse('Verification code is required.', 400, env);

  const email = await env.OTP_STORE.get(`temp_2fa:${tempToken}`);
  if (!email) return errorResponse('Session expired. Please request a new OTP.', 400, env);

  // Check lockout status
  const lockoutMsg = await checkLockout(email, env);
  if (lockoutMsg) return errorResponse(lockoutMsg, 423, env);

  const secret = await env.OTP_STORE.get(`2fa_secret:${email}`);
  if (!secret) return errorResponse('Two-factor authentication is not active on this account.', 400, env);

  const isValid = await verifyTOTP(secret, code);
  if (!isValid) {
    const failMsg = await handleFailedAttempt(email, env);
    return errorResponse(failMsg, 401, env);
  }

  // Clear failed attempts
  await clearFailedAttempts(email, env);

  // Invalidate temp token
  await env.OTP_STORE.delete(`temp_2fa:${tempToken}`);

  // Fetch admin user
  const admin = await env.DB.prepare('SELECT * FROM admin_users WHERE email = ?').bind(email).first();

  const rawConfig = await env.APP_CONFIG.get('app_config');
  const config = rawConfig ? JSON.parse(rawConfig) : {};
  const sessionTimeoutMin = config.sessionTimeout || 10080; // default 7 days (10080 minutes) if not set
  const ttlSeconds = sessionTimeoutMin * 60;

  // Generate final session token
  const token = await generateSessionToken(email, env.SESSION_SECRET);
  const session = {
    token,
    email,
    name: admin?.name || email,
    role: admin?.role || 'admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000
  };

  // Store session in KV
  await env.SESSIONS.put(`session:${token}`, JSON.stringify(session), { expirationTtl: ttlSeconds });

  return jsonResponse({
    success: true,
    token,
    user: { email: session.email, name: session.name, role: session.role }
  }, 200, env);
}

// ── Mask Email ────────────────────────────────────────────────
function maskEmail(email) {
  const [user, domain] = email.split('@');
  const masked = user.length > 3
    ? user.slice(0, 3) + '***'
    : user[0] + '***';
  return `${masked}@${domain}`;
}

// ── Route Handler ─────────────────────────────────────────────
export async function handleAuth(request, env, pathname) {
  const method = request.method;

  if (pathname === '/api/auth/send-otp'  && method === 'POST') return sendOTP(request, env);
  if (pathname === '/api/auth/verify-otp' && method === 'POST') return verifyOTP(request, env);
  if (pathname === '/api/auth/me'         && method === 'GET')  return getMe(request, env);
  if (pathname === '/api/auth/logout'     && method === 'POST') return logout(request, env);
  if (pathname === '/api/auth/branding'   && method === 'GET')  return getBranding(request, env);

  // 2FA Endpoints
  if (pathname === '/api/auth/2fa/generate'     && method === 'POST') return generate2FASecretEndpoint(request, env);
  if (pathname === '/api/auth/2fa/verify-setup' && method === 'POST') return verify2FASetupEndpoint(request, env);
  if (pathname === '/api/auth/2fa/disable'      && method === 'POST') return disable2FAEndpoint(request, env);
  if (pathname === '/api/auth/2fa/status'       && method === 'GET')  return get2FAStatusEndpoint(request, env);
  if (pathname === '/api/auth/2fa/verify'       && method === 'POST') return verify2FAEndpoint(request, env);

  return errorResponse('Auth route not found.', 404, env);
}
