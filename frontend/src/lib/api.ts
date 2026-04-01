import type { Servicio } from "../types";

const base = "";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(t: string): void {
  localStorage.setItem("token", t);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body != null && typeof init.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  if (init?.auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  servicios: (tipo?: "CASA" | "CARRO"): Promise<Array<Servicio>> =>
    fetchJson<Array<Servicio>>(`/api/servicios${tipo ? `?tipo=${tipo}` : ""}`),
  servicio: (id: number): Promise<Servicio> =>
    fetchJson<Servicio>(`/api/servicios/${id}`),
  mapCasas: (): Promise<Array<Servicio>> =>
    fetchJson<Array<Servicio>>(`/api/servicios/map`),
  disponibilidad: (id: number, from: string, to: string) =>
    fetchJson<{
      rangos: { inicio: string; fin: string; tipo: string }[];
    }>(`/api/servicios/${id}/disponibilidad?from=${from}&to=${to}`),
  crearReserva: (body: Record<string, unknown>) =>
    fetchJson<unknown>(`/api/reservas`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (email: string, password: string) =>
    fetchJson<{ token: string }>(`/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  adminReservas: (servicioId?: number) =>
    fetchJson<unknown[]>(
      `/api/reservas${servicioId ? `?servicioId=${servicioId}` : ""}`,
      { auth: true }
    ),
  crearServicio: (body: Record<string, unknown>) =>
    fetchJson<unknown>(`/api/servicios`, {
      method: "POST",
      body: JSON.stringify(body),
      auth: true,
    }),
  actualizarServicio: (id: number, body: Record<string, unknown>) =>
    fetchJson<unknown>(`/api/servicios/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      auth: true,
    }),
  eliminarServicio: (id: number) =>
    fetchJson<void>(`/api/servicios/${id}`, {
      method: "DELETE",
      auth: true,
    }),
  importIcal: (id: number, body: { url?: string; origen?: string }) =>
    fetchJson<{ importados: number }>(`/api/servicios/${id}/ical-import`, {
      method: "POST",
      body: JSON.stringify(body),
      auth: true,
    }),
};
