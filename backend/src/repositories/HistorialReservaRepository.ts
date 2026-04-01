import type { EstadoReserva } from "@prisma/client";
import { prisma } from "../config/database.js";

export class HistorialReservaRepository {
  async append(reservaId: number, estadoGuardado: EstadoReserva): Promise<void> {
    await prisma.historialReserva.create({
      data: { reservaId, estadoGuardado },
    });
  }

  async findLastForReserva(reservaId: number) {
    return prisma.historialReserva.findFirst({
      where: { reservaId },
      orderBy: { createdAt: "desc" },
    });
  }
}
