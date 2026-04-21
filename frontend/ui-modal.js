function $(sel) {
  return document.querySelector(sel);
}

export function openModal(html) {
  const modal = $("#modal");
  const body = $("#modal-body");
  if (!modal || !body) return;
  body.innerHTML = html || "";
  document.body.classList.add("modal-open");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

export function closeModal() {
  const modal = $("#modal");
  const body = $("#modal-body");
  if (!modal || !body) return;
  body.innerHTML = "";
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

export function initModal() {
  const modal = $("#modal");
  if (!modal) return;
  modal.addEventListener("click", (e) => {
    const c = e.target.closest("[data-close]");
    if (c) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openCal = document.querySelector(".home-cal-pop.is-open");
    if (openCal) {
      openCal.classList.remove("is-open");
      openCal.setAttribute("aria-hidden", "true");
      const btn = openCal._rangeCalBtnOpen;
      if (btn) btn.setAttribute("aria-expanded", "false");
      return;
    }
    if (modal.classList.contains("is-open")) closeModal();
  });
}

