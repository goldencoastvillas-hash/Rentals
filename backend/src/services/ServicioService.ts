import type { Prisma, Servicio, TipoServicio } from "@prisma/client";
import type { ServicioRepository } from "../repositories/ServicioRepository.js";

export type CrearServicioDTO = {
  tipo: TipoServicio;
  nombre: string;
  descripcion: string;
  precio: number;
  ubicacion?: string | null;
  lat?: number | null;
  lng?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  aireAcondicionado?: boolean | null;
  petFriendly?: boolean | null;
  piscina?: boolean | null;
  lavadora?: boolean | null;
  parking?: boolean | null;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  icalImportUrl?: string | null;
};

export class ServicioService {
  constructor(private readonly repo: ServicioRepository) {}

  listar(tipo?: TipoServicio): Promise<Servicio[]> {
    return this.repo.findMany(tipo ? { tipo } : undefined);
  }

  obtener(id: number): Promise<Servicio | null> {
    return this.repo.findById(id);
  }

  async crear(data: CrearServicioDTO): Promise<Servicio> {
    return this.repo.create(this.toPrismaCreate(data));
  }

  async actualizar(id: number, data: Partial<CrearServicioDTO>): Promise<Servicio> {
    return this.repo.update(id, this.toPrismaUpdate(data));
  }

  async eliminar(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  listarParaMapa(): Promise<Servicio[]> {
    return this.repo.findCasasConCoordenadas();
  }

  private toPrismaCreate(data: CrearServicioDTO): Prisma.ServicioCreateInput {
    return {
      tipo: data.tipo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      ubicacion: data.ubicacion ?? undefined,
      lat: data.lat ?? undefined,
      lng: data.lng ?? undefined,
      habitaciones: data.habitaciones ?? undefined,
      banos: data.banos ?? undefined,
      aireAcondicionado: data.aireAcondicionado ?? undefined,
      petFriendly: data.petFriendly ?? undefined,
      piscina: data.piscina ?? undefined,
      lavadora: data.lavadora ?? undefined,
      parking: data.parking ?? undefined,
      marca: data.marca ?? undefined,
      modelo: data.modelo ?? undefined,
      anio: data.anio ?? undefined,
      icalImportUrl: data.icalImportUrl ?? undefined,
    };
  }

  private toPrismaUpdate(
    data: Partial<CrearServicioDTO>
  ): Prisma.ServicioUpdateInput {
    const u: Prisma.ServicioUpdateInput = {};
    if (data.nombre !== undefined) u.nombre = data.nombre;
    if (data.descripcion !== undefined) u.descripcion = data.descripcion;
    if (data.precio !== undefined) u.precio = data.precio;
    if (data.ubicacion !== undefined) u.ubicacion = data.ubicacion;
    if (data.lat !== undefined) u.lat = data.lat;
    if (data.lng !== undefined) u.lng = data.lng;
    if (data.habitaciones !== undefined) u.habitaciones = data.habitaciones;
    if (data.banos !== undefined) u.banos = data.banos;
    if (data.aireAcondicionado !== undefined)
      u.aireAcondicionado = data.aireAcondicionado;
    if (data.petFriendly !== undefined) u.petFriendly = data.petFriendly;
    if (data.piscina !== undefined) u.piscina = data.piscina;
    if (data.lavadora !== undefined) u.lavadora = data.lavadora;
    if (data.parking !== undefined) u.parking = data.parking;
    if (data.marca !== undefined) u.marca = data.marca;
    if (data.modelo !== undefined) u.modelo = data.modelo;
    if (data.anio !== undefined) u.anio = data.anio;
    if (data.icalImportUrl !== undefined) u.icalImportUrl = data.icalImportUrl;
    return u;
  }
}
