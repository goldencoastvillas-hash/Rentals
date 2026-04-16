import { getClient, adminWhatsappDigits } from "./rentals-supabase.js";
import { initModal, openModal } from "./ui-modal.js";
import { mountGallery } from "./ui-gallery.js";

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
  return u || "";
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
  const precio = `$${Number(row.precio_noche || 0).toLocaleString()} / noche`;
  const meta = `${row.tipo_inmueble || ""} · ${row.habitaciones ?? 0} hab · ${row.banos ?? 0} baños`;
  const el = document.createElement("div");
  el.className = "item-card";
  el.innerHTML = `
    <img class="thumb" alt="" src="${escapeHtml(img)}" onerror="this.style.display='none'" />
    <div class="item-meta">
      <h3>${escapeHtml(row.nombre || "Casa")}</h3>
      <div class="muted">${escapeHtml(meta)}</div>
      <div class="price-row">
        <div class="price">${escapeHtml(precio)}</div>
        <span class="pill">${Array.isArray(row.fotos_urls) ? row.fotos_urls.length : 0} fotos</span>
      </div>
    </div>
  `;
  el.addEventListener("click", () => openCasaDetail(row));
  return el;
}

function renderCarroCard(row) {
  const img = firstPhoto(row);
  const precio = `$${Number(row.precio_dia || 0).toLocaleString()} / día`;
  const meta = `${row.tipo || ""} · ${row.puestos ?? 0} puestos · ${row.cilindraje || ""}`;
  const el = document.createElement("div");
  el.className = "card";
  el.style.cursor = "pointer";
  el.innerHTML = `
    <div style="height:220px; background: var(--surface2); overflow:hidden">
      <img alt="" src="${escapeHtml(img)}" style="width:100%; height:220px; object-fit:cover; display:block" onerror="this.style.display='none'" />
    </div>
    <div class="card-inner">
      <h3>${escapeHtml(row.marca || "Carro")}</h3>
      <div class="muted" style="margin-bottom:0.35rem">${escapeHtml(meta)}</div>
      <div class="price-row">
        <div class="price">${escapeHtml(precio)}</div>
        <span class="pill">${Array.isArray(row.fotos_urls) ? row.fotos_urls.length : 0} fotos</span>
      </div>
    </div>
  `;
  el.addEventListener("click", () => openCarroDetail(row));
  return el;
}

