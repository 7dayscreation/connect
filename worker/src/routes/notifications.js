/**
 * Notifications Routes: /api/notifications/*
 *
 * GET   /api/notifications         → List notifications (unread first)
 * PATCH /api/notifications/:id/read → Mark single notification as read
 * POST  /api/notifications/read-all → Mark all notifications as read
 */

import { jsonResponse, errorResponse, parseRoute } from '../utils/helpers.js';

async function listNotifications(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const results = await env.DB.prepare(
    'SELECT * FROM notifications ORDER BY is_read ASC, created_at DESC LIMIT ?'
  ).bind(limit).all();

  const unreadCount = await env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0'
  ).first();

  return jsonResponse({
    success: true,
    data: results.results || [],
    unread: unreadCount?.cnt || 0
  }, 200, env);
}

async function markRead(request, env, id) {
  await env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ?'
  ).bind(id).run();
  return jsonResponse({ success: true, message: 'Notification marked as read.' }, 200, env);
}

async function markAllRead(request, env) {
  await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
  return jsonResponse({ success: true, message: 'All notifications marked as read.' }, 200, env);
}

export async function handleNotifications(request, env, pathname) {
  const method = request.method;
  const parts  = parseRoute(pathname, '/api/notifications');
  const id     = parts[0];
  const action = parts[1];

  if (!id && method === 'GET')  return listNotifications(request, env);
  if (!id && method === 'POST' && pathname.endsWith('read-all')) return markAllRead(request, env);
  if (id && action === 'read' && method === 'PATCH') return markRead(request, env, id);

  // Also handle: POST /api/notifications/read-all
  if (pathname === '/api/notifications/read-all' && method === 'POST') return markAllRead(request, env);

  return errorResponse('Notifications route not found.', 404, env);
}
