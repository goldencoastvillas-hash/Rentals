import { applyI18nToDom, bindLangControls } from "./i18n.js?v=2026-04-16-8";
import { ASSET_V } from "./asset-version.js?v=2026-04-16-8";

function $(sel) {
  return document.querySelector(sel);
}

function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function viewIdFromRoute(route) {
  return "view-" + route;
}

function setActiveView(route) {
  const id = viewIdFromRoute(route);
  const views = $all(".view");
  const exists = views.some((v) => v.id === id);
  const finalId = exists ? id : "view-home";

  views.forEach((v) => v.classList.toggle("is-active", v.id === finalId));
  document.documentElement.dataset.route = finalId.replace(/^view-/, "");
}

function routeFromHash() {
  const h = (location.hash || "").replace(/^#/, "");
  return h || "home";
}

function go(route) {
  if (!route) return;
  if (routeFromHash() === route) {
    setActiveView(route);
    return;
  }
  location.hash = route;
}

window.RentalsApp = {
  go,
  current: () => routeFromHash(),
};

/** Misma URL que en index.html / rentals-config; sirve si el deploy deja airbnbUrl vacío. */
const DEFAULT_AIRBNB_HREF = "https://airbnb.com.co/h/goldencoastvillas";

function applyConfigToUI() {
  const cfg = window.RENTALS_CONFIG || {};
  const airbnbLink = $("#airbnb-link");
  if (airbnbLink) {
    const fromCfg = (cfg.airbnbUrl || "").trim();
    const url = fromCfg || DEFAULT_AIRBNB_HREF;
    airbnbLink.href = url;
    airbnbLink.style.pointerEvents = "auto";
    airbnbLink.style.opacity = "1";
    airbnbLink.title = "Airbnb — Golden Coast Villas";
  }
}

function showFileWarningIfNeeded() {
  const el = $("#file-protocol-warning");
  if (!el) return;
  const isFile = location.protocol === "file:";
  el.classList.toggle("is-visible", isFile);
}

function bindNav() {
  document.body.addEventListener("click", (e) => {
    const t = e.target.closest("[data-nav]");
    if (!t) return;
    e.preventDefault();
    go(t.dataset.nav);
  });
}

function init() {
  showFileWarningIfNeeded();
  bindNav();
  applyI18nToDom();
  bindLangControls();
  applyConfigToUI();

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Cache-bust para GitHub Pages (evita que el navegador use módulos viejos)
  const __v = ASSET_V;
  import(`./admin-auth.js?v=${__v}`).then((m) => m.initAdminAuth()).catch(() => {});
  import(`./admin.js?v=${__v}`).then((m) => m.initAdmin()).catch(() => {});
  import(`./client.js?v=${__v}`).then((m) => m.initClient()).catch(() => {});

  window.addEventListener("hashchange", () => setActiveView(routeFromHash()));
  setActiveView(routeFromHash());

  window.addEventListener("rentals-lang-change", () => applyConfigToUI());
}

init();

