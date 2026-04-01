import type { CrearServicioDTO, ServicioService } from "../services/ServicioService.js";
import type { CrearReservaInput, ReservaService } from "../services/ReservaService.js";

/** Fachada de entrada al dominio (lista de admins en BD; no en memoria) */
export class Sistema {
  constructor(
    private readonly servicioService: ServicioService,
    private readonly reservaService: ReservaService
  ) {}

  registrarServicio(data: CrearServicioDTO) {
    return this.servicioService.crear(data);
  }

  crearReserva(input: CrearReservaInput) {
    return this.reservaService.crearReserva(input);
  }
}
