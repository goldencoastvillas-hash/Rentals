import type { EstadoReserva } from "@prisma/client";
import { Memento } from "./Memento.js";

/** Caretaker en memoria (tests / utilidad); persistencia vía HistorialReservaRepository */
export class HistorialReservaStack {
  private readonly stack: Memento[] = [];

  guardar(m: Memento): void {
    this.stack.push(m);
  }

  obtener(): Memento | undefined {
    return this.stack.pop();
  }

  peek(): Memento | undefined {
    return this.stack[this.stack.length - 1];
  }
}

export function estadoToMemento(estado: EstadoReserva): Memento {
  return new Memento(estado);
}
