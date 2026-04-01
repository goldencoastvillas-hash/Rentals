import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AdminJwtPayload {
  sub: number;
  email: string;
  rol: string;
}

export function authAdmin(req: Request, res: Response, next: NextFunction): void {
  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as AdminJwtPayload;
    (req as Request & { admin?: AdminJwtPayload }).admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}
