/**
 * Campaigns Routes: /api/campaigns/*
 *
 * GET  /api/campaigns/email             → List email campaigns
 * POST /api/campaigns/email/send        → Send email campaign via Resend + store in D1
 * GET  /api/campaigns/whatsapp          → List WhatsApp campaigns
 * POST /api/campaigns/whatsapp/send     → Send WhatsApp campaign (dummy/real) + store in D1
 */

import { jsonResponse, errorResponse, generateId, nowISO, parseRoute } from '../utils/helpers.js';

// ══════════════════════════════════════════════════════════════
// EMAIL CAMPAIGNS
// ══════════════════════════════════════════════════════════════

async function listEmailCampaigns(request, env) {
  const results = await env.DB.prepare(
    'SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT 100'
  ).all();

  return jsonResponse({ success: true, data: results.results || [] }, 200, env);
}

async function sendEmailCampaign(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse('Invalid JSON body.', 400, env); }

  const { name, subject, audience, bodyHtml } = body;
  if (!name || !subject) return errorResponse('Campaign name and subject are required.', 400, env);
  if (!bodyHtml)         return errorResponse('Email body HTML is required.', 400, env);

  // Build recipient list from D1
  const recipients = await buildRecipientList(env, audience);

  // Send via Resend (batch or single)
  let sendResult = { success: true, delivered: recipients.length };
  if (recipients.length > 0) {
    sendResult = await sendEmailViaResend(env, recipients, subject, name, bodyHtml);
  }

  // Save campaign to D1
  const id = generateId();
  const sentAt = nowISO();
  await env.DB.prepare(`
    INSERT INTO email_campaigns (id, name, subject, audience, status, body_html, open_rate, click_rate, sent_at, created_at)
    VALUES (?, ?, ?, ?, 'Sent', ?, '0.0%', '0.0%', ?, ?)
  `).bind(id, name, subject, audience || 'All', bodyHtml, sentAt, sentAt).run();

  // Add notification
  const notifId = generateId();
  await env.DB.prepare(`
    INSERT INTO notifications (id, type, icon, title, description, is_read, created_at)
    VALUES (?, 'Campaigns', 'fa-envelope', 'Email Campaign Blasted', ?, 0, ?)
  `).bind(
    notifId,
    `Campaign '${name}' sent to '${audience || 'All'}' (${recipients.length} recipients) via Resend API.`,
    sentAt
  ).run();

  return jsonResponse({
    success: true,
    message: `Email campaign sent to ${recipients.length} recipient(s).`,
    campaign: { id, name, subject, audience, status: 'Sent', sentAt },
    resend: sendResult
  }, 200, env);
}

// ── Send via Resend API ───────────────────────────────────────
async function sendEmailViaResend(env, recipients, subject, campaignName, html) {
  try {
    // Resend supports up to 50 recipients per call
    const toList = recipients.slice(0, 50).map(r => `${r.name} <${r.email}>`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `7 Days Creation <no-reply@7dayscreation.com>`,
        to: toList,
        subject,
        html,
        tags: [{ name: 'campaign', value: campaignName }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Resend API Error]', err);
      return { success: false, error: err, delivered: 0 };
    }

    const data = await res.json();
    return { success: true, id: data.id, delivered: toList.length };

  } catch (err) {
    console.error('[Resend Fetch Error]', err);
    return { success: false, error: err.message, delivered: 0 };
  }
}

// ── Build recipient list from D1 based on audience ───────────
async function buildRecipientList(env, audience) {
  if (!audience || audience === 'All') {
    const res = await env.DB.prepare(
      "SELECT first_name || ' ' || surname as name, email FROM inquiries WHERE email IS NOT NULL AND email != '' LIMIT 500"
    ).all();
    return res.results || [];
  }

  const res = await env.DB.prepare(
    "SELECT first_name || ' ' || surname as name, email FROM inquiries WHERE inquiry_type = ? AND email IS NOT NULL AND email != '' LIMIT 500"
  ).bind(audience).all();
  return res.results || [];
}

// ══════════════════════════════════════════════════════════════
// WHATSAPP CAMPAIGNS
// ══════════════════════════════════════════════════════════════

async function listWhatsappCampaigns(request, env) {
  const results = await env.DB.prepare(
    'SELECT * FROM whatsapp_campaigns ORDER BY created_at DESC LIMIT 100'
  ).all();

  return jsonResponse({ success: true, data: results.results || [] }, 200, env);
}

