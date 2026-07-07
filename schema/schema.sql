-- ============================================================
-- Connect CRM & Campaign Portal Database Schema
-- ============================================================

-- Drop tables if they exist
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS whatsapp_campaigns;
DROP TABLE IF EXISTS email_campaigns;
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS subscribers;
DROP TABLE IF EXISTS campaign_logs;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS imports;
DROP TABLE IF EXISTS activity_logs;

-- ============================================================
-- Admin Users (Whitelist for OTP login)
-- ============================================================
CREATE TABLE admin_users (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL DEFAULT 'Admin',
  role        TEXT NOT NULL DEFAULT 'admin',
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO admin_users (email, name, role) VALUES ('info@7dayscreation.com', '7 Days Creation', 'superadmin');

-- ============================================================
-- Users (For password-based authentication if needed)
-- ============================================================
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'admin',
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pre-seed admin user with ID 'admin-001' as requested
INSERT INTO users (id, email, name, role, is_active) VALUES ('admin-001', 'info@7dayscreation.com', '7 Days Creation Admin', 'admin', 1);

-- ============================================================
-- Sessions (For session tokens)
-- ============================================================
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Contacts & Subscribers
-- ============================================================
CREATE TABLE contacts (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE,
  phone       TEXT,
  segment     TEXT DEFAULT 'General',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE subscribers (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email       TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'Subscribed', -- Subscribed, Unsubscribed
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Inquiries (Sales Leads — Used by worker endpoints)
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
  open_rate   TEXT DEFAULT '0.0%',
  click_rate  TEXT DEFAULT '0.0%',
  sent_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO email_campaigns (name, subject, audience, status, open_rate, click_rate, sent_at) VALUES
  ('Summer Solstice Special', 'Exclusive 10% Off Signature Tower Bookings', 'All', 'Sent', '28.4%', '5.1%', datetime('now', '-8 days')),
  ('Weekly Project Digest',   'New property listings in Bodakdev',          'General', 'Sent', '22.1%', '3.9%', datetime('now', '-6 days'));

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
  delivered_rate TEXT DEFAULT '0.0%',
  read_rate      TEXT DEFAULT '0.0%',
  sent_at        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO whatsapp_campaigns (name, template_name, audience, status, delivered_rate, read_rate, sent_at) VALUES
  ('VIP Project Launch Invite',        'VIP Launch',  'Regular Customer',  'Sent', '99.4%', '89.2%', datetime('now', '-10 days')),
  ('Site Visit Confirmation Request',  'Site Visit',  'Walking Inquiry', 'Sent', '98.7%', '84.5%', datetime('now', '-7 days'));

-- ============================================================
-- Campaign Logs
-- ============================================================
CREATE TABLE campaign_logs (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  campaign_id   TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- Email, WhatsApp
  recipient     TEXT NOT NULL,
  status        TEXT NOT NULL, -- Delivered, Failed
  error         TEXT,
  sent_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Email Templates
-- ============================================================
CREATE TABLE email_templates (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  subject     TEXT,
  body_html   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

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

-- ============================================================
-- Settings (Configuration key-value pairs)
-- ============================================================
CREATE TABLE settings (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  key         TEXT NOT NULL UNIQUE,
  value       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Imports (Logging csv/data imports)
-- ============================================================
CREATE TABLE imports (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  filename      TEXT NOT NULL,
  status        TEXT NOT NULL, -- Completed, Failed
  records_count INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Activity Logs
-- ============================================================
CREATE TABLE activity_logs (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id     TEXT,
  action      TEXT NOT NULL,
  details     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
