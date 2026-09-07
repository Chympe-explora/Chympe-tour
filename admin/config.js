/* ============================================================
   ✏️ ADMIN DASHBOARD CONFIG — EDIT THIS FILE
   ============================================================
   Only one thing to set: the URL of your deployed Cloudflare
   Worker (same backend the main site's booking form talks to).

   Find it by running `npx wrangler deploy` in the backend project
   — it prints something like:
       https://chympe-booking-backend.YOURNAME.workers.dev
   Paste that below, with NO trailing slash.
   ============================================================ */
window.DASH_API_BASE = "https://chympe-booking-backend1.senlysuchiang87.workers.dev";
window.DASH_ROLE = "admin";
