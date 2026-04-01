import type { EstadoReserva, Reserva } from "@prisma/client";
import { ReservaEntity } from "../domain/reserva.entity.js";
import type { ReservaManager } from "../patterns/observer/ReservaManager.js";
import type { ClienteRepository } from "../repositories/ClienteRepository.js";
import type { HistorialReservaRepository } from "../repositories/HistorialReservaRepository.js";
import type { ReservaRepository } from "../repositories/ReservaRepository.js";
import type { ServicioRepository } from "../repositories/ServicioRepository.js";
import { DisponibilidadService } from "./DisponibilidadService.js";

export interface CrearReservaInput {
  servicioId: number;
  nombre: string;
  email: string;
  telefono: string;
  fechaInicio: Date;
  fechaFin: Date;
}

export class ReservaService {
  constructor(
    private readonly reservaRepo: ReservaRepository,
    private readonly clientes: ClienteRepository,
    private readonly servicios: ServicioRepository,
    private readonly historial: HistorialReservaRepository,
    private readonly disponibilidad: DisponibilidadService,
    private readonly reservaManager: ReservaManager
  ) {}

  async crearReserva(input: CrearReservaInput): Promise<Reserva> {
    const servicio = await this.servicios.findById(input.servicioId);
    if (!servicio) throw new Error("Servicio no encontrado");

    const disponible = await this.disponibilidad.verificarDisponibilidad(
      input.servicioId,
      input.fechaInicio,
      input.fechaFin
    );
    if (!disponible) {
      throw new Error("Fechas no disponibles o solapan con otra reserva");
    }

    let cliente = await this.clientes.findByEmail(input.email);
    if (!cliente) {
      cliente = await this.clientes.create({
        nombre: input.nombre,
        email: input.email,
        telefono: input.telefono,
      });
    }

    const created = await this.reservaRepo.create({
      cliente: { connect: { id: cliente.id } },
      servicio: { connect: { id: input.servicioId } },
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
      estado: "CONFIRMADA",
    });

    await this.historial.append(created.id, created.estado as EstadoReserva);

    const entity = ReservaEntity.fromPrisma(created);
    await this.reservaManager.notificar(entity);

    return created;
  }

  async listar(servicioId?: number) {
    return this.reservaRepo.findMany(
      servicioId !== undefined ? { servicioId } : undefined
    );
  }

  /** Persiste estado previo en historial (Memento) y actualiza */
  async cambiarEstado(
    reservaId: number,
    nuevoEstado: EstadoReserva
  ): Promise<Reserva> {
    const actual = await this.reservaRepo.findById(reservaId);
    if (!actual) throw new Error("Reserva no encontrada");

    await this.historial.append(reservaId, actual.estado as EstadoReserva);
    const updated = await this.reservaRepo.updateEstado(reservaId, nuevoEstado);
    await this.reservaManager.notificar(ReservaEntity.fromPrisma(updated));
    return updated;
  }
}
