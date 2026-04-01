import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, clearToken, getToken } from "../lib/api";
import type { Servicio, TipoServicio } from "../types";

const emptyForm = {
  tipo: "CASA" as TipoServicio,
  nombre: "",
  descripcion: "",
  precio: 100,
  ubicacion: "",
  lat: "" as string | number,
  lng: "" as string | number,
  habitaciones: "" as string | number,
  banos: "" as string | number,
  aireAcondicionado: true,
  petFriendly: false,
  marca: "",
  modelo: "",
  anio: "" as string | number,
  icalImportUrl: "",
};

export function AdminServicios() {
  const [list, setList] = useState<Servicio[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    if (!getToken()) return;
    api
      .servicios()
      .then(setList)
      .catch(() => setMsg("Sesión inválida o API caída"));
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(s: Servicio) {
    setEditingId(s.id);
    setForm({
      tipo: s.tipo,
      nombre: s.nombre,
      descripcion: s.descripcion,
      precio: Number(s.precio),
      ubicacion: s.ubicacion ?? "",
      lat: s.lat ?? "",
      lng: s.lng ?? "",
      habitaciones: s.habitaciones ?? "",
      banos: s.banos ?? "",
      aireAcondicionado: s.aireAcondicionado ?? false,
      petFriendly: s.petFriendly ?? false,
      marca: s.marca ?? "",
      modelo: s.modelo ?? "",
      anio: s.anio ?? "",
      icalImportUrl: s.icalImportUrl ?? "",
    });
  }

  function toPayload(): Record<string, unknown> {
    const base: Record<string, unknown> = {
      tipo: form.tipo,
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
    };
    if (form.tipo === "CASA") {
      base.ubicacion = form.ubicacion || null;
      base.lat = form.lat === "" ? null : Number(form.lat);
      base.lng = form.lng === "" ? null : Number(form.lng);
      base.habitaciones =
        form.habitaciones === "" ? null : Number(form.habitaciones);
      base.banos = form.banos === "" ? null : Number(form.banos);
      base.aireAcondicionado = form.aireAcondicionado;
      base.petFriendly = form.petFriendly;
      base.icalImportUrl = form.icalImportUrl || null;
    } else {
      base.marca = form.marca || null;
      base.modelo = form.modelo || null;
      base.anio = form.anio === "" ? null : Number(form.anio);
    }
    return base;
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      if (editingId) {
        await api.actualizarServicio(editingId, toPayload());
        setMsg("Actualizado");
      } else {
        await api.crearServicio(toPayload());
        setMsg("Creado");
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (er) {
      setMsg(er instanceof Error ? er.message : "Error");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("¿Eliminar servicio?")) return;
    try {
      await api.eliminarServicio(id);
      load();
    } catch {
      setMsg("No se pudo eliminar");
    }
  }

  async function onImportIcal(id: number) {
    setMsg(null);
    try {
      const r = await api.importIcal(id, {});
      setMsg(`Importados ${r.importados} eventos iCal`);
      load();
    } catch (er) {
      setMsg(er instanceof Error ? er.message : "Error import");
    }
  }

  if (!getToken()) {
    return (
      <p className="p-8">
        <Link className="text-teal-700 underline" to="/admin/login">
          Inicia sesión
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Servicios (admin)</h1>
        <button
          type="button"
          className="text-sm text-slate-600 underline"
          onClick={() => {
            clearToken();
            window.location.href = "/admin/login";
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          {editingId ? `Editar #${editingId}` : "Nuevo servicio"}
        </h2>
        <label className="text-sm">
          Tipo
          <select
            className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
            value={form.tipo}
            onChange={(e) =>
              setForm((f) => ({ ...f, tipo: e.target.value as TipoServicio }))
            }
          >
            <option value="CASA">CASA</option>
            <option value="CARRO">CARRO</option>
          </select>
        </label>
        <label className="text-sm">
          Precio
          <input
            type="number"
            required
            className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
            value={form.precio}
            onChange={(e) =>
              setForm((f) => ({ ...f, precio: Number(e.target.value) }))
            }
          />
        </label>
        <label className="sm:col-span-2 text-sm">
          Nombre
          <input
            required
            className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </label>
        <label className="sm:col-span-2 text-sm">
          Descripción
          <textarea
            required
            rows={3}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
            value={form.descripcion}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion: e.target.value }))
            }
          />
        </label>
        {form.tipo === "CASA" && (
          <>
            <label className="sm:col-span-2 text-sm">
              Ubicación
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                value={form.ubicacion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ubicacion: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              Lat
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                value={form.lat}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lat: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              Lng
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                value={form.lng}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lng: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              Habitaciones
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                value={form.habitaciones}
                onChange={(e) =>
                  setForm((f) => ({ ...f, habitaciones: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              Baños
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                value={form.banos}
                onChange={(e) =>
                  setForm((f) => ({ ...f, banos: e.target.value }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.aireAcondicionado}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aireAcondicionado: e.target.checked }))
                }
              />
              Aire acondicionado
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.petFriendly}
                onChange={(e) =>
                  setForm((f) => ({ ...f, petFriendly: e.target.checked }))
                }
              />
              Pet friendly
            </label>
            <label className="sm:col-span-2 text-sm">
              URL import iCal (Airbnb/Booking)
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                placeholder="https://..."
                value={form.icalImportUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icalImportUrl: e.target.value }))
                }
              />
            </label>
          </>
        )}
        {form.tipo === "CARRO" && (
          <>
            <label className="text-sm">
              Marca
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                value={form.marca}
                onChange={(e) =>
                  setForm((f) => ({ ...f, marca: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              Modelo
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                value={form.modelo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, modelo: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              Año
              <input
                type="number"
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
                value={form.anio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, anio: e.target.value }))
                }
              />
            </label>
          </>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
          >
            {editingId ? "Guardar" : "Crear"}
          </button>
          {editingId && (
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancelar edición
            </button>
          )}
        </div>
        {msg && <p className="sm:col-span-2 text-sm text-slate-700">{msg}</p>}
      </form>

      <ul className="mt-10 space-y-3">
        {list.map((x) => (
          <li
            key={x.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <span>
              <strong>{x.nombre}</strong> ({x.tipo}) — ${Number(x.precio)}
            </span>
            <span className="flex flex-wrap gap-2">
              {x.tipo === "CASA" && (
                <button
                  type="button"
                  className="text-sm text-teal-700 underline"
                  onClick={() => onImportIcal(x.id)}
                >
                  Importar iCal
                </button>
              )}
              <button
                type="button"
                className="text-sm text-slate-700 underline"
                onClick={() => startEdit(x)}
              >
                Editar
              </button>
              <button
                type="button"
                className="text-sm text-red-600 underline"
                onClick={() => onDelete(x.id)}
              >
                Eliminar
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