function openCasaDetail(row) {
  const urls = Array.isArray(row.fotos_urls) ? row.fotos_urls : [];
  const html = `
    <div style="padding:1rem 1.05rem">
      <h2 style="margin:0 0 0.5rem">${escapeHtml(row.nombre || "Casa")}</h2>
      <div class="muted" style="margin-bottom:0.75rem">${escapeHtml(row.tipo_inmueble || "")} · ${escapeHtml(
        row.direccion || ""
      )}</div>
      <div id="detail-gallery"></div>
      <div class="grid-2" style="margin-top:1rem">
        <div class="card" style="box-shadow:none">
          <div class="card-inner">
            <strong>Precio</strong>
            <div class="price" style="margin-top:0.25rem">$${Number(row.precio_noche || 0).toLocaleString()} / noche</div>
          </div>
        </div>
        <div class="card" style="box-shadow:none">
          <div class="card-inner">
            <strong>Características</strong>
            <div class="muted" style="margin-top:0.35rem">
              ${escapeHtml(row.habitaciones ?? 0)} hab · ${escapeHtml(row.banos ?? 0)} baños · Máx ${escapeHtml(row.max_huespedes ?? 1)} huéspedes
            </div>
          </div>
        </div>
      </div>
      <div style="margin-top:1rem; display:flex; gap:0.5rem; justify-content:flex-end; flex-wrap:wrap">
        <button type="button" class="nav-btn nav-btn--accent" id="reserve-btn">Reservar</button>
        <a class="nav-btn nav-btn--gold" href="https://wa.me/${escapeHtml(adminWhatsappDigits())}?text=${encodeURIComponent(
          `Hola, quiero reservar la casa: ${row.nombre || ""}`
        )}" target="_blank" rel="noreferrer">WhatsApp</a>
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
      <h2 style="margin:0 0 0.5rem">${escapeHtml(row.marca || "Carro")}</h2>
      <div class="muted" style="margin-bottom:0.75rem">${escapeHtml(row.tipo || "")} · ${escapeHtml(row.cilindraje || "")}</div>
      <div id="detail-gallery"></div>
      <div class="grid-2" style="margin-top:1rem">
        <div class="card" style="box-shadow:none">
          <div class="card-inner">
            <strong>Precio</strong>
            <div class="price" style="margin-top:0.25rem">$${Number(row.precio_dia || 0).toLocaleString()} / día</div>
          </div>
        </div>
        <div class="card" style="box-shadow:none">
          <div class="card-inner">
            <strong>Detalles</strong>
            <div class="muted" style="margin-top:0.35rem">
              ${escapeHtml(row.puestos ?? 4)} puestos
            </div>
          </div>
        </div>
      </div>
      <div style="margin-top:1rem; display:flex; gap:0.5rem; justify-content:flex-end; flex-wrap:wrap">
        <button type="button" class="nav-btn nav-btn--accent" id="reserve-btn">Reservar</button>
        <a class="nav-btn nav-btn--gold" href="https://wa.me/${escapeHtml(adminWhatsappDigits())}?text=${encodeURIComponent(
          `Hola, quiero reservar el carro: ${row.marca || ""}`
        )}" target="_blank" rel="noreferrer">WhatsApp</a>
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
  const title = isCasa ? item.nombre || "Casa" : item.marca || "Carro";
  const unit = isCasa ? Number(item.precio_noche || 0) : Number(item.precio_dia || 0);
  const unitLabel = isCasa ? "noche" : "día";

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const html = `
    <div style="padding:1rem 1.05rem">
      <h2 style="margin:0 0 0.25rem">Reservar — ${escapeHtml(title)}</h2>
      <div class="muted" style="margin-bottom:0.75rem">Completa el formulario. Tu solicitud quedará <strong>pendiente</strong> hasta confirmación.</div>

      <form id="reserva-form" class="card" style="box-shadow:none">
        <div class="card-inner">
          <div class="admin-form-grid">
            <div class="span-2">
              <label>Nombre</label>
              <input name="nombre" required />
            </div>
            <div>
              <label>Fecha de nacimiento</label>
              <input name="fecha_nacimiento" type="date" />
            </div>
            <div>
              <label>Pasaporte o ID</label>
              <input name="pasaporte_id" required />
            </div>
            <div>
              <label>Teléfono</label>
              <input name="telefono" placeholder="+57..." />
            </div>
            <div></div>
            <div>
              <label>Desde</label>
              <input name="desde" type="date" required value="${isoDate(today)}" />
            </div>
            <div>
              <label>Hasta</label>
              <input name="hasta" type="date" required value="${isoDate(tomorrow)}" />
            </div>
            ${
              isCasa
                ? `
            <div>
              <label>Personas</label>
              <input name="personas" type="number" min="1" value="1" />
            </div>
            <div>
              <label>Mascotas</label>
              <select name="mascotas">
                <option value="false" selected>No</option>
                <option value="true">Sí</option>
              </select>
            </div>
            `
                : `
            <div class="span-2">
              <label>Notas (opcional)</label>
              <input name="notas" placeholder="Algo que debamos saber…" />
            </div>
            `
            }
            <div class="span-2">
              <div class="card" style="box-shadow:none; border-style:dashed">
                <div class="card-inner" style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap">
                  <div>
                    <strong>Total</strong>
                    <div class="muted" id="total-hint" style="font-size:0.9rem"></div>
                  </div>
                  <div class="price" id="total-price" style="font-size:1.15rem">$0</div>
                </div>
              </div>
            </div>
            <div class="span-2" style="display:flex; justify-content:flex-end; gap:0.5rem; flex-wrap:wrap">
              <button type="button" class="nav-btn" data-close="1">Cancelar</button>
              <button type="submit" class="nav-btn nav-btn--accent">Enviar reserva</button>
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
    hintEl.textContent = `${safeN} ${safeN === 1 ? unitLabel : unitLabel + "s"} × $${Number(unit || 0).toLocaleString()}`;
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
          ? `Nueva reserva (CASA)\nCasa: ${title}\nNombre: ${payload.nombre}\nID: ${payload.pasaporte_id}\nDesde: ${payload.desde}\nHasta: ${payload.hasta}\nNoches: ${payload.noches}\nPersonas: ${payload.personas}\nMascotas: ${payload.mascotas ? "Sí" : "No"}\nTotal: $${Number(
              payload.total || 0
            ).toLocaleString()}\nReservaID: ${data.id}`
          : `Nueva reserva (CARRO)\nCarro: ${title}\nNombre: ${payload.nombre}\nID: ${payload.pasaporte_id}\nDesde: ${payload.desde}\nHasta: ${payload.hasta}\nDías: ${payload.noches}\nTotal: $${Number(payload.total || 0).toLocaleString()}\nReservaID: ${data.id}`;

      window.open(`https://wa.me/${adminWhatsappDigits()}?text=${encodeURIComponent(msg)}`, "_blank", "noreferrer");
      openModal(`<div style="padding:1rem 1.05rem"><h2>Reserva enviada</h2><p class="muted">Tu solicitud quedó pendiente. Te contactaremos por WhatsApp.</p></div>`);
    } catch (err) {
      alert((err && err.message) || "No se pudo enviar la reserva.");
    }
  });
}

