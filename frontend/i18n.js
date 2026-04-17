import { STRINGS } from "./i18n-strings.js?v=2026-04-16-4";
import { NOSOTROS_HTML } from "./i18n-nosotros.js?v=2026-04-16-4";

const STORAGE_KEY = "rentals_lang";

export function getLang() {
  const v = String(localStorage.getItem(STORAGE_KEY) || "es").toLowerCase();
  return v === "en" ? "en" : "es";
}

export function setLang(lang) {
  const next = lang === "en" ? "en" : "es";
  localStorage.setItem(STORAGE_KEY, next);
  applyI18nToDom();
  window.dispatchEvent(new CustomEvent("rentals-lang-change", { detail: { lang: next } }));
}

export function t(key, vars) {
  const lang = getLang();
  let s = STRINGS[lang]?.[key] ?? STRINGS.es[key] ?? key;
  if (vars && typeof vars === "object") {
    Object.keys(vars).forEach((k) => {
      s = s.split(`{{${k}}}`).join(String(vars[k]));
    });
  }
  return s;
}

export function tEstado(estado) {
  const k = `estado.${String(estado || "").toLowerCase()}`;
  const v = t(k);
  return v === k ? String(estado || "") : v;
}

export function tTipo(tipo) {
  const k = `tipo.${String(tipo || "").toLowerCase()}`;
  const v = t(k);
  return v === k ? String(tipo || "") : v;
}

/** Traduce `tipo_inmueble` de la BD (casa / apartamento / cabaña). */
export function tInmueble(tipo) {
  const raw = String(tipo || "").trim().toLowerCase();
  if (!raw) return "";
  const k = `inmueble.${raw}`;
  const v = t(k);
  return v === k ? String(tipo || "").trim() : v;
}

function applyEl(el) {
  const key = el.getAttribute("data-i18n");
  if (!key) return;
  const val = t(key);
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    if (el.hasAttribute("placeholder")) el.setAttribute("placeholder", val);
    else el.value = val;
  } else if (tag === "OPTION") {
    el.textContent = val;
  } else {
    el.textContent = val;
  }
}

export function applyI18nToDom() {
  const lang = getLang();
  const sel = document.getElementById("lang-select");
  if (sel) {
    sel.value = lang;
    sel.title = t("lang.label");
  }

  const fw = document.getElementById("file-protocol-warning");
  if (fw) fw.innerHTML = t("fileWarn.html");

  document.querySelectorAll("[data-i18n]").forEach(applyEl);

  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const k = el.getAttribute("data-i18n-aria-label");
    if (k) el.setAttribute("aria-label", t(k));
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    el.innerHTML = t(key);
  });

  const mount = document.getElementById("nosotros-mount");
  if (mount) {
    mount.innerHTML = NOSOTROS_HTML[lang] || NOSOTROS_HTML.es;
    const y = String(new Date().getFullYear());
    mount.querySelectorAll(".year-nosotros").forEach((n) => {
      n.textContent = y;
    });
  }

  const demo = document.getElementById("admin-login-demo");
  if (demo) demo.innerHTML = t("adminLogin.demo");
}

export function bindLangControls() {
  const sel = document.getElementById("lang-select");
  if (!sel || sel.dataset.bound === "1") return;
  sel.dataset.bound = "1";
  sel.addEventListener("change", () => {
    setLang(sel.value);
  });
}
