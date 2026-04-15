/**
 * Configuración pública del sitio (clave anon de Supabase, no la service role).
 *
 * En GitHub Pages: el workflow sobrescribe este archivo al desplegar desde
 * Repository secrets (SUPABASE_URL, SUPABASE_ANON_KEY, …).
 *
 * En local: rellena URL, anon key y opcional adminSyncSecret (mismo valor que en SQL 005).
 */
window.RENTALS_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  adminWhatsappDigits: "573508321565",
  adminSyncSecret: "",
  airbnbUrl: "",
};