function renderCasaFilters(state) {
  const wrap = $("#casas-filters");
  if (!wrap) return;

  wrap.innerHTML = `
    <div>
      <label>Buscar</label>
      <input id="casas-q" placeholder="Nombre o tipo (casa, apartamento, cabaña)" />
    </div>
    <div>
      <label>Tipo</label>
      <select id="casas-tipo">
        <option value="">Todos</option>
        <option value="casa">Casa</option>
        <option value="apartamento">Apartamento</option>
        <option value="cabaña">Cabaña</option>
      </select>
    </div>
    <div>
      <label>Habitaciones (min)</label>
      <input id="casas-hab" type="number" min="0" value="0" />
    </div>
    <div>
      <label>Precio (máx)</label>
      <input id="casas-precio" type="number" min="0" placeholder="Sin límite" />
    </div>
    <div>
      <label>Mascotas</label>
      <select id="casas-mascotas">
        <option value="">Indiferente</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    </div>
  `;

  wrap.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", () => {
      state.q = $("#casas-q").value || "";
      state.tipo = $("#casas-tipo").value || "";
      state.hab = Number($("#casas-hab").value || 0);
      state.precioMax = $("#casas-precio").value ? Number($("#casas-precio").value) : null;
      state.mascotas = $("#casas-mascotas").value;
      renderCasas(state);
    });
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
  return true;
}

let __casaMap = null;
let __casaMarkers = [];

