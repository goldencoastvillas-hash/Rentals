import type { ReservaEntity } from "../../domain/reserva.entity.js";

export interface Observer {
  actualizar(reserva: ReservaEntity): Promise<void> | void;
}
