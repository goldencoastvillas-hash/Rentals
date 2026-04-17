import { applyI18nToDom, bindLangControls } from "./i18n.js?v=2026-04-16-2";

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

function applyConfigToUI() {
  const cfg = window.RENTALS_CONFIG || {};
  const airbnbLink = $("#airbnb-link");
  if (airbnbLink) {
    const url = (cfg.airbnbUrl || "").trim();
    airbnbLink.href = url || "#";
    airbnbLink.style.pointerEvents = url ? "auto" : "none";
    airbnbLink.style.opacity = url ? "1" : "0.55";
    airbnbLink.title = url ? "Ver en Airbnb" : "Configura AIRBNB_URL en el deploy";
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
  applyConfigToUI();
  showFileWarningIfNeeded();
  bindNav();
  applyI18nToDom();
  bindLangControls();

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Cache-bust para GitHub Pages (evita que el navegador use módulos viejos)
  const __v = "2026-04-16-2";
  import(`./admin-auth.js?v=${__v}`).then((m) => m.initAdminAuth()).catch(() => {});
  import(`./admin.js?v=${__v}`).then((m) => m.initAdmin()).catch(() => {});
  import(`./client.js?v=${__v}`).then((m) => m.initClient()).catch(() => {});

  window.addEventListener("hashchange", () => setActiveView(routeFromHash()));
  setActiveView(routeFromHash());
}

init();

