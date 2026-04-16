import { getClient } from "./rentals-supabase.js";
import { initModal, openModal } from "./ui-modal.js";

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

function uniqUrls(urls) {
  const out = [];
  const seen = new Set();
  (urls || []).forEach((u) => {
    const v = String(u || "").trim();
    if (!v) return;
    if (seen.has(v)) return;
    seen.add(v);
    out.push(v);
  });
  return out;
}

function firstPhoto(row) {
  const u = Array.isArray(row?.fotos_urls) ? row.fotos_urls.find(Boolean) : "";
  return u || "";
}

function nowSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function uploadFiles(kind, entityId, files) {
  const client = getClient();
  const bucket = client.storage.from("catalog-media");
  const uploadedUrls = [];

  for (const f of files) {
    const safeName = String(f.name || "file").replace(/[^\w.\-]+/g, "_");
    const path = `${kind}/${entityId}/${nowSlug()}_${safeName}`;
    const { error: upErr } = await bucket.upload(path, f, { upsert: false });
    if (upErr) throw upErr;
    const { data } = bucket.getPublicUrl(path);
    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

function buildMenu(actions) {
  const menu = document.createElement("div");
  menu.className = "menu";
  menu.innerHTML = `
    <button type="button" class="dots-btn" aria-label="Acciones">⋯</button>
    <div class="menu-panel" role="menu"></div>
  `;
  const btn = menu.querySelector("button");
  const panel = menu.querySelector(".menu-panel");

  actions.forEach((a) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "menu-item" + (a.danger ? " danger" : "");
    item.textContent = a.label;
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.remove("is-open");
      a.onClick();
    });
    panel.appendChild(item);
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    panel.classList.toggle("is-open");
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) panel.classList.remove("is-open");
  });

  return menu;
}

