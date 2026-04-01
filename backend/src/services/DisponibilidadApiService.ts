import type { OrigenBloqueo } from "@prisma/client";
import { prisma } from "../config/database.js";

export interface RangoOcupado {
  inicio: string;
  fin: string;
  tipo: "reserva" | "bloqueo";
  origen?: OrigenBloqueo;
}

/** Rangos ocupados para calendario / API disponibilidad */
export class DisponibilidadApiService {
  async obtenerRangos(
    servicioId: number,
    desde: Date,
    hasta: Date
  ): Promise<RangoOcupado[]> {
    const reservas = await prisma.reserva.findMany({
      where: {
        servicioId,
        estado: { in: ["PENDIENTE", "CONFIRMADA"] },
        AND: [{ fechaInicio: { lte: hasta } }, { fechaFin: { gte: desde } }],
      },
    });

    const bloqueos = await prisma.bloqueoCalendario.findMany({
      where: {
        servicioId,
        AND: [{ inicio: { lte: hasta } }, { fin: { gte: desde } }],
      },
    });

    const out: RangoOcupado[] = [
      ...reservas.map((r) => ({
        inicio: r.fechaInicio.toISOString().slice(0, 10),
        fin: r.fechaFin.toISOString().slice(0, 10),
        tipo: "reserva" as const,
      })),
      ...bloqueos.map((b) => ({
        inicio: b.inicio.toISOString().slice(0, 10),
        fin: b.fin.toISOString().slice(0, 10),
        tipo: "bloqueo" as const,
        origen: b.origen,
      })),
    ];

    return out.sort((a, b) => a.inicio.localeCompare(b.inicio));
  }
}
