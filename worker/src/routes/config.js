/**
 * Config Routes: /api/config/*
 * KV-backed application settings
 *
 * GET /api/config     → Load all app config from KV
 * PUT /api/config     → Save app config to KV
 */

import { jsonResponse, errorResponse } from '../utils/helpers.js';

const CONFIG_KEY = 'app_config';

const DEFAULT_CONFIG = {
  appName: '7 Days Creation',
  fromEmail: 'no-reply@7dayscreation.com',
  fromName: '7 Days Creation',
  brandColor: '#111111',
  emailNotifications: true,
  defaultAudience: 'All',
  timezone: 'Asia/Kolkata',
  updatedAt: null
};

async function getConfig(request, env) {
  const raw = await env.APP_CONFIG.get(CONFIG_KEY);
  const config = raw ? JSON.parse(raw) : DEFAULT_CONFIG;
  return jsonResponse({ success: true, data: config }, 200, env);
}

async function saveConfig(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse('Invalid JSON body.', 400, env); }

  const existing = await env.APP_CONFIG.get(CONFIG_KEY);
  const current = existing ? JSON.parse(existing) : DEFAULT_CONFIG;

  const updated = {
    ...current,
    ...body,
    updatedAt: new Date().toISOString()
  };

  await env.APP_CONFIG.put(CONFIG_KEY, JSON.stringify(updated));
  return jsonResponse({ success: true, message: 'Settings saved.', data: updated }, 200, env);
}

export async function handleConfig(request, env, pathname) {
  if (pathname === '/api/config' && request.method === 'GET') return getConfig(request, env);
  if (pathname === '/api/config' && request.method === 'PUT') return saveConfig(request, env);
  return errorResponse('Config route not found.', 404, env);
}
