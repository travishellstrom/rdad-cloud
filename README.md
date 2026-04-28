# rdad-cloud — RDAD Foundation (Cloudflare Stack)

> Cloudflare Pages + D1 + Workers proof-of-concept for cloud.rdad.org  
> Compare with: https://new.rdad.org

## Stack

| Layer | Tool | Cost |
|-------|------|------|
| Hosting | Cloudflare Pages (git push = auto deploy) | Free |
| API | Cloudflare Pages Functions (`/functions/api/`) | Free (100k req/day) |
| Database | Cloudflare D1 (SQLite at edge) | Free (5M rows/day) |
| Email | Resend (transactional) | Free (3k/mo) |
| Auth | X-Admin-Token header (localStorage) | Free |

**Total: $0/month**

## Setup

### 1. Install Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 2. Create D1 Database
```bash
wrangler d1 create rdad_cloud_db
```
Paste the `database_id` from the output into `wrangler.toml`.

### 3. Run Migration
```bash
wrangler d1 execute rdad_cloud_db --file=./migrations/001_init.sql
```

### 4. Deploy to Cloudflare Pages
1. Push this repo to GitHub: `gh repo create rdad-cloud --public && git push -u origin main`
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git
3. Select `rdad-cloud` repo
4. Build settings: Framework = None, Build command = (blank), Output = `/`
5. Save and deploy

### 5. Set Secrets (in Cloudflare Dashboard)
In Pages → Settings → Environment Variables → Add secrets:
- `RESEND_API_KEY` = re_5Z8MzHW9_Dgo45uBr35mfg4wpVBoXUa6h
- `ADMIN_TOKEN` = (set a strong password for the admin panel)

### 6. Custom Domain
1. Pages → Custom Domains → Add domain: `cloud.rdad.org`
2. DNS is already on Cloudflare — it'll add the CNAME automatically
3. SSL certificate provisions automatically (1-2 min)

### 7. Copy Images from new.rdad.org
```bash
cd /opt/rdad-cloud
scp /var/www/new.rdad.org/hero-bg.jpg .
scp /var/www/new.rdad.org/hero-bg-mobile.jpg .
scp /var/www/new.rdad.org/runnin-down-a-dream-cover.jpg .
scp /var/www/new.rdad.org/bill-speaking.jpg .
git add *.jpg && git commit -m "add images" && git push
```

## File Structure

```
/
  index.html              # Main site (assessment modal → POST /api/assessment)
  admin.html              # Admin panel — view/manage submissions
  apply.html              # Apply info page
  _headers                # Security headers
  wrangler.toml           # Cloudflare bindings
  functions/
    api/
      assessment.js       # POST: save to D1 + Resend emails
      submissions.js      # GET (admin): list all submissions
      submissions/
        [id].js           # PATCH (status/notes) + DELETE (admin)
  migrations/
    001_init.sql          # D1 schema
```

## Admin Panel
URL: https://cloud.rdad.org/admin.html  
Login: enter the `ADMIN_TOKEN` secret you set in Cloudflare dashboard  
Features: view all submissions, change status (pending/invited/rejected), add notes, delete

## vs. new.rdad.org (the comparison)

| | new.rdad.org | cloud.rdad.org |
|---|---|---|
| Hosting | nginx on $18/mo VPS | Cloudflare Pages (free) |
| Deploy | SSH + systemctl | git push |
| Database | JSON files | D1 SQLite (edge) |
| API | Flask/Python | Workers (JS at edge) |
| SSL | Certbot | Cloudflare (automatic) |
| CDN | Cloudflare proxy | Cloudflare native |
| Admin auth | None (direct file access) | X-Admin-Token |
| Server maintenance | Yes (updates, restarts) | None |
