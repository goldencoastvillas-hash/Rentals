import { getClient, adminWhatsappDigits } from "./rentals-supabase.js";
import { initModal, openModal } from "./ui-modal.js";
import { mountGallery } from "./ui-gallery.js";
import { normalizePhotoUrl, normalizePhotoUrls } from "./url-media.js";
import { t, tInmueble } from "./i18n.js?v=2026-04-16-4";

function $(sel) {
  return document.querySelector(sel);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firstPhoto(row) {
  const u = Array.isArray(row?.fotos_urls) ? row.fotos_urls.find(Boolean) : "";
  return normalizePhotoUrl(u);
}

async function fetchCasas() {
  const client = getClient();
  const { data, error } = await client.from("casas").select("*").order("creado_en", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchCarros() {
  const client = getClient();
  const { data, error } = await client.from("carros").select("*").order("creado_en", { ascending: false });
  if (error) throw error;
  return data || [];
}

function renderCasaCard(row) {
  const img = firstPhoto(row);
  const precio = `$${Number(row.precio_noche || 0).toLocaleString()}${t("featured.perNight")}`;
  const meta = `${tInmueble(row.tipo_inmueble)} · ${row.habitaciones ?? 0} ${t("common.hab")} · ${row.banos ?? 0} ${t("common.baths")}`;
  const amen = [];
  if (row.wifi) amen.push(t("amenity.wifi"));
  if (row.parking) amen.push(t("amenity.parking"));
  if (row.piscina) amen.push(t("amenity.pool"));
  if (row.aire) amen.push(t("amenity.ac"));
  if (row.gym) amen.push(t("amenity.gym"));
  if (row.mascotas) amen.push(t("amenity.pets"));
  if (row.lavanderia) amen.push(t("amenity.laundry"));
  if (row.bbq) amen.push(t("amenity.bbq"));
  const el = document.createElement("div");
  el.className = "item-card";
  el.innerHTML = `
    <img class="thumb" alt="" referrerpolicy="no-referrer" src="${escapeHtml(img)}" onerror="this.style.display='none'" />
    <div class="item-meta">
      <h3>${escapeHtml(row.nombre || t("detail.casaFallback"))}</h3>
      <div class="muted">${escapeHtml(meta)}</div>
      ${amen.length ? `<div class="amenities">${amen.slice(0, 5).map((x) => `<span class="amenity">${escapeHtml(x)}</span>`).join("")}</div>` : ""}
      <div class="price-row">
        <div class="price">${escapeHtml(precio)}</div>
        <span class="pill">${Array.isArray(row.fotos_urls) ? row.fotos_urls.length : 0} ${t("featured.photos")}</span>
      </div>
    </div>
  `;
  el.addEventListener("click", () => openCasaDetail(row));
  return el;
}

function renderCarroCard(row) {
  const img = firstPhoto(row);
  const precio = `$${Number(row.precio_dia || 0).toLocaleString()}${t("featured.perDay")}`;
  const meta = `${row.tipo || ""} · ${row.puestos ?? 0} ${t("common.seats")} · ${row.cilindraje || ""}`;
  const el = document.createElement("div");
  el.className = "card";
  el.style.cursor = "pointer";
  el.innerHTML = `
    <div style="height:220px; background: var(--surface2); overflow:hidden">
      <img alt="" referrerpolicy="no-referrer" src="${escapeHtml(img)}" style="width:100%; height:220px; object-fit:cover; display:block" onerror="this.style.display='none'" />
    </div>
    <div class="card-inner">
      <h3>${escapeHtml(row.marca || t("detail.carroFallback"))}</h3>
      <div class="muted" style="margin-bottom:0.35rem">${escapeHtml(meta)}</div>
      <div class="price-row">
        <div class="price">${escapeHtml(precio)}</div>
        <span class="pill">${Array.isArray(row.fotos_urls) ? row.fotos_urls.length : 0} ${t("featured.photos")}</span>
      </div>
    </div>
  `;
  el.addEventListener("click", () => openCarroDetail(row));
  return el;
}

function openCasaDetail(row) {
  const urls = Array.isArray(row.fotos_urls) ? row.fotos_urls : [];
  const offers = [
    [t("amenity.wifi"), !!row.wifi],
    [t("amenity.parking"), !!row.parking],
    [t("amenity.pool"), !!row.piscina],
    [t("amenity.patio"), !!row.patio],
    [t("amenity.ac"), !!row.aire],
    [t("amenity.gym"), !!row.gym],
    [t("amenity.pets"), !!row.mascotas],
    [t("amenity.laundry"), !!row.lavanderia],
    [t("amenity.bbq"), !!row.bbq],
  ];
  const html = `
    <div style="padding:1rem 1.05rem">
      <h2 style="margin:0 0 0.5rem">${escapeHtml(row.nombre || t("detail.casaFallback"))}</h2>
      <div class="muted" style="margin-bottom:0.75rem">${escapeHtml(tInmueble(row.tipo_inmueble))} · ${escapeHtml(
        row.direccion || ""
      )}</div>
      <div id="detail-gallery"></div>
      <div class="grid-2" style="margin-top:1rem">
        <div class="card" style="box-shadow:none">
          <div class="card-inner">
            <strong>${t("common.price")}</strong>
            <div class="price" style="margin-top:0.25rem">$${Number(row.precio_noche || 0).toLocaleString()}${t("detail.perNight")}</div>
          </div>
        </div>
        <div class="card" style="box-shadow:none">
          <div class="card-inner">
            <strong>${t("common.features")}</strong>
            <div class="muted" style="margin-top:0.35rem">
              ${escapeHtml(row.habitaciones ?? 0)} ${t("common.hab")} · ${escapeHtml(row.banos ?? 0)} ${t("common.baths")} · ${t("detail.maxGuests")} ${escapeHtml(row.max_huespedes ?? 1)} ${t("common.guests")}
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="box-shadow:none; margin-top:0.85rem">
        <div class="card-inner">
          <strong>${t("common.offers")}</strong>
          <div class="amenities-grid">
            ${offers
              .map(
                ([label, ok]) =>
                  `<div class="row"><strong>${escapeHtml(label)}</strong><span>${ok ? t("common.yes") : t("common.no")}</span></div>`
              )
              .join("")}
          </div>
        </div>
      </div>
      <div style="margin-top:1rem; display:flex; gap:0.5rem; justify-content:flex-end; flex-wrap:wrap">
        <button type="button" class="nav-btn nav-btn--accent" id="reserve-btn">${t("common.reserve")}</button>
        <a class="nav-btn nav-btn--gold" href="https://wa.me/${escapeHtml(adminWhatsappDigits())}?text=${encodeURIComponent(
          `Hola, quiero reservar la casa: ${row.nombre || ""}`
        )}" target="_blank" rel="noreferrer">${t("common.whatsapp")}</a>
      </div>
    </div>
  `;
  openModal(html);
  const holder = $("#detail-gallery");
  if (holder) holder.appendChild(mountGallery(urls));
  $("#reserve-btn")?.addEventListener("click", () => openReservaForm("casa", row));
}

function openCarroDetail(row) {
  const urls = Array.isArray(row.fotos_urls) ? row.fotos_urls : [];
  const html = `
    <div style="padding:1rem 1.05rem">
      <h2 style="margin:0 0 0.5rem">${escapeHtml(row.marca || t("detail.carroFallback"))}</h2>
      <div class="muted" style="margin-bottom:0.75rem">${escapeHtml(row.tipo || "")} · ${escapeHtml(row.cilindraje || "")}</div>
      <div id="detail-gallery"></div>
      <div class="grid-2" style="margin-top:1rem">
        <div class="card" style="box-shadow:none">
          <div class="card-inner">
            <strong>${t("common.price")}</strong>
            <div class="price" style="margin-top:0.25rem">$${Number(row.precio_dia || 0).toLocaleString()}${t("detail.perDay")}</div>
          </div>
        </div>
        <div class="card" style="box-shadow:none">
          <div class="card-inner">
            <strong>${t("common.details")}</strong>
            <div class="muted" style="margin-top:0.35rem">
              ${escapeHtml(row.puestos ?? 4)} ${t("common.seats")}
            </div>
          </div>
        </div>
      </div>
      <div style="margin-top:1rem; display:flex; gap:0.5rem; justify-content:flex-end; flex-wrap:wrap">
        <button type="button" class="nav-btn nav-btn--accent" id="reserve-btn">${t("common.reserve")}</button>
        <a class="nav-btn nav-btn--gold" href="https://wa.me/${escapeHtml(adminWhatsappDigits())}?text=${encodeURIComponent(
          `Hola, quiero reservar el carro: ${row.marca || ""}`
        )}" target="_blank" rel="noreferrer">${t("common.whatsapp")}</a>
      </div>
    </div>
  `;
  openModal(html);
  const holder = $("#detail-gallery");
  if (holder) holder.appendChild(mountGallery(urls));
  $("#reserve-btn")?.addEventListener("click", () => openReservaForm("carro", row));
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function parseISODate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
  if (!m) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function daysBetweenInclusiveStartExclusiveEnd(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db - da) / ms);
}

function openReservaForm(tipo, item) {
  const isCasa = tipo === "casa";
  const title = isCasa ? item.nombre || t("detail.casaFallback") : item.marca || t("detail.carroFallback");
  const unit = isCasa ? Number(item.precio_noche || 0) : Number(item.precio_dia || 0);

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const html = `
    <div style="padding:1rem 1.05rem">
      <h2 style="margin:0 0 0.25rem">${escapeHtml(t("reserva.h2prefix"))} ${escapeHtml(title)}</h2>
      <div class="muted" style="margin-bottom:0.75rem">${t("reserva.lead")}</div>

      <form id="reserva-form" class="card" style="box-shadow:none">
        <div class="card-inner">
          <div class="admin-form-grid">
            <div class="span-2">
              <label>${t("reserva.nombre")}</label>
              <input name="nombre" required />
            </div>
            <div>
              <label>${t("reserva.fnac")}</label>
              <input name="fecha_nacimiento" type="date" />
            </div>
            <div>
              <label>${t("reserva.id")}</label>
              <input name="pasaporte_id" required />
            </div>
            <div>
              <label>${t("reserva.tel")}</label>
              <input name="telefono" placeholder="${escapeHtml(t("reserva.telPh"))}" />
            </div>
            <div></div>
            <div>
              <label>${t("reserva.desde")}</label>
              <input name="desde" type="date" required value="${isoDate(today)}" />
            </div>
            <div>
              <label>${t("reserva.hasta")}</label>
              <input name="hasta" type="date" required value="${isoDate(tomorrow)}" />
            </div>
            ${
              isCasa
                ? `
            <div>
              <label>${t("reserva.personas")}</label>
              <input name="personas" type="number" min="1" value="1" />
            </div>
            <div>
              <label>${t("reserva.mascotas")}</label>
              <select name="mascotas">
                <option value="false" selected>${escapeHtml(t("yesno.no"))}</option>
                <option value="true">${escapeHtml(t("yesno.si"))}</option>
              </select>
            </div>
            `
                : `
            <div class="span-2">
              <label>${t("reserva.notas")}</label>
              <input name="notas" placeholder="${escapeHtml(t("reserva.notasPh"))}" />
            </div>
            `
            }
            <div class="span-2">
              <div class="card" style="box-shadow:none; border-style:dashed">
                <div class="card-inner" style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap">
                  <div>
                    <strong>${t("reserva.total")}</strong>
                    <div class="muted" id="total-hint" style="font-size:0.9rem"></div>
                  </div>
                  <div class="price" id="total-price" style="font-size:1.15rem">$0</div>
                </div>
              </div>
            </div>
            <div class="span-2" style="display:flex; justify-content:flex-end; gap:0.5rem; flex-wrap:wrap">
              <button type="button" class="nav-btn" data-close="1">${t("common.cancel")}</button>
              <button type="submit" class="nav-btn nav-btn--accent">${t("reserva.enviar")}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  `;

  openModal(html);

  const form = $("#reserva-form");
  const totalEl = $("#total-price");
  const hintEl = $("#total-hint");

  function recalc() {
    const d1 = parseISODate(form.desde.value);
    const d2 = parseISODate(form.hasta.value);
    if (!d1 || !d2) {
      totalEl.textContent = "$0";
      hintEl.textContent = "";
      return { noches: 0, total: 0 };
    }
    const n = daysBetweenInclusiveStartExclusiveEnd(d1, d2);
    const safeN = Math.max(1, n);
    const total = unit * safeN;
    totalEl.textContent = `$${Number(total || 0).toLocaleString()}`;
    hintEl.textContent = t(isCasa ? "renta.hintCasas" : "renta.hintCarros", {
      n: safeN,
      u: Number(unit || 0).toLocaleString(),
    });
    return { noches: safeN, total };
  }

  form.addEventListener("input", recalc);
  recalc();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { noches, total } = recalc();

    const payload = {
      estado: "pendiente",
      tipo,
      casa_id: isCasa ? item.id : null,
      carro_id: isCasa ? null : item.id,
      nombre: String(form.nombre.value || "").trim(),
      fecha_nacimiento: form.fecha_nacimiento.value || null,
      pasaporte_id: String(form.pasaporte_id.value || "").trim(),
      telefono: String(form.telefono.value || "").trim() || null,
      desde: form.desde.value,
      hasta: form.hasta.value,
      noches,
      personas: isCasa ? Number(form.personas.value || 1) : 1,
      mascotas: isCasa ? form.mascotas.value === "true" : false,
      total,
      notas: isCasa ? null : String(form.notas.value || "").trim() || null,
    };

    try {
      const client = getClient();
      const { data, error } = await client.from("reservas").insert(payload).select("*").single();
      if (error) throw error;

      const msg =
        tipo === "casa"
          ? t("wa.casa", {
              title,
              nombre: payload.nombre,
              id: payload.pasaporte_id,
              desde: payload.desde,
              hasta: payload.hasta,
              noches: payload.noches,
              personas: payload.personas,
              mascotas: payload.mascotas ? t("yesno.si") : t("yesno.no"),
              total: Number(payload.total || 0).toLocaleString(),
              rid: data.id,
            })
          : t("wa.carro", {
              title,
              nombre: payload.nombre,
              id: payload.pasaporte_id,
              desde: payload.desde,
              hasta: payload.hasta,
              noches: payload.noches,
              total: Number(payload.total || 0).toLocaleString(),
              rid: data.id,
            });

      window.open(`https://wa.me/${adminWhatsappDigits()}?text=${encodeURIComponent(msg)}`, "_blank", "noreferrer");
      openModal(
        `<div style="padding:1rem 1.05rem"><h2>${escapeHtml(t("reserva.okTitle"))}</h2><p class="muted">${escapeHtml(t("reserva.okBody"))}</p></div>`
      );
    } catch (err) {
      alert((err && err.message) || t("reserva.errSend"));
    }
  });
}

