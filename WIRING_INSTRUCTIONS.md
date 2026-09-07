# Wiring the dashboards into your site

## 1. Where these files go
Drop the `admin/`, `guide/`, and `dashboard-assets/` folders into the
ROOT of each of your 3 site copies in `team-eplo-era-site-main`
(root, `krem-chympe/`, `wilderness-expedition/`) — or, simpler, put
them ONLY at the root of whichever one is your actual GitHub Pages
publish root, and link to it with an absolute path (e.g.
`https://yoursite.com/guide/login.html`) from the other two. Either
works; one copy is less to keep in sync.

## 2. Admin dashboard — deliberately NOT in the nav
Per your request this is a "secret" dashboard. Nothing links to it
anywhere on the public site. You (and whoever you give the sign-up
code to) get to it by typing the URL directly:

    https://yoursite.com/admin/login.html

Bookmark it. If you want an extra layer of obscurity, you can rename
the `admin/` folder to something non-obvious (e.g. `/ctrl-panel-9f2/`)
— just remember to update `DASH_ROLE`/paths stay the same either way.

## 3. Guide dashboard — add this link to your site's nav
Add one line to your main site's navigation (wherever the nav `<ul>`
or `<nav>` markup lives in your `index.html`):

```html
<a href="/guide/login.html" class="nav-link">Guide Login</a>
```

Adjust the class to match whatever your existing nav links use for
styling — this is just a plain link, it doesn't need any JS.

## 4. Set your Worker URL
Edit ONE line in both `admin/config.js` and `guide/config.js`:

```js
window.DASH_API_BASE = "https://YOUR-WORKER-SUBDOMAIN.workers.dev";
```

Use the URL `wrangler deploy` printed when you deployed the backend.

## 5. Backend secrets (see SETUP_INSTRUCTIONS.md for the full list)
At minimum, before anyone can use the dashboards:

```
wrangler secret put ADMIN_PASSWORD        # legacy master password (still works)
wrangler secret put ADMIN_SIGNUP_CODE     # required for the admin "Sign Up" tab to work
```

OTP delivery works out of the box via your Telegram bot (codes get
posted to TELEGRAM_ADMIN_CHAT_ID) until you add real SMS/email:

```
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_FROM_NUMBER
wrangler secret put RESEND_API_KEY
wrangler secret put RESEND_FROM_EMAIL
```
