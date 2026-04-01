import type { Usuario } from "@prisma/client";
import { prisma } from "../config/database.js";

export class UsuarioRepository {
  async findByEmail(email: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { email } });
  }
}
