import { isConfigured, rpcAdminLogin } from "./rentals-supabase.js";
import { t } from "./i18n.js?v=2026-04-24-2";

function $(sel) {
  return document.querySelector(sel);
}

function showError(msg) {
  const el = $("#login-error");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.toggle("is-visible", !!msg);
}

export function initAdminAuth() {
  const form = $("#admin-form");
  if (!form) return;

  $("#admin-pass-toggle")?.addEventListener("click", () => {
    const inp = $("#admin-pass");
    if (!inp) return;
    const isPass = inp.type === "password";
    inp.type = isPass ? "text" : "password";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const user = ($("#admin-user")?.value || "").trim();
    const email = ($("#admin-email")?.value || "").trim();
    const pass = String($("#admin-pass")?.value || "").trim();

    if (!user || !email || !pass) {
      showError(t("login.err.fill"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(t("login.err.email"));
      return;
    }
    if (!isConfigured()) {
      showError(t("login.err.cfg"));
      return;
    }

    try {
      const resp = await rpcAdminLogin({ p_username: user, p_email: email, p_password: pass });
      if (!resp || resp.ok !== true) {
        showError(resp?.error === "missing_fields" ? t("login.err.fill") : t("login.err.bad"));
        return;
      }

      localStorage.setItem("rentals_admin_session", JSON.stringify({ ok: true, username: user, email, ts: Date.now() }));

      if (window.RentalsApp?.go) window.RentalsApp.go("admin");
    } catch (err) {
      const msg = (err && (err.message || err.error_description)) || t("login.err.generic");
      if (String(msg || "").toLowerCase().includes("web_admin_login")) {
        showError(t("login.err.rpc"));
      } else {
        showError(msg);
      }
    }
  });
}

