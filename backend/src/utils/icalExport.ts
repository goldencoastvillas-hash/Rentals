import type { Reserva } from "@prisma/client";

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Genera contenido .ics con reservas confirmadas */
export function generarIcsReservas(
  tituloCalendario: string,
  reservas: Reserva[]
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rentals Marketplace//ES",
    `X-WR-CALNAME:${escapeText(tituloCalendario)}`,
  ];

  for (const r of reservas) {
    if (r.estado !== "CONFIRMADA" && r.estado !== "PENDIENTE") continue;
    const uid = `reserva-${r.id}@rentals.local`;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dStart = formatIcsDate(r.fechaInicio);
    const dEnd = formatIcsDate(addOneDay(r.fechaFin));
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${dStart}`,
      `DTEND;VALUE=DATE:${dEnd}`,
      `SUMMARY:${escapeText(`Reserva #${r.id}`)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function formatIcsDate(d: Date): string {
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function addOneDay(d: Date): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + 1);
  return n;
}
