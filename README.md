# Exile Organization — Admin Panel
Separate static SPA (`noindex`). Talks only to `API_URL/api/admin/*` with an HttpOnly session cookie plus CSRF header.
- **Config:** `config.js` (`API_URL`, `PUBLIC_SITE_URL` for QR links).
- **Local:** `npx serve -s . -l 5174`; backend `CORS_ORIGINS` must include this origin. Serve on a separate (sub)domain, e.g. `admin.<your-domain>`; if different site from the API set `COOKIE_SAMESITE=None`.
- **First login:** create the SuperAdmin with the backend's `npm run create-admin`.
- **Screens:** Dashboard (totals, 30-day trend, by product/platform/version/country, recent downloads, system, admin activity) · Products · Apps · Releases · QR (view/copy/download PNG/regenerate) · Exile Log · Research · Journal · Portfolio (+projects) · Links · Media (URLs) · Site settings · Audit log · Account (password).
- **Feedback:** SAVE → SAVING... → SAVED ✓ / SAVE FAILED; deletes need a confirmation dialog then a toast.
- **Limitations:** plain forms (no rich-text editor); list screens show raw IDs (enter `product_id`/`application_id` manually); no file uploads.
