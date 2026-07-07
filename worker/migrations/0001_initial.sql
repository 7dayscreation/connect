-- ============================================================
-- 7 Days Creation Communication Portal — D1 Schema
-- Database: 7dc-comm-db
-- Migration: 0001_initial
-- ============================================================

-- Drop tables if exist (for idempotency)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS whatsapp_campaigns;
DROP TABLE IF EXISTS email_campaigns;
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS admin_users;

-- ============================================================
-- Admin Users (whitelist)
-- ============================================================
CREATE TABLE admin_users (
  id       TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email    TEXT NOT NULL UNIQUE,
  name     TEXT NOT NULL DEFAULT 'Admin',
  role     TEXT NOT NULL DEFAULT 'admin',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pre-seed the admin
INSERT INTO admin_users (email, name, role) VALUES ('info@7dayscreation.com', '7 Days Creation', 'superadmin');

-- ============================================================
-- Inquiries (Sales Leads)
-- ============================================================
CREATE TABLE inquiries (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  first_name   TEXT NOT NULL,
  surname      TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,
  inquiry_type TEXT NOT NULL DEFAULT 'General',
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed sample inquiries
INSERT INTO inquiries (first_name, surname, phone, email, inquiry_type) VALUES
  ('Rahul',  'Mehta',  '9825012345', 'rahul.mehta@example.com',  'Walking Inquiry'),
  ('Sneha',  'Patel',  '9012345678', 'sneha.patel@example.com',  'General'),
  ('Vikram', 'Shah',   '8980123456', 'vikram.shah@example.com',  'Architect Reference'),
  ('Neha',   'Sharma', '7676767676', 'neha.sharma@example.com',  'Regular Customer');

-- ============================================================
-- Email Campaigns
-- ============================================================
CREATE TABLE email_campaigns (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  audience    TEXT NOT NULL DEFAULT 'All',
  status      TEXT NOT NULL DEFAULT 'Draft',
  body_html   TEXT,
  open_rate   TEXT DEFAULT '—',
  click_rate  TEXT DEFAULT '—',
  sent_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO email_campaigns (name, subject, audience, status, open_rate, click_rate, sent_at) VALUES
  ('Summer Solstice Special', 'Exclusive 10% Off Signature Tower Bookings', 'All', 'Sent', '28.4%', '5.1%', datetime('now', '-8 days')),
  ('Weekly Project Digest',   'New property listings in Bodakdev',          'General', 'Sent', '22.1%', '3.9%', datetime('now', '-6 days')),
  ('Followup: Walkin leads',  'Thank you for visiting Creation Residency',  'Walking Inquiry', 'Scheduled', '—', '—', NULL);

-- ============================================================
-- WhatsApp Campaigns
-- ============================================================
CREATE TABLE whatsapp_campaigns (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name           TEXT NOT NULL,
  template_name  TEXT NOT NULL DEFAULT 'Custom Message',
  audience       TEXT NOT NULL DEFAULT 'All',
  status         TEXT NOT NULL DEFAULT 'Draft',
  message        TEXT,
  media_type     TEXT DEFAULT 'none',
  media_url      TEXT,
  delivered_rate TEXT DEFAULT '—',
  read_rate      TEXT DEFAULT '—',
  sent_at        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO whatsapp_campaigns (name, template_name, audience, status, delivered_rate, read_rate, sent_at) VALUES
  ('VIP Project Launch Invite',        'VIP Launch',  'Regular Customer',  'Sent', '99.4%', '89.2%', datetime('now', '-10 days')),
  ('Site Visit Confirmation Request',  'Site Visit',  'Walking Inquiry', 'Sent', '98.7%', '84.5%', datetime('now', '-7 days'));

-- ============================================================
-- Notifications (Activity Feed)
-- ============================================================
CREATE TABLE notifications (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type        TEXT NOT NULL DEFAULT 'System',
  icon        TEXT NOT NULL DEFAULT 'fa-bell',
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO notifications (type, icon, title, description, is_read) VALUES
  ('System',    'fa-key',       'Backend Connected',         'Cloudflare Workers D1 database connected successfully.', 0),
  ('Inquiries', 'fa-user-plus', 'New Sales Inquiry Received','Rahul Mehta submitted a Walking Inquiry.', 1),
  ('Campaigns', 'fa-envelope',  'Email Campaign Blasted',    'Campaign Weekly Project Digest sent successfully via Resend API.', 1);
