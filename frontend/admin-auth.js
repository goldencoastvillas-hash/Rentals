import { isConfigured, rpcAdminLogin } from "./rentals-supabase.js";

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const user = ($("#admin-user")?.value || "").trim();
    const email = ($("#admin-email")?.value || "").trim();
    const pass = String($("#admin-pass")?.value || "").trim();

    if (!user || !email || !pass) {
      showError("Completa usuario, correo y contraseña.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("El correo no tiene un formato válido.");
      return;
    }
    if (!isConfigured()) {
      showError("Configura SUPABASE_URL y SUPABASE_ANON_KEY para habilitar el login.");
      return;
    }

    try {
      const resp = await rpcAdminLogin({ p_username: user, p_email: email, p_password: pass });
      if (!resp || resp.ok !== true) {
        showError("Credenciales incorrectas.");
        return;
      }

      localStorage.setItem("rentals_admin_session", JSON.stringify({ ok: true, username: user, email, ts: Date.now() }));

      if (window.RentalsApp?.go) window.RentalsApp.go("admin");
    } catch (err) {
      const msg = (err && (err.message || err.error_description)) || "No se pudo iniciar sesión.";
      showError(msg);
    }
  });
}

