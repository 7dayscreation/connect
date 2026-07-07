# Connect CRM — Client Deployment Guide

Welcome! This guide explains how to deploy a fresh instance of **Connect CRM** (including the Admin Portal, Campaign Manager, and Email/WhatsApp Template Editors) for a new client. 

As a standalone, serverless application, the entire platform runs on **Cloudflare Workers**, **Cloudflare D1 (SQL Database)**, **Cloudflare KV (Fast Cache)**, and **Cloudflare R2 (Asset Storage)**.

---

## Prerequisites
Before you start, make sure you have:
1. A **Cloudflare Account** (with Turnstile and R2 enabled).
2. **Node.js** installed on your computer.
3. The **Wrangler CLI** authenticated on your terminal:
   ```bash
   npx wrangler login
   ```

---

## Step 1: Create Cloudflare Resources

Open your terminal, navigate to the `worker/` folder of this project, and run the following commands to spin up the required databases and storage namespaces on Cloudflare.

### 1. D1 SQL Database
Create the database for storing inquiries, campaigns, and templates:
```bash
npx wrangler d1 create connect-db
```
*Note down the generated **Database ID** (e.g., `2d98b0b1-d822-449e-ad4a-65e94f566120`).*

### 2. KV Namespace (Fast Cache)
Create the cache namespace for login sessions and OTP tokens:
```bash
npx wrangler kv namespace create connect-cache
```
*Note down the generated **KV Namespace ID** (e.g., `2599795f97994ed59510653a6b93eb03`).*

### 3. R2 Bucket (Asset Uploads)
Create the bucket for saving uploaded logos, campaign images, and video thumbnails:
```bash
npx wrangler r2 bucket create connect-assets
```

---

## Step 2: Configure Worker Bindings

Open [worker/wrangler.toml](file:///c:/xampp/htdocs/connect/worker/wrangler.toml) and [worker/wrangler-cron.toml](file:///c:/xampp/htdocs/connect/worker/wrangler-cron.toml) in your code editor and update the following values with the resource names and IDs you generated in Step 1.

### Updating `worker/wrangler.toml` (API Worker)
```toml
# Update the database_id with your D1 Database ID
[[d1_databases]]
binding = "DB"
database_name = "connect-db"
database_id = "YOUR_D1_DATABASE_ID"

# Update each 'id' field with your KV Namespace ID
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"

[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_KV_NAMESPACE_ID"

[[kv_namespaces]]
binding = "OTP_STORE"
id = "YOUR_KV_NAMESPACE_ID"

[[kv_namespaces]]
binding = "APP_CONFIG"
id = "YOUR_KV_NAMESPACE_ID"

# Update variables with client specific settings
[vars]
ADMIN_EMAIL = "client-admin@email.com"   # Whitelisted admin
CORS_ORIGIN = "https://client-domain.com" # Client website URL
APP_NAME = "Connect"                     # Client App Name
TURNSTILE_ENABLED = true                 # Enable Captcha (set to false to bypass)
```

### Updating `worker/wrangler-cron.toml` (Campaign Cron)
Copy the exact same D1 and KV bindings from `wrangler.toml` above into `wrangler-cron.toml` so both workers share the same database.

---

## Step 3: Run Database Schema Setup

Apply the default tables and seed metadata (which sets up sample inquiries, notifications, and whitelists your admin email) to the remote database:
```bash
npx wrangler d1 execute connect-db --remote --file=../schema/schema.sql
```

If you need to customize the default whitelist email or seed data, you can edit [schema/schema.sql](file:///c:/xampp/htdocs/connect/schema/schema.sql) before running the command.

---

## Step 4: Configure Variables & Secrets

To ensure secure logins and connect external marketing APIs, you must set secret keys on your deployed API worker.

### 1. Generate Session Token Secrets
Run these commands to set a secure random key for JWT and session signature:
```bash
# Generate a random string and upload it
openssl rand -base64 32 | npx wrangler secret put SESSION_SECRET --config wrangler.toml
openssl rand -base64 32 | npx wrangler secret put JWT_SECRET --config wrangler.toml
```

### 2. Add Third-Party API Keys
Configure the marketing campaign and captcha keys:
```bash
# Set your Resend.com API Key for email blasts
npx wrangler secret put RESEND_API_KEY --config wrangler.toml

# Set Cloudflare Turnstile keys (for bot protection)
npx wrangler secret put TURNSTILE_SECRET_KEY --config wrangler.toml
```
*You can also set/overwrite these keys inside the **Cloudflare Dashboard** under **Workers & Pages → connect-api → Settings → Variables**.*

---

## Step 5: Configure Frontend Settings

Open [js/config.js](file:///c:/xampp/htdocs/connect/js/config.js) in your text editor and fill in the client's public keys and Worker URL:
```javascript
const CONFIG = {
  APP_NAME: "Client Brand Name",
  API_BASE_URL: "https://connect-api.YOUR-SUBDOMAIN.workers.dev",
  TURNSTILE_SITE_KEY: "0x4AAAAAA...", // Cloudflare Turnstile Public Site Key
  VERSION: "1.0.0",
};
```

---

## Step 6: Deploy Workers

Deploy the API routing Worker and the campaign background cron Worker to Cloudflare:
```bash
# Deploy main API
npx wrangler deploy --config wrangler.toml

# Deploy Cron trigger (schedules campaign sweeps)
npx wrangler deploy --config wrangler-cron.toml
```
Once deployed, Cloudflare will output your live API URL (e.g., `https://connect-api.yourname.workers.dev`). Make sure this URL matches what you typed in `js/config.js` in Step 5!

---

## Step 7: Local Development (Offline Editing)

To test changes locally before pushing to production:
1. Run the local backend simulation:
   ```bash
   npx wrangler dev --config wrangler.toml
   ```
   *This starts the API server locally at `http://localhost:8787`.*
2. Start a local frontend web server in the root project folder (for example, using XAMPP or VS Code Live Server) to open the HTML files in your browser.
3. Edit `js/config.js` to point to `http://localhost:8787`.
