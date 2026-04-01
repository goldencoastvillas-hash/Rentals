import type { Prisma, Servicio, TipoServicio } from "@prisma/client";
import { prisma } from "../config/database.js";

export class ServicioRepository {
  async findMany(filters?: { tipo?: TipoServicio }): Promise<Servicio[]> {
    return prisma.servicio.findMany({
      where: filters?.tipo ? { tipo: filters.tipo } : undefined,
      orderBy: { id: "asc" },
    });
  }

  async findById(id: number): Promise<Servicio | null> {
    return prisma.servicio.findUnique({ where: { id } });
  }

  async create(data: Prisma.ServicioCreateInput): Promise<Servicio> {
    return prisma.servicio.create({ data });
  }

  async update(id: number, data: Prisma.ServicioUpdateInput): Promise<Servicio> {
    return prisma.servicio.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await prisma.servicio.delete({ where: { id } });
  }

  async findCasasConCoordenadas(): Promise<Servicio[]> {
    return prisma.servicio.findMany({
      where: {
        tipo: "CASA",
        lat: { not: null },
        lng: { not: null },
      },
    });
  }
}
