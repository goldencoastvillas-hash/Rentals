import type { ReservaEntity } from "../../domain/reserva.entity.js";
import type { Observer } from "./Observer.js";

export class NotificacionCliente implements Observer {
  constructor(private readonly log = console) {}

  async actualizar(reserva: ReservaEntity): Promise<void> {
    this.log.log(
      `[NotificacionCliente] Reserva #${reserva.id} estado=${reserva.estado} — confirmación al cliente (stub email)`
    );
  }
}