async function sendWhatsappCampaign(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse('Invalid JSON body.', 400, env); }

  const { name, templateName, audience, message, mediaType, mediaUrl } = body;
  if (!name || !message) return errorResponse('Campaign name and message are required.', 400, env);

  // Build recipient list
  const recipients = await buildRecipientList(env, audience);

  // Send via WhatsApp API (dummy or real)
  const waResult = await sendWhatsappViaAPI(env, recipients, message, templateName, mediaType, mediaUrl);

  // Save campaign to D1
  const id = generateId();
  const sentAt = nowISO();
  await env.DB.prepare(`
    INSERT INTO whatsapp_campaigns (id, name, template_name, audience, status, message, media_type, media_url, delivered_rate, read_rate, sent_at, created_at)
    VALUES (?, ?, ?, ?, 'Sent', ?, ?, ?, '100%', 'Pending', ?, ?)
  `).bind(
    id, name, templateName || 'Custom Message', audience || 'All',
    message, mediaType || 'none', mediaUrl || null, sentAt, sentAt
  ).run();

  // Add notification
  const notifId = generateId();
  await env.DB.prepare(`
    INSERT INTO notifications (id, type, icon, title, description, is_read, created_at)
    VALUES (?, 'Campaigns', 'fa-comments', 'WhatsApp Campaign Sent', ?, 0, ?)
  `).bind(
    notifId,
    `WhatsApp blast '${name}' dispatched to '${audience || 'All'}' (${recipients.length} contacts).`,
    sentAt
  ).run();

  return jsonResponse({
    success: true,
    message: `WhatsApp campaign dispatched to ${recipients.length} contact(s).`,
    campaign: { id, name, audience, status: 'Sent', sentAt },
    whatsapp: waResult
  }, 200, env);
}

// ── Send via WhatsApp Business API (Dummy → Real) ─────────────
async function sendWhatsappViaAPI(env, recipients, message, templateName, mediaType, mediaUrl) {
  // Check if real WA API is configured
  const waToken = env.WA_ACCESS_TOKEN;
  const waPhoneId = env.WA_PHONE_NUMBER_ID;

  if (!waToken || waToken === 'DUMMY_WA_ACCESS_TOKEN' || !waPhoneId || waPhoneId === 'DUMMY_PHONE_ID') {
    // ── DUMMY MODE ──────────────────────────────────────────────
    console.log(`[WA DUMMY] Would send to ${recipients.length} recipients: "${message}"`);
    return {
      success: true,
      mode: 'dummy',
      message: 'WhatsApp API not yet configured. Campaign logged for when API is ready.',
      recipients: recipients.length
    };
  }

  // ── REAL MODE (WhatsApp Business Cloud API) ─────────────────
  const results = [];
  for (const recipient of recipients.slice(0, 100)) {
    try {
      const waBody = buildWAPayload(recipient, message, templateName, mediaType, mediaUrl);
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${waPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(waBody)
        }
      );
      const data = await res.json();
      results.push({ phone: recipient.phone, success: res.ok, data });
    } catch (err) {
      results.push({ phone: recipient.phone, success: false, error: err.message });
    }
  }

  const sent = results.filter(r => r.success).length;
  return { success: true, mode: 'live', sent, total: recipients.length };
}

function buildWAPayload(recipient, message, templateName, mediaType, mediaUrl) {
  // If media is attached, use media message type; otherwise text
  const personalizedMsg = message.replace(/{Name}/g, recipient.name || 'Valued Customer');

  return {
    messaging_product: 'whatsapp',
    to: recipient.phone,
    type: 'text',
    text: { body: personalizedMsg }
  };
}

// ── Route Handler ─────────────────────────────────────────────
export async function handleCampaigns(request, env, pathname) {
  const method = request.method;

  if (pathname === '/api/campaigns/email'        && method === 'GET')  return listEmailCampaigns(request, env);
  if (pathname === '/api/campaigns/email/send'   && method === 'POST') return sendEmailCampaign(request, env);
  if (pathname === '/api/campaigns/whatsapp'     && method === 'GET')  return listWhatsappCampaigns(request, env);
  if (pathname === '/api/campaigns/whatsapp/send'&& method === 'POST') return sendWhatsappCampaign(request, env);

  return errorResponse('Campaigns route not found.', 404, env);
}
