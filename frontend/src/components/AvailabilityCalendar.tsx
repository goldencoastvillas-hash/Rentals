import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { api } from "../lib/api";

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Rangos ocupados: deshabilita días dentro de [inicio, fin) según API */
export function AvailabilityCalendar({
  servicioId,
  range,
  onRangeChange,
}: {
  servicioId: number;
  range: DateRange | undefined;
  onRangeChange: (r: DateRange | undefined) => void;
}) {
  const [disabledMatchers, setDisabledMatchers] = useState<
    { from: Date; to: Date }[]
  >([]);

  const defaultMonth = useMemo(() => new Date(), []);

  useEffect(() => {
    const from = new Date();
    from.setDate(1);
    const to = new Date(from);
    to.setFullYear(to.getFullYear() + 1);
    const fromStr = toYmd(from);
    const toStr = toYmd(to);
    api
      .disponibilidad(servicioId, fromStr, toStr)
      .then((data) => {
        const m = data.rangos.map((r) => ({
          from: parseLocal(r.inicio),
          to: addDays(parseLocal(r.fin), 1),
        }));
        setDisabledMatchers(m);
      })
      .catch(() => setDisabledMatchers([]));
  }, [servicioId, defaultMonth]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm text-slate-600">
        Fechas sombreadas o no seleccionables están ocupadas (reservas o calendario
        externo).
      </p>
      <DayPicker
        mode="range"
        numberOfMonths={2}
        defaultMonth={defaultMonth}
        selected={range}
        onSelect={onRangeChange}
        disabled={disabledMatchers}
      />
    </div>
  );
}
