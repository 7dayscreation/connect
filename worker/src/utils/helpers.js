/**
 * Shared utility helpers for the 7DC Communication Worker
 */

// ── CORS Headers ─────────────────────────────────────────────
export function corsHeaders(env) {
  const origin = env?.CORS_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': origin === 'production' ? 'https://7dayscreation.com' : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
    'Access-Control-Max-Age': '86400',
  };
}

// ── JSON Response ─────────────────────────────────────────────
export function jsonResponse(data, status = 200, env = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
    },
  });
}

// ── Error Response ────────────────────────────────────────────
export function errorResponse(message, status = 400, env = null) {
  return jsonResponse({ success: false, error: message }, status, env);
}

// ── Generate Unique ID (UUID-like using crypto) ───────────────
export function generateId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-${((parseInt(hex[16],16)&0x3)|0x8).toString(16)}${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

// ── Generate 6-digit OTP ──────────────────────────────────────
export function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

// ── Hash string with SHA-256 ──────────────────────────────────
export async function sha256(str) {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Generate session token ────────────────────────────────────
export async function generateSessionToken(email, secret) {
  const payload = `${email}:${Date.now()}:${generateId()}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'default-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${btoa(payload)}.${sigHex}`;
}

// ── Format current datetime ISO ────────────────────────────────
export function nowISO() {
  return new Date().toISOString();
}

// ── Parse route segments ───────────────────────────────────────
export function parseRoute(pathname, prefix) {
  const rest = pathname.slice(prefix.length).replace(/^\//, '');
  const parts = rest.split('/').filter(Boolean);
  return parts;
}

// ── Verify Turnstile Token ────────────────────────────────────
export async function verifyTurnstile(token, secret) {
  if (!token) return false;
  try {
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('[Turnstile Verification Error]', err);
    return false;
  }
}

// ── TOTP 2FA Utilities ──────────────────────────────────────
function decodeBase32(str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  str = str.toUpperCase().replace(/=+$/, '');
  const len = str.length;
  let bits = 0;
  let val = 0;
  const bytes = [];
  for (let i = 0; i < len; i++) {
    const idx = alphabet.indexOf(str[i]);
    if (idx === -1) throw new Error('Invalid base32 character');
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((val >> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

export function generateBase32Secret(length = 16) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[randomBytes[i] % 32];
  }
  return result;
}

export async function verifyTOTP(secret, code, window = 1) {
  try {
    const keyBytes = decodeBase32(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    for (let i = -window; i <= window; i++) {
      const c = counter + i;
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setUint32(0, 0);
      view.setUint32(4, c);

      const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
      const hash = new Uint8Array(signature);

      const offset = hash[hash.length - 1] & 0x0f;
      const binary =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

      const otpVal = binary % 1000000;
      const otpStr = String(otpVal).padStart(6, '0');
      if (otpStr === code.trim()) {
        return true;
      }
    }
  } catch (err) {
    console.error('TOTP verification error:', err);
  }
  return false;
}
