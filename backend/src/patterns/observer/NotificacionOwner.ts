import type { ReservaEntity } from "../../domain/reserva.entity.js";
import type { Observer } from "./Observer.js";

/** Sin tabla de dueño en v1: notifica email de soporte / admin */
export class NotificacionOwner implements Observer {
  constructor(
    private readonly supportEmail: string,
    private readonly log = console
  ) {}

  async actualizar(reserva: ReservaEntity): Promise<void> {
    this.log.log(
      `[NotificacionOwner] Reserva #${reserva.id} — aviso a soporte/dueño: ${this.supportEmail} (stub)`
    );
  }
}
