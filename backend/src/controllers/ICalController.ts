import type { Request, Response } from "express";
import { OrigenBloqueo } from "@prisma/client";
import { prisma } from "../config/database.js";
import { generarIcsReservas } from "../utils/icalExport.js";
import type { ICalService } from "../services/ICalService.js";

export class ICalController {
  constructor(private readonly ical: ICalService) {}

  /** GET calendario exportable para Airbnb/Booking */
  exportCal = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).send("id inválido");
      return;
    }
    const s = await prisma.servicio.findUnique({ where: { id } });
    if (!s) {
      res.status(404).send("No encontrado");
      return;
    }
    const reservas = await prisma.reserva.findMany({
      where: { servicioId: id, estado: { in: ["CONFIRMADA", "PENDIENTE"] } },
    });
    const body = generarIcsReservas(s.nombre, reservas);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="servicio-${id}.ics"`
    );
    res.send(body);
  };

  /** POST admin: importar desde URL en body o desde icalImportUrl del servicio */
  importPost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const url = req.body?.url as string | undefined;
    const origen = (req.body?.origen as string) || "ICAL_OTRO";
    const valores = Object.values(OrigenBloqueo) as string[];
    const o = valores.includes(origen)
      ? (origen as OrigenBloqueo)
      : OrigenBloqueo.ICAL_OTRO;
    try {
      let count: number;
      if (url) {
        count = await this.ical.importarDesdeUrl(id, url, o);
      } else {
        count = await this.ical.importarServicioConfigurado(id, o);
      }
      res.json({ importados: count });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      res.status(400).json({ error: msg });
    }
  };
}