function renderCasaFilters(state) {
  const wrap = $("#casas-filters");
  if (!wrap) return;

  wrap.innerHTML = `
    <div>
      <label>${t("filters.buscar")}</label>
      <input id="casas-q" placeholder="${escapeHtml(t("filters.casas.qPh"))}" />
    </div>
    <div>
      <label>${t("filters.tipo")}</label>
      <select id="casas-tipo">
        <option value="">${escapeHtml(t("common.all"))}</option>
        <option value="casa">${escapeHtml(t("admin.form.opt.casa"))}</option>
        <option value="apartamento">${escapeHtml(t("admin.form.opt.apto"))}</option>
        <option value="cabaña">${escapeHtml(t("admin.form.opt.caba"))}</option>
      </select>
    </div>
    <div>
      <label>${t("filters.habMin")}</label>
      <input id="casas-hab" type="number" min="0" value="0" />
    </div>
    <div>
      <label>${t("filters.precioMax")}</label>
      <input id="casas-precio" type="number" min="0" placeholder="${escapeHtml(t("filters.precioSinLim"))}" />
    </div>
    <div>
      <label>${t("filters.mascotas")}</label>
      <select id="casas-mascotas">
        <option value="">${escapeHtml(t("common.any"))}</option>
        <option value="true">${escapeHtml(t("yesno.si"))}</option>
        <option value="false">${escapeHtml(t("yesno.no"))}</option>
      </select>
    </div>
    <div>
      <label>${t("filters.piscina")}</label>
      <select id="casas-piscina">
        <option value="">${escapeHtml(t("common.any"))}</option>
        <option value="true">${escapeHtml(t("yesno.si"))}</option>
        <option value="false">${escapeHtml(t("yesno.no"))}</option>
      </select>
    </div>
    <div>
      <label>${t("filters.aire")}</label>
      <select id="casas-aire">
        <option value="">${escapeHtml(t("common.any"))}</option>
        <option value="true">${escapeHtml(t("yesno.si"))}</option>
        <option value="false">${escapeHtml(t("yesno.no"))}</option>
      </select>
    </div>
    <div>
      <label>${t("filters.wifi")}</label>
      <select id="casas-wifi">
        <option value="">${escapeHtml(t("common.any"))}</option>
        <option value="true">${escapeHtml(t("yesno.si"))}</option>
        <option value="false">${escapeHtml(t("yesno.no"))}</option>
      </select>
    </div>
  `;

  $("#casas-q").value = state.q || "";
  $("#casas-tipo").value = state.tipo || "";
  $("#casas-hab").value = String(state.hab ?? 0);
  $("#casas-precio").value = state.precioMax != null ? String(state.precioMax) : "";
  $("#casas-mascotas").value = state.mascotas || "";
  $("#casas-piscina").value = state.piscina || "";
  $("#casas-aire").value = state.aire || "";
  $("#casas-wifi").value = state.wifi || "";

  const sync = () => {
    state.q = $("#casas-q").value || "";
    state.tipo = $("#casas-tipo").value || "";
    state.hab = Number($("#casas-hab").value || 0);
    state.precioMax = $("#casas-precio").value ? Number($("#casas-precio").value) : null;
    state.mascotas = $("#casas-mascotas").value;
    state.piscina = $("#casas-piscina").value;
    state.aire = $("#casas-aire").value;
    state.wifi = $("#casas-wifi").value;
    renderCasas(state);
  };

  wrap.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", sync);
    el.addEventListener("change", sync);
  });
}

