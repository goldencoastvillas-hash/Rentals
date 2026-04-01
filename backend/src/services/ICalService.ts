import type { OrigenBloqueo } from "@prisma/client";
import * as ical from "node-ical";
import type { BloqueoCalendarioRepository } from "../repositories/BloqueoCalendarioRepository.js";
import type { ServicioRepository } from "../repositories/ServicioRepository.js";

export class ICalService {
  constructor(
    private readonly servicios: ServicioRepository,
    private readonly bloqueos: BloqueoCalendarioRepository
  ) {}

  async importarDesdeUrl(
    servicioId: number,
    url: string,
    origen: OrigenBloqueo = "ICAL_OTRO"
  ): Promise<number> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo descargar iCal: ${res.status}`);
    const text = await res.text();
    return this.importarDesdeTexto(servicioId, text, origen);
  }

  /** Usa URL guardada en servicio.icalImportUrl */
  async importarServicioConfigurado(
    servicioId: number,
    origen: OrigenBloqueo = "ICAL_OTRO"
  ): Promise<number> {
    const s = await this.servicios.findById(servicioId);
    if (!s?.icalImportUrl) throw new Error("Servicio sin icalImportUrl");
    return this.importarDesdeUrl(servicioId, s.icalImportUrl, origen);
  }

  private async importarDesdeTexto(
    servicioId: number,
    ics: string,
    origen: OrigenBloqueo
  ): Promise<number> {
    const data = ical.parseICS(ics);
    const bloques: { inicio: Date; fin: Date; origen: OrigenBloqueo }[] = [];

    for (const k of Object.keys(data)) {
      const ev = data[k];
      if (!ev || typeof ev !== "object") continue;
      if (ev.type !== "VEVENT" || !("start" in ev) || !("end" in ev)) continue;
      const start = (ev as { start: Date }).start;
      const end = (ev as { end: Date }).end;
      if (!start || !end) continue;
      const inicio = new Date(start);
      const fin = new Date(end);
      if (inicio < fin) bloques.push({ inicio, fin, origen });
    }

    await this.bloqueos.replaceFromIcal(servicioId, bloques);
    return bloques.length;
  }
}
