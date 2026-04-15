/**
 * Cliente mínimo para Supabase (REST + RPC) sin bundler.
 * Requiere window.RENTALS_CONFIG = { supabaseUrl, supabaseAnonKey, adminWhatsappDigits }
 */
(function (global) {
  function cfg() {
    return global.RENTALS_CONFIG || {};
  }

  function baseUrl() {
    var u = cfg().supabaseUrl || "";
    return u.replace(/\/$/, "");
  }

  function anonHeaders() {
    var k = cfg().supabaseAnonKey || "";
    return {
      apikey: k,
      Authorization: "Bearer " + k,
      "Content-Type": "application/json",
    };
  }

  function isConfigured() {
    var c = cfg();
    return !!(c.supabaseUrl && c.supabaseAnonKey);
  }

  function fetchJson(url, options) {
    return fetch(url, options).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try {
          j = t ? JSON.parse(t) : null;
        } catch (e) {
          j = null;
        }
        if (!r.ok) {
          var msg = (j && (j.message || j.error_description || j.hint)) || t || r.statusText;
          var body = typeof msg === "string" ? msg : "Error de red";
          throw new Error((r.status ? r.status + " — " : "") + body);
        }
        return j;
      });
    });
  }

  /**
   * PostgREST/Supabase suele devolver el jsonb tal cual, pero a veces el cuerpo llega como string JSON
   * o envuelto en un array / clave con el nombre de la función.
   */
  function normalizeWebListReservasAdminResponse(raw) {
    var d = raw;
    var i;
    for (i = 0; i < 4 && typeof d === "string"; i++) {
      try {
        d = JSON.parse(d);
      } catch (e) {
        return { ok: false, error: "invalid_json", items: [] };
      }
    }
    if (d == null) return { ok: false, error: "empty_response", items: [] };

    if (Array.isArray(d) && d.length === 1 && d[0] && typeof d[0] === "object" && !Array.isArray(d[0])) {
      var inner = d[0];
      var innerKeys = Object.keys(inner);
      if (innerKeys.length === 1 && /web_list_reservas_admin/i.test(innerKeys[0])) {
        return normalizeWebListReservasAdminResponse(inner[innerKeys[0]]);
      }
      if (Array.isArray(inner.items)) {
        return normalizeWebListReservasAdminResponse(inner);
      }
    }

    if (Array.isArray(d)) {
      if (d.length === 0) return { ok: true, items: [] };
      var row0 = d[0];
      if (row0 && typeof row0 === "object" && (row0.id != null || row0.fecha_inicio != null || row0.cliente_nombre != null)) {
        return { ok: true, items: d };
      }
      return { ok: true, items: d.filter(function (x) {
        return x && typeof x === "object";
      }) };
    }

    if (typeof d !== "object") return { ok: false, error: "invalid_shape", items: [] };

    if (d.ok === false) {
      return { ok: false, error: d.error || "rpc_error", items: [] };
    }

    var items = d.items;
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }
    if (!Array.isArray(items)) items = [];
    return { ok: true, items: items };
  }

  function fetchCatalog() {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    var h = anonHeaders();
    return Promise.all([
      fetchJson(b + "/rest/v1/carros?select=*", { headers: h }),
      fetchJson(b + "/rest/v1/casas?select=*", { headers: h }),
    ]).then(function (pair) {
      return { carros: pair[0] || [], casas: pair[1] || [] };
    });
  }

  function rpcCrearReservaCarro(body) {
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_crear_reserva_carro", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify(body),
    });
  }

  function rpcCrearReservaCasa(body) {
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_crear_reserva_casa", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify(body),
    });
  }

  /** Rangos [start,end) ocupados por reservas en nuestra base (excl. canceladas) */
  function rpcFechasBloqueadasCasa(p_casa_id) {
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_fechas_bloqueadas_casa", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify({ p_casa_id: p_casa_id }),
    });
  }

  /** Panel admin: lista reservas en BD (requiere SQL 005 y adminSyncSecret igual al de la función). */
  function rpcListReservasAdmin(apiKey) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    var h = anonHeaders();
    h.Accept = "application/json";
    return fetchJson(b + "/rest/v1/rpc/web_list_reservas_admin", {
      method: "POST",
      headers: h,
      body: JSON.stringify({ p_api_key: apiKey }),
    }).then(function (raw) {
      return normalizeWebListReservasAdminResponse(raw);
    });
  }

  /** Login admin real (SQL 009). */
  function rpcAdminLogin(body) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_admin_login", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify(body),
    });
  }

  /** CRUD admin: carros/casas (SQL 010). */
  function rpcAdminUpsertCarro(apiKey, body) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    var payload = Object.assign({ p_api_key: apiKey }, body || {});
    return fetchJson(b + "/rest/v1/rpc/web_admin_upsert_carro", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify(payload),
    });
  }

  function rpcAdminDeleteCarro(apiKey, carroId) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_admin_delete_carro", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify({ p_api_key: apiKey, p_id: carroId }),
    });
  }

  function rpcAdminUpsertCasa(apiKey, body) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    var payload = Object.assign({ p_api_key: apiKey }, body || {});
    return fetchJson(b + "/rest/v1/rpc/web_admin_upsert_casa", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify(payload),
    });
  }

  function rpcAdminDeleteCasa(apiKey, casaId) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_admin_delete_casa", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify({ p_api_key: apiKey, p_id: casaId }),
    });
  }

  /** Catálogo remoto: guardar URL iCal Airbnb en la fila de la casa (SQL 006, mismo secreto que 005). */
  function rpcAdminUpdateCasaAirbnbIcal(apiKey, casaId, icalUrl) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_admin_update_casa_airbnb_ical", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify({
        p_api_key: apiKey,
        p_casa_id: casaId,
        p_ical_url: icalUrl == null ? "" : String(icalUrl),
      }),
    });
  }

  /** Catálogo remoto: guardar fotos_urls de carro (SQL 008, mismo secreto que 005). */
  function rpcAdminUpdateCarroFotos(apiKey, carroId, fotosUrls) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_admin_update_carro_fotos", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify({
        p_api_key: apiKey,
        p_carro_id: carroId,
        p_fotos_urls: Array.isArray(fotosUrls) ? fotosUrls : [],
      }),
    });
  }

  /** Catálogo remoto: guardar fotos_urls de casa (SQL 008, mismo secreto que 005). */
  function rpcAdminUpdateCasaFotos(apiKey, casaId, fotosUrls) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    return fetchJson(b + "/rest/v1/rpc/web_admin_update_casa_fotos", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify({
        p_api_key: apiKey,
        p_casa_id: casaId,
        p_fotos_urls: Array.isArray(fotosUrls) ? fotosUrls : [],
      }),
    });
  }

  /** Admin: subir archivos de imagen y guardar urls (Edge Function admin-media-upload). */
  function uploadAdminMedia(tipo, itemId, apiKey, files, mode) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase no configurado"));
    var b = baseUrl();
    if (!tipo || !itemId) return Promise.reject(new Error("tipo/id requeridos"));
    var sec = String(apiKey || "").trim();
    if (!sec) return Promise.reject(new Error("adminSyncSecret requerido"));
    var fd = new FormData();
    (files || []).forEach(function (f) {
      if (f) fd.append("files", f);
    });
    var m = mode === "append" ? "append" : "replace";
    return fetchJson(
      b +
        "/functions/v1/admin-media-upload?tipo=" +
        encodeURIComponent(tipo) +
        "&id=" +
        encodeURIComponent(itemId) +
        "&mode=" +
        encodeURIComponent(m),
      {
        method: "POST",
        headers: Object.assign({}, anonHeaders(), { "x-admin-sync-secret": sec }),
        body: fd,
      }
    );
  }

  /** Requiere Edge Function casa-airbnb-cal desplegada; si falla, devuelve { ranges: [] } */
  function fetchAirbnbCalEdge(casaId) {
    var b = baseUrl();
    if (!b || !casaId) return Promise.resolve({ ranges: [] });
    return fetchJson(b + "/functions/v1/casa-airbnb-cal?casa_id=" + encodeURIComponent(casaId), {
      method: "GET",
      headers: anonHeaders(),
    }).catch(function () {
      return { ranges: [] };
    });
  }

  global.RentalsSupabase = {
    isConfigured: isConfigured,
    fetchCatalog: fetchCatalog,
    rpcCrearReservaCarro: rpcCrearReservaCarro,
    rpcCrearReservaCasa: rpcCrearReservaCasa,
    rpcFechasBloqueadasCasa: rpcFechasBloqueadasCasa,
    rpcListReservasAdmin: rpcListReservasAdmin,
    rpcAdminLogin: rpcAdminLogin,
    rpcAdminUpsertCarro: rpcAdminUpsertCarro,
    rpcAdminDeleteCarro: rpcAdminDeleteCarro,
    rpcAdminUpsertCasa: rpcAdminUpsertCasa,
    rpcAdminDeleteCasa: rpcAdminDeleteCasa,
    rpcAdminUpdateCasaAirbnbIcal: rpcAdminUpdateCasaAirbnbIcal,
    rpcAdminUpdateCarroFotos: rpcAdminUpdateCarroFotos,
    rpcAdminUpdateCasaFotos: rpcAdminUpdateCasaFotos,
    uploadAdminMedia: uploadAdminMedia,
    fetchAirbnbCalEdge: fetchAirbnbCalEdge,
  };
})(typeof window !== "undefined" ? window : globalThis);
