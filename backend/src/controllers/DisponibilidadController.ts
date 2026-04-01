import type { Request, Response } from "express";
import type { DisponibilidadApiService } from "../services/DisponibilidadApiService.js";

export class DisponibilidadController {
  constructor(private readonly api: DisponibilidadApiService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      res.status(400).json({ error: "Query from y to requeridos (YYYY-MM-DD)" });
      return;
    }
    const desde = new Date(from + "T00:00:00.000Z");
    const hasta = new Date(to + "T00:00:00.000Z");
    const rangos = await this.api.obtenerRangos(id, desde, hasta);
    res.json({ servicioId: id, desde: from, hasta: to, rangos });
  };
}
