import type { EstadoReserva, Prisma, Reserva } from "@prisma/client";
import { prisma } from "../config/database.js";

export class ReservaRepository {
  async create(data: Prisma.ReservaCreateInput): Promise<Reserva> {
    return prisma.reserva.create({ data });
  }

  async findMany(filters?: { servicioId?: number }): Promise<Reserva[]> {
    return prisma.reserva.findMany({
      where: filters?.servicioId ? { servicioId: filters.servicioId } : undefined,
      include: { cliente: true, servicio: true },
      orderBy: { fechaInicio: "desc" },
    });
  }

  async findById(id: number): Promise<Reserva | null> {
    return prisma.reserva.findUnique({
      where: { id },
      include: { cliente: true, servicio: true },
    });
  }

  async updateEstado(id: number, estado: EstadoReserva): Promise<Reserva> {
    return prisma.reserva.update({ where: { id }, data: { estado } });
  }
}
