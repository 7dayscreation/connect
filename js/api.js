/**
 * 7 Days Creation — Communication Portal
 * Central API Client Module
 * Connects frontend to Cloudflare Worker API (http://127.0.0.1:8787 dev / production URL)
 *
 * Usage:
 *   import { api } from './api.js';
 *   const data = await api.get('/inquiries');
 *   const result = await api.post('/auth/send-otp', { email });
 */

(function (global) {
  'use strict';

  // ── API Base URL ────────────────────────────────────────────
  // Automatically switches between local dev and production
  const isLocalhost = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );

  const API_BASE = (function() {
    let base = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
      ? CONFIG.API_BASE_URL
      : (isLocalhost
          ? 'http://127.0.0.1:8787'
          : 'https://7dayscreation-api.info-f6c.workers.dev');
    if (!base.endsWith('/api')) {
      base = base.replace(/\/$/, '') + '/api';
    }
    return base;
  })();

  // ── Session Management ──────────────────────────────────────
  const SESSION_KEY = '7dc_session_token';
  const USER_KEY    = '7dc_user';

  function getToken() {
    return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  }

  function setToken(token, user, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearToken() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getUser() {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  // ── Core Fetch Wrapper ──────────────────────────────────────
  async function apiFetch(method, endpoint, body = null, options = {}) {
    const url = API_BASE + endpoint;
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['X-Session-Token'] = token;
    }

    const config = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json();

      // Handle unauthorized (session expired)
      if (res.status === 401 && !options.skipAuthRedirect) {
        clearToken();
        window.location.href = 'index.html';
        return null;
      }

      return { ok: res.ok, status: res.status, data };

    } catch (err) {
      console.error(`[API Error] ${method} ${endpoint}:`, err);
      return {
        ok: false,
        status: 0,
        data: { success: false, error: 'Network error. Check if the API server is running.' }
      };
    }
  }

  // ── Convenience Methods ─────────────────────────────────────
  const api = {
    get:    (endpoint, options = {}) => apiFetch('GET', endpoint, null, options),
    post:   (endpoint, body, options = {}) => apiFetch('POST', endpoint, body, options),
    put:    (endpoint, body, options = {}) => apiFetch('PUT', endpoint, body, options),
    patch:  (endpoint, body, options = {}) => apiFetch('PATCH', endpoint, body, options),
    delete: (endpoint, options = {}) => apiFetch('DELETE', endpoint, null, options),

    // ── Auth helpers ──────────────────────────────────────────
    auth: {
      sendOTP: (email, turnstileToken = null) => {
        const body = { email };
        if (turnstileToken) body.turnstileToken = turnstileToken;
        return apiFetch('POST', '/auth/send-otp', body, { skipAuthRedirect: true });
      },
      verifyOTP: (email, otp) => apiFetch('POST', '/auth/verify-otp', { email, otp }, { skipAuthRedirect: true }),
      me: () => apiFetch('GET', '/auth/me', null, { skipAuthRedirect: true }),
      logout: async () => {
        await apiFetch('POST', '/auth/logout');
        clearToken();
        window.location.href = 'index.html';
      },
      branding: () => apiFetch('GET', '/auth/branding', null, { skipAuthRedirect: true }),
      twoFA: {
        generate: () => apiFetch('POST', '/auth/2fa/generate'),
        verifySetup: (secret, code) => apiFetch('POST', '/auth/2fa/verify-setup', { secret, code }),
        disable: () => apiFetch('POST', '/auth/2fa/disable'),
        status: () => apiFetch('GET', '/auth/2fa/status'),
        verify: (tempToken, code) => apiFetch('POST', '/auth/2fa/verify', { tempToken, code }, { skipAuthRedirect: true })
      }
    },

    // ── Session ───────────────────────────────────────────────
    session: { getToken, setToken, clearToken, getUser, isLoggedIn },

    // ── Dashboard ─────────────────────────────────────────────
    dashboard: {
      stats: () => apiFetch('GET', '/dashboard/stats')
    },

    // ── Inquiries ─────────────────────────────────────────────
    inquiries: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch('GET', `/inquiries${qs ? '?' + qs : ''}`);
      },
      get:    (id)   => apiFetch('GET', `/inquiries/${id}`),
      create: (data) => apiFetch('POST', '/inquiries', data),
      delete: (id)   => apiFetch('DELETE', `/inquiries/${id}`)
    },

    // ── Campaigns ─────────────────────────────────────────────
    campaigns: {
      email: {
        list: () => apiFetch('GET', '/campaigns/email'),
        send: (data) => apiFetch('POST', '/campaigns/email/send', data)
      },
      whatsapp: {
        list: () => apiFetch('GET', '/campaigns/whatsapp'),
        send: (data) => apiFetch('POST', '/campaigns/whatsapp/send', data)
      }
    },

    // ── Notifications ─────────────────────────────────────────
    notifications: {
      list: () => apiFetch('GET', '/notifications'),
      markRead: (id) => apiFetch('PATCH', `/notifications/${id}/read`),
      markAllRead: () => apiFetch('POST', '/notifications/read-all')
    },

    // ── Config ────────────────────────────────────────────────
    config: {
      get: () => apiFetch('GET', '/config'),
      save: (data) => apiFetch('PUT', '/config', data)
    }
  };

  // ── Auth Guard (call on protected pages) ────────────────────
  api.requireAuth = async function () {
    if (!isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }

    // Optionally validate session with server
    const res = await api.auth.me();
    if (!res || !res.ok) {
      clearToken();
      window.location.href = 'index.html';
      return false;
    }

    return true;
  };

  // ── Auto-initialize branding elements on load ──────────────
  async function initBranding() {
    try {
      const res = await api.auth.branding();
      if (res && res.ok && res.data.data) {
        const brand = res.data.data;
        
        // Apply brand logo to header / login
        if (brand.logoBase64) {
          const logoEls = document.querySelectorAll('img[src*="logo.png"]');
          logoEls.forEach(img => {
            img.src = brand.logoBase64;
          });
        }

        // Apply brand favicon
        if (brand.faviconBase64) {
          let faviconLink = document.querySelector('link[rel*="icon"]');
          if (!faviconLink) {
            faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            document.head.appendChild(faviconLink);
          }
          faviconLink.href = brand.faviconBase64;
        }
      }
    } catch (e) {
      console.warn('[Branding] Failed to apply branding config:', e);
    }
  }

  // Run on DOM Content Loaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBranding);
    } else {
      initBranding();
    }
  }

  // ── Expose globally ─────────────────────────────────────────
  global.API = api;
  global.API_BASE = API_BASE;

})(window);
