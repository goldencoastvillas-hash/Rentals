import type { ReservaEntity } from "../../domain/reserva.entity.js";
import type { Observer } from "./Observer.js";

export class ReservaManager {
  private readonly observers: Observer[] = [];

  agregarObserver(o: Observer): void {
    this.observers.push(o);
  }

  async notificar(reserva: ReservaEntity): Promise<void> {
    for (const o of this.observers) {
      await o.actualizar(reserva);
    }
  }
}
