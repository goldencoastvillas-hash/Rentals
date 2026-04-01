import { prisma } from "../config/database.js";

export class DisponibilidadService {
  /** true = hay conflicto (no disponible) */
  async hayConflicto(
    servicioId: number,
    inicio: Date,
    fin: Date,
    excludeReservaId?: number
  ): Promise<boolean> {
    const reserva = await prisma.reserva.findFirst({
      where: {
        servicioId,
        id: excludeReservaId ? { not: excludeReservaId } : undefined,
        estado: { in: ["PENDIENTE", "CONFIRMADA"] },
        AND: [{ fechaInicio: { lt: fin } }, { fechaFin: { gt: inicio } }],
      },
    });
    if (reserva) return true;

    const bloqueo = await prisma.bloqueoCalendario.findFirst({
      where: {
        servicioId,
        AND: [{ inicio: { lt: fin } }, { fin: { gt: inicio } }],
      },
    });
    return !!bloqueo;
  }

  async verificarDisponibilidad(
    servicioId: number,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<boolean> {
    if (fechaInicio >= fechaFin) return false;
    return !(await this.hayConflicto(servicioId, fechaInicio, fechaFin));
  }
}
