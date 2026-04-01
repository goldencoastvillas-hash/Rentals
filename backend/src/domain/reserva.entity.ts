import type { EstadoReserva } from "@prisma/client";
import { Memento } from "../patterns/memento/Memento.js";

/** Entidad de dominio para Reserva con patrón Memento */
export class ReservaEntity {
  constructor(
    public id: number,
    public clienteId: number,
    public servicioId: number,
    public fechaInicio: Date,
    public fechaFin: Date,
    public estado: EstadoReserva
  ) {}

  guardarEstado(): Memento {
    return new Memento(this.estado);
  }

  restaurarEstado(m: Memento): void {
    this.estado = m.getEstado() as EstadoReserva;
  }

  static fromPrisma(row: {
    id: number;
    clienteId: number;
    servicioId: number;
    fechaInicio: Date;
    fechaFin: Date;
    estado: EstadoReserva;
  }): ReservaEntity {
    return new ReservaEntity(
      row.id,
      row.clienteId,
      row.servicioId,
      row.fechaInicio,
      row.fechaFin,
      row.estado
    );
  }
}