function ensureCasaMap() {
  const el = $("#casas-map");
  if (!el) return null;
  if (__casaMap) return __casaMap;
  __casaMap = L.map(el, { zoomControl: true }).setView([25.7617, -80.1918], 11); // Miami
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
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
    marker.bindPopup(`<strong>${escapeHtml(r.nombre || "Casa")}</strong><br/>$${price.toLocaleString()} / noche`);
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
    list.innerHTML = `<div class="card"><div class="card-inner muted">No hay casas con esos filtros.</div></div>`;
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
      <label>Buscar</label>
      <input id="carros-q" placeholder="Marca o tipo" />
    </div>
    <div>
      <label>Tipo</label>
      <input id="carros-tipo" placeholder="SUV, Sedan..." />
    </div>
    <div>
      <label>Cilindraje</label>
      <input id="carros-cil" placeholder="2.0, 3.0..." />
    </div>
    <div>
      <label>Puestos (min)</label>
      <input id="carros-puestos" type="number" min="1" value="1" />
    </div>
  `;
  wrap.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", () => {
      state.q = $("#carros-q").value || "";
      state.tipo = $("#carros-tipo").value || "";
      state.cil = $("#carros-cil").value || "";
      state.puestos = Number($("#carros-puestos").value || 1);
      renderCarros(state);
    });
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
    list.innerHTML = `<div class="card"><div class="card-inner muted">No hay carros con esos filtros.</div></div>`;
    return;
  }
  rows.forEach((r) => list.appendChild(renderCarroCard(r)));
}

async function renderHomeFeatured() {
  const wrap = $("#home-featured");
  if (!wrap) return;
  try {
    const [casas, carros] = await Promise.all([fetchCasas(), fetchCarros()]);
    const c1 = casas.slice(0, 1)[0];
    const c2 = carros.slice(0, 1)[0];
    const carroImg = c2 ? firstPhoto(c2) : "";
    const casaImg = c1 ? firstPhoto(c1) : "";
    const carroPrecio = c2 ? `$${Number(c2.precio_dia || 0).toLocaleString()} / día` : "";
    const casaPrecio = c1 ? `$${Number(c1.precio_noche || 0).toLocaleString()} / noche` : "";
    wrap.innerHTML = `
      <div class="card featured-card" data-nav="carros" style="cursor:pointer">
        <div class="featured-media">${carroImg ? `<img alt="" src="${escapeHtml(carroImg)}" />` : ""}</div>
        <div class="featured-side">
          <div>
            <h3>${c2 ? escapeHtml(c2.marca) : "Carros"}</h3>
            <div class="muted">${c2 ? escapeHtml((c2.tipo || "") + " · " + (c2.cilindraje || "")) : "Aún no hay carros publicados"}</div>
          </div>
          <div class="price-row">
            <div class="price">${escapeHtml(c2 ? carroPrecio : "")}</div>
            <span class="pill">${c2 ? (Array.isArray(c2.fotos_urls) ? c2.fotos_urls.length : 0) : 0} fotos</span>
          </div>
        </div>
      </div>
      <div class="card featured-card" data-nav="casas" style="cursor:pointer">
        <div class="featured-media">${casaImg ? `<img alt="" src="${escapeHtml(casaImg)}" />` : ""}</div>
        <div class="featured-side">
          <div>
            <h3>${c1 ? escapeHtml(c1.nombre) : "Casas"}</h3>
            <div class="muted">${c1 ? escapeHtml((c1.tipo_inmueble || "") + " · " + (c1.habitaciones ?? 0) + " hab · " + (c1.banos ?? 0) + " baños") : "Aún no hay casas publicadas"}</div>
          </div>
          <div class="price-row">
            <div class="price">${escapeHtml(c1 ? casaPrecio : "")}</div>
            <span class="pill">${c1 ? (Array.isArray(c1.fotos_urls) ? c1.fotos_urls.length : 0) : 0} fotos</span>
          </div>
        </div>
      </div>
    `;
  } catch (_e) {
    wrap.innerHTML = `
      <div class="card featured-card">
        <div class="featured-media"></div>
        <div class="featured-side"><div><h3>Carros</h3><p class="muted">Configura Supabase para cargar.</p></div></div>
      </div>
      <div class="card featured-card">
        <div class="featured-media"></div>
        <div class="featured-side"><div><h3>Casas</h3><p class="muted">Configura Supabase para cargar.</p></div></div>
      </div>
    `;
  }
}

export async function initClient() {
  initModal();
  await renderHomeFeatured();

  const casasState = { rows: [], q: "", tipo: "", hab: 0, precioMax: null, mascotas: "" };
  const carrosState = { rows: [], q: "", tipo: "", cil: "", puestos: 1 };

  renderCasaFilters(casasState);
  renderCarroFilters(carrosState);

  try {
    casasState.rows = await fetchCasas();
    renderCasas(casasState);
  } catch (_e) {}

  try {
    carrosState.rows = await fetchCarros();
    renderCarros(carrosState);
  } catch (_e) {}
}

