import type { OrigenBloqueo, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

export class BloqueoCalendarioRepository {
  async findOverlapping(
    servicioId: number,
    inicio: Date,
    fin: Date
  ): Promise<boolean> {
    const hit = await prisma.bloqueoCalendario.findFirst({
      where: {
        servicioId,
        AND: [{ inicio: { lt: fin } }, { fin: { gt: inicio } }],
      },
    });
    return !!hit;
  }

  async findInRange(servicioId: number, desde: Date, hasta: Date) {
    return prisma.bloqueoCalendario.findMany({
      where: {
        servicioId,
        AND: [{ inicio: { lte: hasta } }, { fin: { gte: desde } }],
      },
    });
  }

  async replaceFromIcal(
    servicioId: number,
    bloques: { inicio: Date; fin: Date; origen: OrigenBloqueo }[]
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.bloqueoCalendario.deleteMany({
        where: {
          servicioId,
          origen: { not: "INTERNA" },
        },
      });
      if (bloques.length === 0) return;
      await tx.bloqueoCalendario.createMany({
        data: bloques.map((b) => ({
          servicioId,
          inicio: b.inicio,
          fin: b.fin,
          origen: b.origen,
        })),
      });
    });
  }
}
