import { normalizePhotoUrls } from "./url-media.js";
import { t } from "./i18n.js?v=2026-04-24-2";

function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function mountGallery(urls) {
  const safe = normalizePhotoUrls(urls || []);
  const root = document.createElement("div");
  root.className = "gallery";

  if (!safe.length) {
    root.innerHTML = `<div style="height:240px; display:flex; align-items:center; justify-content:center" class="muted">${escAttr(t("gallery.noPhotos"))}</div>`;
    return root;
  }

  const track = document.createElement("div");
  track.className = "gallery-track";
  root.appendChild(track);

  safe.forEach((u) => {
    const slide = document.createElement("div");
    slide.className = "gallery-slide";
    const src = escAttr(u);
    slide.innerHTML = `<img alt="" src="${src}" loading="lazy" referrerpolicy="no-referrer" />`;
    track.appendChild(slide);
  });

  const nav = document.createElement("div");
  nav.className = "gallery-nav";
  nav.innerHTML = `
    <button type="button" class="gallery-nav-btn" aria-label="${escAttr(t("gallery.prevAria"))}">‹</button>
    <button type="button" class="gallery-nav-btn" aria-label="${escAttr(t("gallery.nextAria"))}">›</button>
  `;
  root.appendChild(nav);

  const dots = document.createElement("div");
  dots.className = "gallery-dots";
  root.appendChild(dots);

  let idx = 0;
  function setIndex(i) {
    idx = Math.max(0, Math.min(safe.length - 1, i));
    track.style.transform = `translateX(${-idx * 100}%)`;
    Array.from(dots.children).forEach((d, j) => d.classList.toggle("is-active", j === idx));
  }

  safe.forEach((_u, i) => {
    const dot = document.createElement("div");
    dot.className = "gallery-dot" + (i === 0 ? " is-active" : "");
    dot.addEventListener("click", () => setIndex(i));
    dots.appendChild(dot);
  });

  nav.querySelectorAll("button")[0]?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(idx - 1);
  });
  nav.querySelectorAll("button")[1]?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(idx + 1);
  });

  // Swipe (mouse/touch) con pointer events
  let startX = 0;
  let dragging = false;
  let startIdx = 0;

  root.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".gallery-nav-btn")) return;
    dragging = true;
    startX = e.clientX;
    startIdx = idx;
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener("pointerup", () => (dragging = false));
  root.addEventListener("pointercancel", () => (dragging = false));
  root.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) < 40) return;
    dragging = false;
    if (dx < 0) setIndex(startIdx + 1);
    else setIndex(startIdx - 1);
  });

  setIndex(0);
  return root;
}