function casaMatches(state, r) {
  const q = String(state.q || "").trim().toLowerCase();
  if (q) {
    const s = `${r.nombre || ""} ${r.tipo_inmueble || ""}`.toLowerCase();
    if (!s.includes(q)) return false;
  }
  if (state.tipo && r.tipo_inmueble !== state.tipo) return false;
  if (Number(r.habitaciones || 0) < Number(state.hab || 0)) return false;
  if (state.precioMax != null && Number(r.precio_noche || 0) > state.precioMax) return false;
  if (state.mascotas === "true" && r.mascotas !== true) return false;
  if (state.mascotas === "false" && r.mascotas !== false) return false;
  if (state.piscina === "true" && r.piscina !== true) return false;
  if (state.piscina === "false" && r.piscina !== false) return false;
  if (state.aire === "true" && r.aire !== true) return false;
  if (state.aire === "false" && r.aire !== false) return false;
  if (state.wifi === "true" && r.wifi !== true) return false;
  if (state.wifi === "false" && r.wifi !== false) return false;
  return true;
}

let __casaMap = null;
let __casaMarkers = [];

function ensureCasaMap() {
  const el = $("#casas-map");
  if (!el) return null;
  if (__casaMap) return __casaMap;
  __casaMap = L.map(el, { zoomControl: true, preferCanvas: true }).setView([25.7617, -80.1918], 11); // Miami
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2,
  }).addTo(__casaMap);
  return __casaMap;
}

