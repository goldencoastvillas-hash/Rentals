import type { Request, Response } from "express";
import { z } from "zod";
import type { ReservaService } from "../services/ReservaService.js";

const crearSchema = z.object({
  servicioId: z.coerce.number().int().positive(),
  nombre: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().min(5),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export class ReservaController {
  constructor(private readonly reservas: ReservaService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { fechaInicio, fechaFin, ...rest } = parsed.data;
    const fi = parseDateOnly(fechaInicio);
    const ff = parseDateOnly(fechaFin);
    if (fi >= ff) {
      res.status(400).json({ error: "fechaFin debe ser posterior a fechaInicio" });
      return;
    }
    try {
      const r = await this.reservas.crearReserva({
        ...rest,
        fechaInicio: fi,
        fechaFin: ff,
      });
      res.status(201).json(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      if (msg.includes("no encontrado")) {
        res.status(404).json({ error: msg });
        return;
      }
      if (msg.includes("no disponibles")) {
        res.status(409).json({ error: msg });
        return;
      }
      res.status(400).json({ error: msg });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const sid = req.query.servicioId as string | undefined;
    const servicioId = sid ? Number(sid) : undefined;
    const list = await this.reservas.listar(
      servicioId !== undefined && !Number.isNaN(servicioId)
        ? servicioId
        : undefined
    );
    res.json(list);
  };
}
