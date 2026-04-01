import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UsuarioRepository } from "../repositories/UsuarioRepository.js";

export class AuthService {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async login(email: string, password: string): Promise<{ token: string } | null> {
    const u = await this.usuarios.findByEmail(email);
    if (!u) return null;
    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return null;
    const token = jwt.sign(
      { sub: u.id, email: u.email, rol: u.rol },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );
    return { token };
  }
}
