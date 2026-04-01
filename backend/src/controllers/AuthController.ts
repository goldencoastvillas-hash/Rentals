import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthService } from "../services/AuthService.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const result = await this.auth.login(parsed.data.email, parsed.data.password);
    if (!result) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }
    res.json(result);
  };
}