function renderAdminShell(root) {
  root.innerHTML = `
    <div class="card">
      <div class="card-inner">
        <div class="admin-toolbar">
          <div class="left">
            <span class="pill" id="admin-kind-pill">Catálogo</span>
          </div>
          <div class="right">
            <label style="margin:0">
              <span class="muted" style="font-size:0.85rem; display:block; margin-bottom:0.25rem">Por página</span>
              <select id="admin-page-size">
                <option value="5">5</option>
                <option value="10" selected>10</option>
              </select>
            </label>
          </div>
        </div>

        <div class="admin-toolbar" style="margin-top:0">
          <div class="left">
            <input id="admin-search" type="search" placeholder="Buscar por nombre / tipo (casas) o marca (carros)" />
          </div>
          <div class="right">
            <button type="button" class="nav-btn nav-btn--accent" id="admin-add">Agregar</button>
          </div>
        </div>

        <div id="admin-form-wrap" class="admin-form" style="display:none"></div>
        <div id="admin-table-wrap" style="margin-top:0.75rem"></div>

        <div class="admin-toolbar" style="margin-top:0.75rem">
          <div class="left muted" id="admin-page-info" style="font-size:0.9rem"></div>
          <div class="right" style="display:flex; gap:0.5rem; align-items:center">
            <button type="button" class="nav-btn" id="admin-prev">Anterior</button>
            <button type="button" class="nav-btn" id="admin-next">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function casaFormHtml(state) {
  const v = state.editing || {};
  const fotos = (v.fotos_urls || []).join("\n");
  return `
    <div class="card">
      <div class="card-inner">
        <h3 style="margin:0 0 0.5rem">${state.editing ? "Editar casa" : "Agregar casa"}</h3>
        <form id="admin-casa-form">
          <div class="admin-form-grid">
            <div>
              <label>Tipo de inmueble</label>
              <select name="tipo_inmueble" required>
                <option value="casa" ${v.tipo_inmueble === "casa" ? "selected" : ""}>Casa</option>
                <option value="apartamento" ${v.tipo_inmueble === "apartamento" ? "selected" : ""}>Apartamento</option>
                <option value="cabaña" ${v.tipo_inmueble === "cabaña" ? "selected" : ""}>Cabaña</option>
              </select>
            </div>
            <div>
              <label>Nombre</label>
              <input name="nombre" value="${escapeHtml(v.nombre || "")}" required />
            </div>
            <div class="span-2">
              <label>Dirección</label>
              <input name="direccion" value="${escapeHtml(v.direccion || "")}" placeholder="Dirección" />
            </div>
            <div>
              <label>Habitaciones</label>
              <input name="habitaciones" type="number" min="0" value="${escapeHtml(v.habitaciones ?? 0)}" />
            </div>
            <div>
              <label>Baños</label>
              <input name="banos" type="number" min="0" value="${escapeHtml(v.banos ?? 0)}" />
            </div>
            <div>
              <label>Precio por noche</label>
              <input name="precio_noche" type="number" min="0" step="0.01" value="${escapeHtml(v.precio_noche ?? 0)}" />
            </div>
            <div>
              <label>Max huéspedes</label>
              <input name="max_huespedes" type="number" min="1" value="${escapeHtml(v.max_huespedes ?? 1)}" />
            </div>
            <div class="span-2">
              <label>Descripción</label>
              <input name="descripcion" value="${escapeHtml(v.descripcion || "")}" placeholder="Descripción corta" />
            </div>

            <div class="span-2">
              <label>Fotos (subir desde dispositivo)</label>
              <input name="files" type="file" accept="image/*" multiple />
              <div class="muted" style="font-size:0.85rem; margin-top:0.25rem">
                Se suben a Supabase Storage y se guardan como URLs en la casa.
              </div>
            </div>

            <div class="span-2">
              <label>Fotos (URLs existentes, una por línea)</label>
              <textarea name="fotos_urls" rows="4" style="width:100%; padding:0.7rem 0.75rem; border-radius:12px; border:1px solid rgba(0,109,119,0.2)">${escapeHtml(
                fotos
              )}</textarea>
            </div>

            <div class="span-2" style="display:flex; gap:0.5rem; justify-content:flex-end">
              <button type="button" class="nav-btn" id="admin-cancel">Cancelar</button>
              <button type="submit" class="nav-btn nav-btn--accent" style="width:auto">Guardar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

function carroFormHtml(state) {
  const v = state.editing || {};
  const fotos = (v.fotos_urls || []).join("\n");
  return `
    <div class="card">
      <div class="card-inner">
        <h3 style="margin:0 0 0.5rem">${state.editing ? "Editar carro" : "Agregar carro"}</h3>
        <form id="admin-carro-form">
          <div class="admin-form-grid">
            <div>
              <label>Marca</label>
              <input name="marca" value="${escapeHtml(v.marca || "")}" required />
            </div>
            <div>
              <label>Cilindraje</label>
              <input name="cilindraje" value="${escapeHtml(v.cilindraje || "")}" placeholder="2.0, 3.0, etc." />
            </div>
            <div>
              <label>Tipo</label>
              <input name="tipo" value="${escapeHtml(v.tipo || "")}" placeholder="SUV, Sedan, ..." />
            </div>
            <div>
              <label>Puestos</label>
              <input name="puestos" type="number" min="1" value="${escapeHtml(v.puestos ?? 4)}" />
            </div>
            <div>
              <label>Precio por día</label>
              <input name="precio_dia" type="number" min="0" step="0.01" value="${escapeHtml(v.precio_dia ?? 0)}" />
            </div>
            <div class="span-2">
              <label>Descripción</label>
              <input name="descripcion" value="${escapeHtml(v.descripcion || "")}" placeholder="Descripción corta" />
            </div>

            <div class="span-2">
              <label>Fotos (subir desde dispositivo)</label>
              <input name="files" type="file" accept="image/*" multiple />
              <div class="muted" style="font-size:0.85rem; margin-top:0.25rem">
                Se suben a Supabase Storage y se guardan como URLs en el carro.
              </div>
            </div>

            <div class="span-2">
              <label>Fotos (URLs existentes, una por línea)</label>
              <textarea name="fotos_urls" rows="4" style="width:100%; padding:0.7rem 0.75rem; border-radius:12px; border:1px solid rgba(0,109,119,0.2)">${escapeHtml(
                fotos
              )}</textarea>
            </div>

            <div class="span-2" style="display:flex; gap:0.5rem; justify-content:flex-end">
              <button type="button" class="nav-btn" id="admin-cancel">Cancelar</button>
              <button type="submit" class="nav-btn nav-btn--accent" style="width:auto">Guardar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

function parseUrlsTextarea(val) {
  return uniqUrls(
    String(val || "")
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

async function listRows(kind) {
  const client = getClient();
  if (kind === "casas") {
    const { data, error } = await client
      .from("casas")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const { data, error } = await client
    .from("carros")
    .select("*")
    .order("creado_en", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function upsertCasa(row) {
  const client = getClient();
  if (row && row.id) {
    const { data, error } = await client.from("casas").update(row).eq("id", row.id).select("*").single();
    if (error) throw error;
    return data;
  }
  const { id, ...ins } = row || {};
  const { data, error } = await client.from("casas").insert(ins).select("*").single();
  if (error) throw error;
  return data;
}

async function upsertCarro(row) {
  const client = getClient();
  if (row && row.id) {
    const { data, error } = await client.from("carros").update(row).eq("id", row.id).select("*").single();
    if (error) throw error;
    return data;
  }
  const { id, ...ins } = row || {};
  const { data, error } = await client.from("carros").insert(ins).select("*").single();
  if (error) throw error;
  return data;
}

async function deleteCasa(id) {
  const client = getClient();
  const { error } = await client.from("casas").delete().eq("id", id);
  if (error) throw error;
}

async function deleteCarro(id) {
  const client = getClient();
  const { error } = await client.from("carros").delete().eq("id", id);
  if (error) throw error;
}

async function listReservas() {
  const client = getClient();
  const { data, error } = await client.from("reservas").select("*").order("creado_en", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateReservaEstado(id, estado) {
  const client = getClient();
  const { error } = await client.from("reservas").update({ estado }).eq("id", id);
  if (error) throw error;
}

function rowTitle(kind, r) {
  if (kind === "casas") return `${r.nombre || "Casa"} · ${r.tipo_inmueble || ""}`.trim();
  return `${r.marca || "Carro"} · ${r.cilindraje || ""}`.trim();
}

function renderTable(state, rows) {
  const wrap = $("#admin-table-wrap");
  if (!wrap) return;

  if (!rows.length) {
    wrap.innerHTML = `<div class="card"><div class="card-inner muted">No hay registros todavía.</div></div>`;
    return;
  }

  const th =
    state.kind === "casas"
      ? `<tr><th style="width:86px">Foto</th><th>Casa</th><th>Precio</th><th>Atributos</th><th style="text-align:right">Acciones</th></tr>`
      : `<tr><th style="width:86px">Foto</th><th>Carro</th><th>Precio</th><th>Atributos</th><th style="text-align:right">Acciones</th></tr>`;

  const table = document.createElement("table");
  table.className = "admin-table";
  table.innerHTML = `<thead>${th}</thead><tbody></tbody>`;
  const tbody = table.querySelector("tbody");

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";

    const photosCount = Array.isArray(r.fotos_urls) ? r.fotos_urls.length : 0;
    const img = firstPhoto(r);

    const attrs =
      state.kind === "casas"
        ? `${escapeHtml(r.tipo_inmueble || "")} · ${escapeHtml(r.habitaciones ?? 0)} hab · ${escapeHtml(r.banos ?? 0)} baños · ${photosCount} fotos`
        : `${escapeHtml(r.tipo || "")} · ${escapeHtml(r.puestos ?? 0)} puestos · ${photosCount} fotos`;

    const price =
      state.kind === "casas"
        ? `$${Number(r.precio_noche || 0).toLocaleString()} / noche`
        : `$${Number(r.precio_dia || 0).toLocaleString()} / día`;

    tr.innerHTML = `
      <td>
        ${
          img
            ? `<img alt="" src="${escapeHtml(img)}" style="width:72px; height:54px; object-fit:cover; border-radius:12px; border:1px solid rgba(0,109,119,0.12)" />`
            : `<div class="muted" style="font-size:0.85rem">—</div>`
        }
      </td>
      <td><strong>${escapeHtml(rowTitle(state.kind, r))}</strong><div class="muted" style="font-size:0.85rem">${escapeHtml(
        r.direccion || r.descripcion || ""
      )}</div></td>
      <td>${escapeHtml(price)}</td>
      <td class="muted">${attrs}</td>
      <td></td>
    `;

    tr.addEventListener("click", (e) => {
      // Si el click viene del menú (⋯), no abrir preview de fotos
      if (e.target && e.target.closest && e.target.closest(".menu")) return;
      const urls = Array.isArray(r.fotos_urls) ? r.fotos_urls : [];
      const html =
        urls.length === 0
          ? `<div class="card"><div class="card-inner muted">Sin fotos.</div></div>`
          : `<div class="card"><div class="card-inner"><div class="grid-2">${urls
              .slice(0, 8)
              .map((u) => `<div class="card" style="box-shadow:none"><img alt="" src="${escapeHtml(
                u
              )}" style="width:100%; height:220px; object-fit:cover; display:block" /></div>`)
              .join("")}</div></div></div>`;
      const root = $("#admin-form-wrap");
      root.style.display = "block";
      root.innerHTML = `<div class="card"><div class="card-inner"><h3 style="margin:0 0 0.5rem">Fotos — ${escapeHtml(
        rowTitle(state.kind, r)
      )}</h3><div class="muted" style="margin-bottom:0.75rem">Click en “Agregar” para editar/subir más fotos.</div>${html}</div></div>`;
      window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
    });

    const actionsCell = tr.querySelector("td:last-child");
    actionsCell.style.textAlign = "right";
    const menu = buildMenu([
      {
        label: "Actualizar / Editar",
        onClick: () => {
          state.editing = r;
          openForm(state);
        },
      },
      {
        label: "Eliminar",
        danger: true,
        onClick: async () => {
          const ok = confirm("¿Eliminar este registro? Esta acción no se puede deshacer.");
          if (!ok) return;
          if (state.kind === "casas") await deleteCasa(r.id);
          else await deleteCarro(r.id);
          await refresh(state);
        },
      },
      {
        label: "Ver reservas (pronto)",
        onClick: () => alert("Reservas se habilitan en el siguiente paso."),
      },
    ]);
    actionsCell.appendChild(menu);
    tbody.appendChild(tr);
  });

  wrap.innerHTML = "";
  wrap.appendChild(table);
}

function filterRows(state, allRows) {
  const q = String(state.query || "").trim().toLowerCase();
  if (!q) return allRows;

  if (state.kind === "casas") {
    return allRows.filter((r) => {
      const a = `${r.nombre || ""} ${r.tipo_inmueble || ""}`.toLowerCase();
      return a.includes(q);
    });
  }
  return allRows.filter((r) => {
    const a = `${r.marca || ""} ${r.cilindraje || ""} ${r.tipo || ""}`.toLowerCase();
    return a.includes(q);
  });
}

function paginate(state, rows) {
  const size = Number(state.pageSize || 10);
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, state.page || 1), pages);
  const start = (page - 1) * size;
  const end = start + size;
  return { page, pages, total, slice: rows.slice(start, end), start: start + 1, end: Math.min(end, total) };
}

function openForm(state) {
  const wrap = $("#admin-form-wrap");
  if (!wrap) return;

  wrap.style.display = "block";
  wrap.innerHTML = state.kind === "casas" ? casaFormHtml(state) : carroFormHtml(state);

  $("#admin-cancel")?.addEventListener("click", () => {
    state.editing = null;
    wrap.style.display = "none";
    wrap.innerHTML = "";
  });

  const form = wrap.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const files = fd.getAll("files").filter((f) => f && f.name);
    const urlsExisting = parseUrlsTextarea(fd.get("fotos_urls"));

    try {
      if (state.kind === "casas") {
        const base = {
          id: state.editing?.id,
          tipo_inmueble: String(fd.get("tipo_inmueble") || "casa"),
          nombre: String(fd.get("nombre") || "").trim(),
          direccion: String(fd.get("direccion") || "").trim(),
          habitaciones: Number(fd.get("habitaciones") || 0),
          banos: Number(fd.get("banos") || 0),
          precio_noche: Number(fd.get("precio_noche") || 0),
          max_huespedes: Number(fd.get("max_huespedes") || 1),
          descripcion: String(fd.get("descripcion") || "").trim(),
        };

        const saved = await upsertCasa(base);
        let urls = urlsExisting;
        if (files.length) {
          const uploaded = await uploadFiles("casas", saved.id, files);
          urls = uniqUrls([...(saved.fotos_urls || []), ...urlsExisting, ...uploaded]);
        }
        if (JSON.stringify(urls) !== JSON.stringify(saved.fotos_urls || [])) {
          await upsertCasa({ id: saved.id, fotos_urls: urls });
        }
      } else {
        const base = {
          id: state.editing?.id,
          marca: String(fd.get("marca") || "").trim(),
          cilindraje: String(fd.get("cilindraje") || "").trim(),
          tipo: String(fd.get("tipo") || "").trim(),
          puestos: Number(fd.get("puestos") || 4),
          precio_dia: Number(fd.get("precio_dia") || 0),
          descripcion: String(fd.get("descripcion") || "").trim(),
        };

        const saved = await upsertCarro(base);
        let urls = urlsExisting;
        if (files.length) {
          const uploaded = await uploadFiles("carros", saved.id, files);
          urls = uniqUrls([...(saved.fotos_urls || []), ...urlsExisting, ...uploaded]);
        }
        if (JSON.stringify(urls) !== JSON.stringify(saved.fotos_urls || [])) {
          await upsertCarro({ id: saved.id, fotos_urls: urls });
        }
      }

      state.editing = null;
      wrap.style.display = "none";
      wrap.innerHTML = "";
      await refresh(state);
    } catch (err) {
      alert((err && err.message) || "No se pudo guardar.");
    }
  });

  window.scrollTo({ top: wrap.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
}

async function refresh(state) {
  state.allRows = await listRows(state.kind);
  render(state);
}

function render(state) {
  const all = filterRows(state, state.allRows || []);
  const p = paginate(state, all);
  state.page = p.page;

  $("#admin-page-info").textContent = all.length
    ? `Mostrando ${p.start}-${p.end} de ${p.total}`
    : "0 resultados";

  renderTable(state, p.slice);

  $("#admin-prev").disabled = p.page <= 1;
  $("#admin-next").disabled = p.page >= p.pages;
}

export async function initAdmin() {
  const root = $("#admin-root");
  if (!root) return;

  function route() {
    return (location.hash || "").replace(/^#/, "") || "home";
  }

  async function runIfNeeded() {
    if (route() !== "admin") return;
    await runAdmin(root);
  }

  window.addEventListener("hashchange", () => {
    runIfNeeded().catch(() => {});
  });

  await runIfNeeded();
}

async function runAdmin(root) {
  initModal();
  const raw = localStorage.getItem("rentals_admin_session");
  const sess = raw ? JSON.parse(raw) : null;
  if (!sess || sess.ok !== true) {
    if (window.RentalsApp?.go) window.RentalsApp.go("admin-login");
    return;
  }

  $("#admin-whoami").textContent = sess.email || sess.username || "";

  $("#admin-logout")?.addEventListener("click", async () => {
    localStorage.removeItem("rentals_admin_session");
    if (window.RentalsApp?.go) window.RentalsApp.go("home");
  });

  renderAdminShell(root);

  const state = {
    kind: "casas",
    mode: "catalogo", // catalogo | mapa | reservas
    query: "",
    page: 1,
    pageSize: 10,
    allRows: [],
    editing: null,
  };

  function setActiveTop(tab) {
    const btnCasas = document.getElementById("admin-nav-casas");
    const btnCarros = document.getElementById("admin-nav-carros");
    const btnReservas = document.getElementById("admin-nav-reservas");
    const btnMapa = document.getElementById("admin-nav-mapa");
    const all = [
      ["casas", btnCasas],
      ["carros", btnCarros],
      ["reservas", btnReservas],
      ["mapa", btnMapa],
    ];
    all.forEach(([k, el]) => {
      if (!el) return;
      el.classList.toggle("nav-btn--accent", k === tab);
    });
  }

  async function showCatalog(kind) {
    state.mode = "catalogo";
    state.kind = kind;
    state.page = 1;
    state.editing = null;
    $("#admin-kind-pill").textContent = kind === "casas" ? "Catálogo · Casas" : "Catálogo · Carros";
    const formWrap = $("#admin-form-wrap");
    if (formWrap) {
      formWrap.style.display = "none";
      formWrap.innerHTML = "";
    }
    setActiveTop(kind);
    await refresh(state);
  }

  $("#admin-search").addEventListener("input", (e) => {
    state.query = e.target.value || "";
    state.page = 1;
    render(state);
  });

  $("#admin-page-size").addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value || 10);
    state.page = 1;
    render(state);
  });

  $("#admin-prev").addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render(state);
  });

  $("#admin-next").addEventListener("click", () => {
    state.page = state.page + 1;
    render(state);
  });

  $("#admin-add").addEventListener("click", () => {
    state.editing = null;
    openForm(state);
  });

  // Default: Casas
  await showCatalog("casas");

  // Navegación superior dentro del panel
  $("#admin-nav-casas")?.addEventListener("click", async () => {
    await showCatalog("casas");
  });

  $("#admin-nav-carros")?.addEventListener("click", async () => {
    await showCatalog("carros");
  });

  $("#admin-nav-reservas")?.addEventListener("click", async () => {
    setActiveTop("reservas");
    await renderReservas(root);
  });

  $("#admin-nav-mapa")?.addEventListener("click", async () => {
    state.mode = "mapa";
    setActiveTop("mapa");
    await renderMapaAdmin(root, state);
  });
}

let __adminMap = null;
let __adminMarkers = [];

function ensureAdminMap(el) {
  if (!el) return null;
  if (__adminMap) return __adminMap;
  __adminMap = L.map(el, { zoomControl: true, preferCanvas: true }).setView([25.7617, -80.1918], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2,
  }).addTo(__adminMap);
  return __adminMap;
}

async function renderMapaAdmin(_root, state) {
  const wrap = $("#admin-table-wrap");
  if (!wrap) return;
  $("#admin-kind-pill").textContent = "Mapa · Casas";

  // UI mapa + lista rápida
  wrap.innerHTML = `
    <div class="card" style="box-shadow:none">
      <div class="card-inner">
        <div class="muted" style="margin-bottom:0.5rem">Click en un marcador para abrir “Editar” de esa casa.</div>
        <div id="admin-map" class="map-box" style="height:520px"></div>
      </div>
    </div>
  `;

  const el = document.getElementById("admin-map");
  const map = ensureAdminMap(el);
  if (!map) return;

  // cargar casas
  state.kind = "casas";
  state.allRows = await listRows("casas");
  const casas = state.allRows || [];

  __adminMarkers.forEach((m) => m.remove());
  __adminMarkers = [];

  casas.forEach((c) => {
    if (typeof c.lat !== "number" || typeof c.lng !== "number") return;
    const m = L.marker([c.lat, c.lng]).addTo(map);
    m.bindPopup(`<strong>${escapeHtml(c.nombre || "Casa")}</strong>`);
    m.on("click", () => {
      state.editing = c;
      state.mode = "catalogo";
      $("#admin-kind-casas")?.click();
      setTimeout(() => openForm(state), 0);
    });
    __adminMarkers.push(m);
  });

  setTimeout(() => {
    try {
      map.invalidateSize(true);
    } catch (_e) {}
  }, 50);
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendar(monthDate, occupiedISO) {
  const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDow = (d.getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const prevDays = startDow;
  const totalCells = Math.ceil((prevDays + daysInMonth) / 7) * 7;

  const dow = ["L", "M", "M", "J", "V", "S", "D"]
    .map((x) => `<div class="cal-dow">${x}</div>`)
    .join("");

  let cells = "";
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - prevDays + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dd = new Date(monthDate.getFullYear(), monthDate.getMonth(), inMonth ? dayNum : 1);
    const iso = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(inMonth ? dayNum : 1).padStart(2, "0")}`;
    const occ = inMonth && occupiedISO.has(iso);
    cells += `<div class="cal-day ${inMonth ? "" : "is-muted"} ${occ ? "is-occupied" : ""}">${inMonth ? dayNum : ""}</div>`;
  }

  return `
    <div class="cal">
      <div class="cal-head">
        <strong>${monthDate.toLocaleString("es", { month: "long", year: "numeric" })}</strong>
        <span class="muted" style="font-size:0.9rem">Gris = ocupado (aprobado)</span>
      </div>
      <div class="cal-grid">${dow}${cells}</div>
    </div>
  `;
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function addOccupiedDays(set, desde, hasta) {
  const a = new Date(desde);
  const b = new Date(hasta);
  for (let d = new Date(a); d < b; d.setDate(d.getDate() + 1)) {
    set.add(iso(d));
  }
}

async function renderReservas(root) {
  const reservas = await listReservas();
  const wrap = $("#admin-table-wrap");
  const formWrap = $("#admin-form-wrap");
  if (formWrap) {
    formWrap.style.display = "none";
    formWrap.innerHTML = "";
  }

  // Calendario simple con aprobadas
  const occupied = new Set();
  reservas
    .filter((r) => r.estado === "aprobada")
    .forEach((r) => addOccupiedDays(occupied, r.desde, r.hasta));
  const calHtml = buildCalendar(new Date(), occupied);

  const table = document.createElement("table");
  table.className = "admin-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Estado</th>
        <th>Tipo</th>
        <th>Fechas</th>
        <th>Cliente</th>
        <th>Total</th>
        <th style="text-align:right">Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  reservas.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(r.estado)}</strong></td>
      <td>${escapeHtml(r.tipo)}</td>
      <td class="muted">${escapeHtml(r.desde)} → ${escapeHtml(r.hasta)}<br/>${escapeHtml(r.noches)} noches/días</td>
      <td>${escapeHtml(r.nombre)}<div class="muted" style="font-size:0.85rem">${escapeHtml(r.pasaporte_id)}</div></td>
      <td><strong>$${Number(r.total || 0).toLocaleString()}</strong></td>
      <td style="text-align:right"></td>
    `;

    tr.addEventListener("click", () => {
      openModal(`
        <div style="padding:1rem 1.05rem">
          <h2 style="margin:0 0 0.5rem">Reserva</h2>
          <div class="muted" style="margin-bottom:0.75rem">ID: ${escapeHtml(r.id)}</div>
          <div class="grid-2">
            <div class="card" style="box-shadow:none"><div class="card-inner">
              <strong>Cliente</strong>
              <div class="muted" style="margin-top:0.35rem">${escapeHtml(r.nombre)} · ${escapeHtml(r.pasaporte_id)}</div>
              <div class="muted" style="margin-top:0.25rem">Tel: ${escapeHtml(r.telefono || "-")}</div>
            </div></div>
            <div class="card" style="box-shadow:none"><div class="card-inner">
              <strong>Fechas</strong>
              <div class="muted" style="margin-top:0.35rem">${escapeHtml(r.desde)} → ${escapeHtml(r.hasta)}</div>
              <div class="muted" style="margin-top:0.25rem">Noches/días: ${escapeHtml(r.noches)}</div>
            </div></div>
          </div>
          <div style="margin-top:0.75rem">${calHtml}</div>
        </div>
      `);
    });

    const cell = tr.querySelector("td:last-child");
    const menu = buildMenu([
      {
        label: "Aprobar",
        onClick: async () => {
          await updateReservaEstado(r.id, "aprobada");
          await renderReservas(root);
        },
      },
      {
        label: "Rechazar",
        danger: true,
        onClick: async () => {
          await updateReservaEstado(r.id, "rechazada");
          await renderReservas(root);
        },
      },
    ]);
    cell.appendChild(menu);
    tbody.appendChild(tr);
  });

  // Reemplaza vista catálogo por reservas
  $("#admin-kind-pill").textContent = "Reservas";
  wrap.innerHTML = "";
  wrap.insertAdjacentHTML("beforeend", `<div style="margin:0.75rem 0">${calHtml}</div>`);
  wrap.appendChild(table);

  $("#admin-page-info").textContent = `${reservas.length} reservas`;
  $("#admin-prev").disabled = true;
  $("#admin-next").disabled = true;
}

