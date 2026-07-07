/**
 * Dashboard Stats Routes: /api/dashboard/*
 *
 * GET /api/dashboard/stats → Aggregated counts for live dashboard metrics
 */

import { jsonResponse, errorResponse } from '../utils/helpers.js';

async function getDashboardStats(request, env) {
  // Run all count queries in parallel using Promise.all
  const [
    totalInquiries,
    emailCampaignsSent,
    waCampaignsSent,
    unreadNotifs,
    inquiryBreakdown,
    recentInquiries,
    recentEmailCampaigns,
    recentWaCampaigns
  ] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as cnt FROM inquiries").first(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM email_campaigns WHERE status = 'Sent'").first(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM whatsapp_campaigns WHERE status = 'Sent'").first(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0").first(),
    env.DB.prepare(`
      SELECT inquiry_type, COUNT(*) as cnt 
      FROM inquiries 
      GROUP BY inquiry_type
    `).all(),
    env.DB.prepare(`
      SELECT id, first_name, surname, phone, email, inquiry_type, created_at 
      FROM inquiries 
      ORDER BY created_at DESC LIMIT 5
    `).all(),
    env.DB.prepare(`
      SELECT id, name, subject, audience, status, open_rate, click_rate, sent_at 
      FROM email_campaigns 
      ORDER BY created_at DESC LIMIT 5
    `).all(),
    env.DB.prepare(`
      SELECT id, name, template_name, audience, status, delivered_rate, read_rate, sent_at 
      FROM whatsapp_campaigns 
      ORDER BY created_at DESC LIMIT 5
    `).all()
  ]);

  // Build inquiry type breakdown map
  const typeMap = {};
  (inquiryBreakdown.results || []).forEach(row => {
    typeMap[row.inquiry_type] = row.cnt;
  });

  return jsonResponse({
    success: true,
    stats: {
      totalInquiries: totalInquiries?.cnt || 0,
      emailCampaignsSent: emailCampaignsSent?.cnt || 0,
      waCampaignsSent: waCampaignsSent?.cnt || 0,
      totalCampaigns: (emailCampaignsSent?.cnt || 0) + (waCampaignsSent?.cnt || 0),
      unreadNotifications: unreadNotifs?.cnt || 0,
      inquiryBreakdown: typeMap
    },
    recent: {
      inquiries: recentInquiries.results || [],
      emailCampaigns: recentEmailCampaigns.results || [],
      waCampaigns: recentWaCampaigns.results || []
    }
  }, 200, env);
}

export async function handleDashboard(request, env, pathname) {
  if (pathname === '/api/dashboard/stats' && request.method === 'GET') {
    return getDashboardStats(request, env);
  }
  return errorResponse('Dashboard route not found.', 404, env);
}
