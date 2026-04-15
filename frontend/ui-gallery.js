export function mountGallery(urls) {
  const safe = (urls || []).filter(Boolean);
  const root = document.createElement("div");
  root.className = "gallery";

  if (!safe.length) {
    root.innerHTML = `<div style="height:240px; display:flex; align-items:center; justify-content:center" class="muted">Sin fotos</div>`;
    return root;
  }

  const track = document.createElement("div");
  track.className = "gallery-track";
  root.appendChild(track);

  safe.forEach((u) => {
    const slide = document.createElement("div");
    slide.className = "gallery-slide";
    slide.innerHTML = `<img alt="" src="${u}" loading="lazy" />`;
    track.appendChild(slide);
  });

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

  // Swipe (mouse/touch) con pointer events
  let startX = 0;
  let dragging = false;
  let startIdx = 0;

  root.addEventListener("pointerdown", (e) => {
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

