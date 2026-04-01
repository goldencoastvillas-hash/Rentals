import type { Request, Response } from "express";
import { TipoServicio } from "@prisma/client";
import { z } from "zod";
import type { ServicioService } from "../services/ServicioService.js";

const crearSchema = z.object({
  tipo: z.nativeEnum(TipoServicio),
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  precio: z.number().positive(),
  ubicacion: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  habitaciones: z.number().int().optional().nullable(),
  banos: z.number().int().optional().nullable(),
  aireAcondicionado: z.boolean().optional().nullable(),
  petFriendly: z.boolean().optional().nullable(),
  piscina: z.boolean().optional().nullable(),
  lavadora: z.boolean().optional().nullable(),
  parking: z.boolean().optional().nullable(),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  anio: z.number().int().optional().nullable(),
  icalImportUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
});

export class ServicioController {
  constructor(private readonly servicios: ServicioService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const tipo = req.query.tipo as string | undefined;
    const t =
      tipo === "CASA" || tipo === "CARRO" ? (tipo as TipoServicio) : undefined;
    const list = await this.servicios.listar(t);
    res.json(list);
  };

  map = async (_req: Request, res: Response): Promise<void> => {
    const list = await this.servicios.listarParaMapa();
    res.json(list);
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const s = await this.servicios.obtener(id);
    if (!s) {
      res.status(404).json({ error: "No encontrado" });
      return;
    }
    res.json(s);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const d = parsed.data;
    const created = await this.servicios.crear({
      ...d,
      icalImportUrl: d.icalImportUrl || null,
    });
    res.status(201).json(created);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const parsed = crearSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const updated = await this.servicios.actualizar(id, parsed.data);
      res.json(updated);
    } catch {
      res.status(404).json({ error: "No encontrado" });
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    try {
      await this.servicios.eliminar(id);
      res.status(204).send();
    } catch {
      res.status(404).json({ error: "No encontrado" });
    }
  };
}
