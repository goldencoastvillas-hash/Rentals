import type { Cliente, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

export class ClienteRepository {
  async create(data: Prisma.ClienteCreateInput): Promise<Cliente> {
    return prisma.cliente.create({ data });
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    return prisma.cliente.findFirst({ where: { email } });
  }
}
