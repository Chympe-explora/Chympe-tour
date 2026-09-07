/* ============================================================
   Shared dashboard logic — admin + guide.
   Each page includes this AFTER its own config.js (which sets
   window.DASH_API_BASE and window.DASH_ROLE) and after common.css.
   ============================================================ */
(function () {
  "use strict";

  const TOKEN_KEY = "dash_token_" + window.DASH_ROLE;
  const GUIDE_KEY = "dash_guide_cache";

  // ---------------- theme ----------------
  function initTheme() {
    const saved = localStorage.getItem("dash_theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("dash_theme", t);
    document.querySelectorAll("[data-theme-btn]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-theme-btn") === t));
  }
  initTheme();

  // ---------------- session ----------------
  function saveSession(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GUIDE_KEY);
  }
  function cacheGuide(g) {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(g || null));
  }
  function cachedGuide() {
    try {
      return JSON.parse(localStorage.getItem(GUIDE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function loginUrl() {
    return window.DASH_ROLE === "admin" ? "login.html" : "login.html";
  }

  // Call at the top of every protected page. Redirects to login if no
  // session. Returns nothing — just guards.
  function requireAuth() {
    if (!getToken()) {
      window.location.href = loginUrl();
      throw new Error("redirecting to login");
    }
  }

  // ---------------- API ----------------
  async function apiFetch(path, opts) {
    opts = opts || {};
    const headers = Object.assign({ "content-type": "application/json" }, opts.headers || {});
    const token = getToken();
    if (token) headers["authorization"] = "Bearer " + token;
    const res = await fetch(window.DASH_API_BASE + path, Object.assign({}, opts, { headers }));
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = { ok: false, error: "Bad response from server." };
    }
    if (res.status === 401) {
      clearSession();
      window.location.href = loginUrl();
      throw new Error("not authorized");
    }
    if (!data.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  // ---------------- shell (sidebar / topbar / bottom nav) ----------------
  const ADMIN_NAV = [
    { href: "index.html", icon: "🏠", label: "Dashboard" },
    { href: "bookings.html", icon: "📖", label: "Bookings" },
    { href: "guides.html", icon: "🧭", label: "Guides", badge: "pendingGuides" },
    { href: "content.html", icon: "📝", label: "Site Content" },
    { href: "media.html", icon: "🖼️", label: "Media" },
    { href: "payments.html", icon: "💳", label: "Payments" },
    { href: "era-ai.html", icon: "🤖", label: "ERA AI" },
    { href: "conversations.html", icon: "💬", label: "Conversations" },
    { href: "settings.html", icon: "⚙️", label: "Settings" },
  ];
  const GUIDE_NAV = [
    { href: "index.html", icon: "🏠", label: "Dashboard" },
    { href: "bookings.html", icon: "📖", label: "My Bookings" },
    { href: "services.html", icon: "🎒", label: "My Services" },
    { href: "account.html", icon: "👤", label: "My Account" },
  ];
  const BOTTOM_NAV_LIMIT = 5;

  function currentFile() {
    return location.pathname.split("/").pop() || "index.html";
  }

  // If a guide's account is still pending admin approval, every page
  // (except account.html, so they can still see/edit their own info)
  // should show the waiting screen instead of its normal content.
  async function checkGuidePendingGate() {
    if (window.DASH_ROLE !== "guide") return false;
    if (currentFile() === "pending.html") return false;
    try {
      const { guide } = await apiFetch("/api/guide/me");
      cacheGuide(guide);
      if (guide.status === "pending") {
        window.location.href = "pending.html";
        return true;
      }
    } catch {
      // apiFetch already redirects to login on 401
    }
    return false;
  }

  function renderShell(opts) {
    opts = opts || {};
    const role = window.DASH_ROLE;
    const nav = role === "admin" ? ADMIN_NAV : GUIDE_NAV;
    const active = currentFile();
    const brandTitle = role === "admin" ? "Chympe Explora" : "Guide Portal";
    const brandSub = role === "admin" ? "Admin Dashboard" : "Team Explo Era";

    const sidebarLinks = nav
      .map(
        (item) =>
          `<a class="nav-link${item.href === active ? " active" : ""}" href="${item.href}">
            <span>${item.icon}</span><span>${item.label}</span>
            ${item.badge ? `<span class="badge" id="badge-${item.badge}" style="display:none">0</span>` : ""}
          </a>`
      )
      .join("");

    const bottomLinks = nav
      .slice(0, BOTTOM_NAV_LIMIT)
      .map((item) => `<a class="${item.href === active ? "active" : ""}" href="${item.href}"><span>${item.icon}</span>${item.label}</a>`)
      .join("");

    document.body.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="shell">
        <div class="scrim" id="scrim"></div>
        <aside class="sidebar" id="sidebar">
          <div class="brand"><div class="dot"></div><div><b>${brandTitle}</b><span>${brandSub}</span></div></div>
          <nav>${sidebarLinks}</nav>
          <div class="divider"></div>
          <a class="nav-link" href="#" id="logoutLink"><span>🚪</span><span>Logout</span></a>
        </aside>
        <div class="content-wrap">
          <header class="topbar">
            <div class="hamburger" id="hamburger">☰</div>
            <h1>${opts.title || ""}</h1>
            <div class="theme-toggle">
              <button data-theme-btn="dark" onclick="DASH.setTheme('dark')">Dark</button>
              <button data-theme-btn="light" onclick="DASH.setTheme('light')">Light</button>
            </div>
          </header>
          <main class="page" id="pageRoot"></main>
          <div class="bottom-nav-spacer"></div>
        </div>
        <nav class="bottom-nav">${bottomLinks}</nav>
      </div>
    `
    );

    setTheme(localStorage.getItem("dash_theme") || "dark");

    const sidebar = document.getElementById("sidebar");
    const scrim = document.getElementById("scrim");
    document.getElementById("hamburger").addEventListener("click", () => {
      sidebar.classList.add("open");
      scrim.classList.add("show");
    });
    scrim.addEventListener("click", () => {
      sidebar.classList.remove("open");
      scrim.classList.remove("show");
    });
    document.getElementById("logoutLink").addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await apiFetch("/api/logout", { method: "POST" });
      } catch {}
      clearSession();
      window.location.href = loginUrl();
    });

    if (role === "admin") {
      apiFetch("/api/admin/guides/pending")
        .then((d) => {
          const n = (d.pending || []).length;
          const el = document.getElementById("badge-pendingGuides");
          if (el && n > 0) {
            el.style.display = "inline-block";
            el.textContent = n;
          }
        })
        .catch(() => {});
    }

    return document.getElementById("pageRoot");
  }

  // ---------------- small helpers ----------------
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function fmtMoney(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN");
  }
  function fmtDate(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  function pillClass(status) {
    return { confirmed: "confirmed", approved: "approved", pending: "pending", cancelled: "cancelled", rejected: "rejected" }[status] || "pending";
  }

  // Wires 6 boxes so typing auto-advances / backspace goes back, and
  // exposes .value to read the joined code.
  function setupOtpInputs(container) {
    const inputs = Array.from(container.querySelectorAll("input"));
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/[^0-9]/g, "").slice(0, 1);
        if (inp.value && inputs[i + 1]) inputs[i + 1].focus();
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && inputs[i - 1]) inputs[i - 1].focus();
      });
    });
    return { value: () => inputs.map((i) => i.value).join("") };
  }

  window.DASH = {
    saveSession,
    getToken,
    clearSession,
    cacheGuide,
    cachedGuide,
    requireAuth,
    apiFetch,
    renderShell,
    setTheme,
    escapeHtml,
    fmtMoney,
    fmtDate,
    pillClass,
    setupOtpInputs,
    checkGuidePendingGate,
  };
})();