function setCasaMarkers(rows) {
  const map = ensureCasaMap();
  if (!map) return;
  __casaMarkers.forEach((m) => m.remove());
  __casaMarkers = [];

  rows.forEach((r) => {
    if (typeof r.lat !== "number" || typeof r.lng !== "number") return;
    const price = Number(r.precio_noche || 0);
    const marker = L.marker([r.lat, r.lng]).addTo(map);
    marker.bindPopup(`<strong>${escapeHtml(r.nombre || t("detail.casaFallback"))}</strong><br/>$${price.toLocaleString()}${t("featured.perNight")}`);
    marker.on("click", () => openCasaDetail(r));
    __casaMarkers.push(marker);
  });
}

function renderCasas(state) {
  const list = $("#casas-list");
  if (!list) return;

  const rows = (state.rows || []).filter((r) => casaMatches(state, r));
  list.innerHTML = "";
  if (!rows.length) {
    list.innerHTML = `<div class="card"><div class="card-inner muted">${escapeHtml(t("list.noCasas"))}</div></div>`;
  } else {
    rows.forEach((r) => list.appendChild(renderCasaCard(r)));
  }

  setCasaMarkers(rows);
}

function renderCarroFilters(state) {
  const wrap = $("#carros-filters");
  if (!wrap) return;
  wrap.innerHTML = `
    <div>
      <label>${t("filters.buscar")}</label>
      <input id="carros-q" placeholder="${escapeHtml(t("filters.carros.qPh"))}" />
    </div>
    <div>
      <label>${t("filters.tipo")}</label>
      <input id="carros-tipo" placeholder="${escapeHtml(t("filters.carros.tipoPh"))}" />
    </div>
    <div>
      <label>${t("admin.form.cil")}</label>
      <input id="carros-cil" placeholder="${escapeHtml(t("filters.carros.cilPh"))}" />
    </div>
    <div>
      <label>${t("filters.carros.puestos")}</label>
      <input id="carros-puestos" type="number" min="1" value="1" />
    </div>
  `;
  $("#carros-q").value = state.q || "";
  $("#carros-tipo").value = state.tipo || "";
  $("#carros-cil").value = state.cil || "";
  $("#carros-puestos").value = String(state.puestos ?? 1);

  const sync = () => {
    state.q = $("#carros-q").value || "";
    state.tipo = $("#carros-tipo").value || "";
    state.cil = $("#carros-cil").value || "";
    state.puestos = Number($("#carros-puestos").value || 1);
    renderCarros(state);
  };

  wrap.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", sync);
    el.addEventListener("change", sync);
  });
}

