export type TipoServicio = "CASA" | "CARRO";

export interface Servicio {
  id: number;
  tipo: TipoServicio;
  nombre: string;
  descripcion: string;
  precio: string | number;
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
}
