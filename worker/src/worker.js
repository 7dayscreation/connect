/**
 * 7 Days Creation — Communication Portal API Worker
 * Cloudflare Worker entry point
 * Routes: /api/auth/*, /api/inquiries/*, /api/campaigns/*, /api/notifications/*, /api/config/*, /api/dashboard/*
 */

import { handleAuth } from './routes/auth.js';
import { handleInquiries } from './routes/inquiries.js';
import { handleCampaigns } from './routes/campaigns.js';
import { handleNotifications } from './routes/notifications.js';
import { handleConfig } from './routes/config.js';
import { handleDashboard } from './routes/dashboard.js';
import { authenticate } from './middleware/auth.js';
import { corsHeaders, jsonResponse, errorResponse } from './utils/helpers.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ── Handle CORS preflight ──────────────────────────────────
    const requestOrigin = request.headers.get('Origin') || '*';
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': requestOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Helper to inject headers
    const applyCors = (res) => {
      const newHeaders = new Headers(res.headers);
      newHeaders.set('Access-Control-Allow-Origin', requestOrigin);
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
      });
    };

    // ── Route dispatcher ─────────────────────────────────────────
    try {
      let response;
      // Public routes (no auth required)
      if (pathname.startsWith('/api/auth')) {
        response = await handleAuth(request, env, pathname);
      } else {
        // All other /api/* routes require a valid session
        const session = await authenticate(request, env);
        if (!session) {
          response = errorResponse('Unauthorized. Please log in.', 401, env);
        } else {
          // Attach session to request for downstream handlers
          request.session = session;

          if (pathname.startsWith('/api/inquiries')) {
            response = await handleInquiries(request, env, pathname);
          } else if (pathname.startsWith('/api/campaigns')) {
            response = await handleCampaigns(request, env, pathname);
          } else if (pathname.startsWith('/api/notifications')) {
            response = await handleNotifications(request, env, pathname);
          } else if (pathname.startsWith('/api/config')) {
            response = await handleConfig(request, env, pathname);
          } else if (pathname.startsWith('/api/dashboard')) {
            response = await handleDashboard(request, env, pathname);
          } else {
            response = errorResponse('Not Found', 404, env);
          }
        }
      }

      return applyCors(response);

    } catch (err) {
      console.error('[Worker Error]', err);
      return applyCors(errorResponse('Internal Server Error: ' + err.message, 500, env));
    }
  },
  async scheduled(event, env, ctx) {
    console.log('[Cron Trigger] Checking for scheduled campaigns at', new Date().toISOString());
  }
};
