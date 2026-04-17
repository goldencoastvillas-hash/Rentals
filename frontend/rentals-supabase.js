/**
 * Cliente Supabase (DB + Storage + RPC) sin bundler.
 * Requiere:
 * - `<script src="https://unpkg.com/@supabase/supabase-js@2"></script>`
 * - `window.RENTALS_CONFIG = { supabaseUrl, supabaseAnonKey, adminWhatsappDigits, airbnbUrl }`
 *
 * Nota:
 * - En modo "sin Supabase Auth": el admin se valida vía RPC `web_admin_login`
 *   y la sesión admin se guarda en localStorage (frontend).
 */

function cfg() {
  return window.RENTALS_CONFIG || {};
}

export function isConfigured() {
  const c = cfg();
  return !!(c.supabaseUrl && c.supabaseAnonKey);
}

let __client = null;

export function getClient() {
  if (__client) return __client;
  if (!isConfigured()) throw new Error("Supabase no configurado");
  if (!window.supabase || !window.supabase.createClient) throw new Error("Falta cargar supabase-js");
  const c = cfg();
  __client = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return __client;
}

async function fetchJson(url, options) {
  const r = await fetch(url, options);
  const t = await r.text();
  let j = null;
  try {
    j = t ? JSON.parse(t) : null;
  } catch (_e) {
    j = null;
  }
  if (!r.ok) {
    const msg = (j && (j.message || j.error_description || j.hint || j.error)) || t || r.statusText;
    throw new Error((r.status ? r.status + " — " : "") + String(msg || "Error"));
  }
  return j;
}

function baseUrl() {
  const u = cfg().supabaseUrl || "";
  return u.replace(/\/$/, "");
}

function anonHeaders() {
  const k = cfg().supabaseAnonKey || "";
  return {
    apikey: k,
    Authorization: "Bearer " + k,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function rpcAdminLogin(params) {
  if (!isConfigured()) throw new Error("Supabase no configurado");
  const b = baseUrl();
  return fetchJson(b + "/rest/v1/rpc/web_admin_login", {
    method: "POST",
    headers: anonHeaders(),
    body: JSON.stringify(params || {}),
  });
}

export function adminWhatsappDigits() {
  return String((cfg().adminWhatsappDigits || "573026661995").replace(/\D/g, "") || "573026661995");
}