function carroMatches(state, r) {
  const q = String(state.q || "").trim().toLowerCase();
  if (q) {
    const s = `${r.marca || ""} ${r.tipo || ""} ${r.cilindraje || ""}`.toLowerCase();
    if (!s.includes(q)) return false;
  }
  if (state.tipo && !String(r.tipo || "").toLowerCase().includes(String(state.tipo).toLowerCase())) return false;
  if (state.cil && !String(r.cilindraje || "").toLowerCase().includes(String(state.cil).toLowerCase())) return false;
  if (Number(r.puestos || 0) < Number(state.puestos || 1)) return false;
  return true;
}

function renderCarros(state) {
  const list = $("#carros-list");
  if (!list) return;
  const rows = (state.rows || []).filter((r) => carroMatches(state, r));
  list.innerHTML = "";
  if (!rows.length) {
    list.innerHTML = `<div class="card"><div class="card-inner muted">${escapeHtml(t("list.noCarros"))}</div></div>`;
    return;
  }
  rows.forEach((r) => list.appendChild(renderCarroCard(r)));
}

function filterDisponible(rows) {
  return (rows || []).filter((r) => r.disponible !== false);
}

function sortLuxuryFirst(rows) {
  const copy = [...(rows || [])];
  copy.sort((a, b) => {
    const la = /luxury|lujo|luxe/i.test(String(a.nombre || "")) ? 0 : 1;
    const lb = /luxury|lujo|luxe/i.test(String(b.nombre || "")) ? 0 : 1;
    if (la !== lb) return la - lb;
    return 0;
  });
  return copy;
}

