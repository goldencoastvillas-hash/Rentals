/**
 * Copia este archivo a rentals-config.js y rellena las claves.
 * En Supabase: Settings → API → Project URL y anon (public) key.
 *
 * WhatsApp del administrador: solo dígitos con código de país, sin + ni espacios.
 * Ejemplo Colombia +57 350 8321565 → 573508321565
 */
window.RENTALS_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  // En Supabase → Settings → API: anon (public) JWT eyJ... o clave publicable del proyecto
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  // Solo dígitos, sin + ni espacios (ej. +57 350 8321565)
  adminWhatsappDigits: "573508321565",
  // Mismo texto que v_expected en backend/sql/005_admin_list_reservas.sql (tras cambiarlo allí)
  adminSyncSecret: "GCV-ADMIN-SYNC-KEY-CHANGEME",
};
