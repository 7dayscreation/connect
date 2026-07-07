/**
 * Inquiries Routes: /api/inquiries/*
 *
 * GET    /api/inquiries           → List all inquiries (with optional search/filter)
 * POST   /api/inquiries           → Create new inquiry
 * GET    /api/inquiries/:id       → Get single inquiry
 * DELETE /api/inquiries/:id       → Delete inquiry
 */

import { jsonResponse, errorResponse, generateId, nowISO, parseRoute, verifyTurnstile } from '../utils/helpers.js';

// ── List Inquiries ────────────────────────────────────────────
async function listInquiries(request, env) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const type   = url.searchParams.get('type') || '';
  const limit  = parseInt(url.searchParams.get('limit') || '200');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = 'SELECT * FROM inquiries WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (first_name LIKE ? OR surname LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (type && type !== 'all') {
    query += ' AND inquiry_type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = env.DB.prepare(query);
  const results = await stmt.bind(...params).all();

  // Count total
  let countQuery = 'SELECT COUNT(*) as total FROM inquiries WHERE 1=1';
  const countParams = [];
  if (search) {
    countQuery += ' AND (first_name LIKE ? OR surname LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const s = `%${search}%`;
    countParams.push(s, s, s, s);
  }
  if (type && type !== 'all') {
    countQuery += ' AND inquiry_type = ?';
    countParams.push(type);
  }
  const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

  return jsonResponse({
    success: true,
    data: results.results || [],
    total: countResult?.total || 0,
    limit,
    offset
  }, 200, env);
}

// ── Get Single Inquiry ────────────────────────────────────────
async function getInquiry(request, env, id) {
  const row = await env.DB.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();
  if (!row) return errorResponse('Inquiry not found.', 404, env);
  return jsonResponse({ success: true, data: row }, 200, env);
}

// ── Create Inquiry ────────────────────────────────────────────
async function createInquiry(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400, env);
  }

  const { firstName, surname, phone, email, inquiryType, notes, turnstileToken } = body;

  // Validation
  if (!firstName || !surname || !phone || !inquiryType) {
    return errorResponse('firstName, surname, phone, and inquiryType are required.', 400, env);
  }

  // Turnstile Verification
  const rawConfig = await env.APP_CONFIG.get('app_config');
  const config = rawConfig ? JSON.parse(rawConfig) : {};
  const turnstileSecret = env.TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY || config.turnstileSecretKey;
  const isExplicitlyDisabled = env.TURNSTILE_ENABLED === false || env.TURNSTILE_ENABLED === 'false';
  const turnstileEnabled = !isExplicitlyDisabled && (
    env.TURNSTILE_ENABLED === 'true' || 
    env.TURNSTILE_ENABLED === true || 
    config.turnstileEnabled || 
    !!turnstileSecret
  );
  if (turnstileEnabled && (config.turnstileApplyInquiry !== false)) {
    if (!turnstileToken) {
      return errorResponse('Captcha verification is required.', 400, env);
    }
    const isValid = await verifyTurnstile(turnstileToken, turnstileSecret);
    if (!isValid) {
      return errorResponse('Captcha verification failed. Please try again.', 400, env);
    }
  }

  const id = generateId();
  const createdAt = nowISO();

  await env.DB.prepare(`
    INSERT INTO inquiries (id, first_name, surname, phone, email, inquiry_type, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, firstName.trim(), surname.trim(), phone.trim(), email?.trim() || null, inquiryType.trim(), notes?.trim() || null, createdAt).run();

  // Add a notification
  const notifId = generateId();
  await env.DB.prepare(`
    INSERT INTO notifications (id, type, icon, title, description, is_read, created_at)
    VALUES (?, 'Inquiries', 'fa-user-plus', ?, ?, 0, ?)
  `).bind(
    notifId,
    `New ${inquiryType} Received`,
    `${firstName} ${surname} (${phone}) submitted a ${inquiryType}.`,
    createdAt
  ).run();

  return jsonResponse({
    success: true,
    message: 'Inquiry saved successfully.',
    data: { id, firstName, surname, phone, email, inquiryType, notes, createdAt }
  }, 201, env);
}

// ── Delete Inquiry ────────────────────────────────────────────
async function deleteInquiry(request, env, id) {
  const row = await env.DB.prepare('SELECT id FROM inquiries WHERE id = ?').bind(id).first();
  if (!row) return errorResponse('Inquiry not found.', 404, env);

  await env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true, message: 'Inquiry deleted.' }, 200, env);
}

// ── Route Handler ─────────────────────────────────────────────
export async function handleInquiries(request, env, pathname) {
  const method = request.method;
  const parts = parseRoute(pathname, '/api/inquiries');
  const id = parts[0];

  if (!id && method === 'GET')    return listInquiries(request, env);
  if (!id && method === 'POST')   return createInquiry(request, env);
  if (id  && method === 'GET')    return getInquiry(request, env, id);
  if (id  && method === 'DELETE') return deleteInquiry(request, env, id);

  return errorResponse('Inquiries route not found.', 404, env);
}
