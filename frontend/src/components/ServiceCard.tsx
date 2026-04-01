import { Link } from "react-router-dom";
import type { Servicio } from "../types";

export function ServiceCard({ s }: { s: Servicio }) {
  const precio = typeof s.precio === "number" ? s.precio : Number(s.precio);
  const unit = s.tipo === "CASA" ? "noche" : "día";
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="h-36 bg-gradient-to-br from-teal-100 to-cyan-100" />
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium uppercase text-teal-600">
          {s.tipo === "CASA" ? "Casa" : "Carro"}
        </span>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">{s.nombre}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{s.descripcion}</p>
        <p className="mt-3 text-sm font-semibold text-slate-800">
          ${precio.toFixed(0)} / {unit}
        </p>
        <Link
          className="mt-4 inline-flex w-full justify-center rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
          to={`/servicio/${s.id}`}
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
