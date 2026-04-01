import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DateRange } from "react-day-picker";
import { AvailabilityCalendar } from "../components/AvailabilityCalendar";
import { api } from "../lib/api";
import type { Servicio } from "../types";

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ServicioDetail() {
  const { id } = useParams<{ id: string }>();
  const sid = Number(id);
  const [s, setS] = useState<Servicio | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
  });
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(sid)) return;
    api
      .servicio(sid)
      .then((x) => setS(x as Servicio))
      .catch((e: Error) => setErr(e.message));
  }, [sid]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitMsg(null);
    if (!range?.from || !range.to) {
      setSubmitMsg("Elige un rango de fechas disponible.");
      return;
    }
    try {
      await api.crearReserva({
        servicioId: sid,
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        fechaInicio: toYmd(range.from),
        fechaFin: toYmd(range.to),
      });
      setSubmitMsg("Reserva creada. Revisa tu correo (simulado en consola del servidor).");
      setForm({ nombre: "", email: "", telefono: "" });
      setRange(undefined);
    } catch (er) {
      setSubmitMsg(er instanceof Error ? er.message : "Error");
    }
  }

  if (Number.isNaN(sid)) {
    return <p className="p-8">ID inválido</p>;
  }
  if (err) {
    return <p className="p-8 text-red-600">{err}</p>;
  }
  if (!s) {
    return <p className="p-8">Cargando…</p>;
  }

  const precio = typeof s.precio === "number" ? s.precio : Number(s.precio);
  const unit = s.tipo === "CASA" ? "noche" : "día";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="text-sm text-teal-700 hover:underline">
        ← Volver
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">{s.nombre}</h1>
      <p className="mt-2 text-slate-600">{s.descripcion}</p>
      <p className="mt-4 text-lg font-semibold">
        ${precio.toFixed(0)} / {unit}
      </p>

      {s.tipo === "CASA" && s.ubicacion && (
        <p className="mt-2 text-slate-700">{s.ubicacion}</p>
      )}
      {s.tipo === "CASA" && (
        <ul className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
          {s.habitaciones != null && <li>{s.habitaciones} hab.</li>}
          {s.banos != null && <li>{s.banos} baños</li>}
          {s.petFriendly && <li>Pet friendly</li>}
          {s.aireAcondicionado && <li>A/C</li>}
        </ul>
      )}
      {s.tipo === "CARRO" && (
        <p className="mt-4 text-slate-700">
          {s.marca} {s.modelo} ({s.anio})
        </p>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <AvailabilityCalendar
          servicioId={sid}
          range={range}
          onRangeChange={setRange}
        />
        <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Reservar</h2>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Nombre
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Email
            <input
              required
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Teléfono
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700"
          >
            Confirmar reserva
          </button>
          {submitMsg && (
            <p className="mt-3 text-sm text-slate-700" role="status">
              {submitMsg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
