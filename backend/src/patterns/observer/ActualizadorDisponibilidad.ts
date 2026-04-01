import type { ReservaEntity } from "../../domain/reserva.entity.js";
import type { Observer } from "./Observer.js";

/** Marca lógica de disponibilidad; las reservas y bloqueos ya están en BD */
export class ActualizadorDisponibilidad implements Observer {
  constructor(private readonly log = console) {}

  async actualizar(reserva: ReservaEntity): Promise<void> {
    this.log.log(
      `[ActualizadorDisponibilidad] Reserva #${reserva.id} servicio=${reserva.servicioId} — disponibilidad coherente con BD`
    );
  }
}