function collectHomeCarouselUrls(pubCasas, pubCarros) {
  const out = [];
  sortLuxuryFirst(pubCasas).forEach((c) => {
    (Array.isArray(c.fotos_urls) ? c.fotos_urls : []).forEach((u) => out.push(u));
  });
  (pubCarros || []).forEach((c) => {
    (Array.isArray(c.fotos_urls) ? c.fotos_urls : []).forEach((u) => out.push(u));
  });
  const norm = normalizePhotoUrls(out);
  const seen = new Set();
  const uniq = [];
  norm.forEach((u) => {
    if (!u || seen.has(u)) return;
    seen.add(u);
    uniq.push(u);
  });
  return uniq.slice(0, 18);
}

async function renderHomePageBlocks() {
  const wrap = $("#home-featured");
  const carouselMount = $("#home-luxury-carousel");
  try {
    const [casasAll, carrosAll] = await Promise.all([fetchCasas(), fetchCarros()]);
    const pubCasas = sortLuxuryFirst(filterDisponible(casasAll));
    const pubCarros = filterDisponible(carrosAll);

    const c1 = pubCasas[0];
    const c2 = pubCarros[0];
    const carroImg = c2 ? firstPhoto(c2) : "";
    const casaImg = c1 ? firstPhoto(c1) : "";
    const carroPrecio = c2 ? `$${Number(c2.precio_dia || 0).toLocaleString()} ${t("featured.perDay")}` : "";
    const casaPrecio = c1 ? `$${Number(c1.precio_noche || 0).toLocaleString()} ${t("featured.perNight")}` : "";
    if (wrap) {
      wrap.innerHTML = `
      <div class="card featured-card" data-nav="carros" style="cursor:pointer">
        <div class="featured-media">${carroImg ? `<img alt="" referrerpolicy="no-referrer" src="${escapeHtml(carroImg)}" />` : ""}</div>
        <div class="featured-side">
          <div>
            <h3>${c2 ? escapeHtml(c2.marca) : t("featured.cars")}</h3>
            <div class="muted">${c2 ? escapeHtml((c2.tipo || "") + " · " + (c2.cilindraje || "")) : t("featured.noCars")}</div>
          </div>
          <div class="price-row">
            <div class="price">${escapeHtml(c2 ? carroPrecio : "")}</div>
            <span class="pill">${c2 ? (Array.isArray(c2.fotos_urls) ? c2.fotos_urls.length : 0) : 0} ${t("featured.photos")}</span>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
            <button type="button" class="nav-btn nav-btn--accent" data-nav="carros">${t("featured.viewCars")}</button>
          </div>
        </div>
      </div>
      <div class="card featured-card" data-nav="casas" style="cursor:pointer">
        <div class="featured-media">${casaImg ? `<img alt="" referrerpolicy="no-referrer" src="${escapeHtml(casaImg)}" />` : ""}</div>
        <div class="featured-side">
          <div>
            <h3>${c1 ? escapeHtml(c1.nombre) : t("featured.houses")}</h3>
            <div class="muted">${c1 ? escapeHtml(`${tInmueble(c1.tipo_inmueble)} · ${c1.habitaciones ?? 0} ${t("common.hab")} · ${c1.banos ?? 0} ${t("common.baths")}`) : t("featured.noHouses")}</div>
          </div>
          <div class="price-row">
            <div class="price">${escapeHtml(c1 ? casaPrecio : "")}</div>
            <span class="pill">${c1 ? (Array.isArray(c1.fotos_urls) ? c1.fotos_urls.length : 0) : 0} ${t("featured.photos")}</span>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
            <button type="button" class="nav-btn nav-btn--accent" data-nav="casas">${t("featured.viewHouses")}</button>
          </div>
        </div>
      </div>
    `;
    }

    if (carouselMount) {
      carouselMount.innerHTML = "";
      const slides = collectHomeCarouselUrls(pubCasas, pubCarros);
      if (slides.length) {
        carouselMount.appendChild(mountGallery(slides));
      } else {
        carouselMount.innerHTML = `<div class="card"><div class="card-inner muted">${escapeHtml(t("featured.carouselEmpty"))}</div></div>`;
      }
    }
  } catch (_e) {
    if (wrap) {
      wrap.innerHTML = `
      <div class="card featured-card">
        <div class="featured-media"></div>
        <div class="featured-side"><div><h3>${t("featured.cars")}</h3><p class="muted">${t("featured.supabase")}</p></div></div>
      </div>
      <div class="card featured-card">
        <div class="featured-media"></div>
        <div class="featured-side"><div><h3>${t("featured.houses")}</h3><p class="muted">${t("featured.supabase")}</p></div></div>
      </div>
    `;
    }
    if (carouselMount) {
      carouselMount.innerHTML = `<div class="card"><div class="card-inner muted">${escapeHtml(t("featured.supabase"))}</div></div>`;
    }
  }
}

