import { useEffect, useState } from "react";
import { MapView } from "../components/MapView";
import { ServiceCard } from "../components/ServiceCard";
import { api } from "../lib/api";
import type { Servicio } from "../types";

export function Home() {
  const [casas, setCasas] = useState<Servicio[]>([]);
  const [carros, setCarros] = useState<Servicio[]>([]);
  const [mapCasas, setMapCasas] = useState<Servicio[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.servicios("CASA"),
      api.servicios("CARRO"),
      api.mapCasas(),
    ])
      .then(([c, r, m]) => {
        setCasas(c);
        setCarros(r);
        setMapCasas(m);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-red-600">
        No se pudo cargar el catálogo. ¿Está el API en marcha? ({err})
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Rentas en Miami
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Casas y carros con disponibilidad en tiempo real.
        </p>
      </section>

      <section id="casas" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">Casas</h2>
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {casas.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </div>
        <h3 className="mb-4 text-lg font-medium text-slate-800">Mapa</h3>
        <MapView casas={mapCasas.length ? mapCasas : casas} />
      </section>

      <section id="carros" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">Carros</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {carros.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </div>
      </section>

      <section id="info" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-900">Información</h2>
        <p className="mt-3 text-slate-600">
          Marketplace enfocado en Miami. Reserva sin cuenta; el equipo confirma por correo.
          Los listados los gestiona el administrador.
        </p>
      </section>
    </div>
  );
}
