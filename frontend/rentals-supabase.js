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
          throw new Error(typeof msg === "string" ? msg : "Error de red");
        }
        return j;
      });
    });
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
    fetchAirbnbCalEdge: fetchAirbnbCalEdge,
  };
})(typeof window !== "undefined" ? window : globalThis);