export async function initClient() {
  initModal();
  await renderHomePageBlocks();
  const casasState = { rows: [], q: "", tipo: "", hab: 0, precioMax: null, mascotas: "" };
  const carrosState = { rows: [], q: "", tipo: "", cil: "", puestos: 1 };

  renderCasaFilters(casasState);
  renderCarroFilters(carrosState);

  window.addEventListener("rentals-lang-change", () => {
    renderHomePageBlocks().catch(() => {});
    renderCasaFilters(casasState);
    renderCarroFilters(carrosState);
    renderCasas(casasState);
    renderCarros(carrosState);
  });

  try {
    const allCasas = await fetchCasas();
    casasState.rows = filterDisponible(allCasas);
    renderCasas(casasState);
  } catch (e) {
    const list = document.getElementById("casas-list");
    if (list) list.innerHTML = `<div class="card"><div class="card-inner muted">${escapeHtml(t("err.casas"))} ${escapeHtml(e?.message || "")}</div></div>`;
  }

  try {
    const allCarros = await fetchCarros();
    carrosState.rows = filterDisponible(allCarros);
    renderCarros(carrosState);
  } catch (e) {
    const list = document.getElementById("carros-list");
    if (list) list.innerHTML = `<div class="card"><div class="card-inner muted">${escapeHtml(t("err.carros"))} ${escapeHtml(e?.message || "")}</div></div>`;
  }

  // Al entrar a la vista de casas, Leaflet necesita recalcular tamaños para render rápido.
  function maybeInvalidateMap() {
    const route = (location.hash || "").replace(/^#/, "") || "home";
    if (route !== "casas") return;
    const map = ensureCasaMap();
    if (!map) return;
    setTimeout(() => {
      try {
        map.invalidateSize(true);
      } catch (_e) {}
    }, 50);
  }
  window.addEventListener("hashchange", maybeInvalidateMap);
  maybeInvalidateMap();
}

