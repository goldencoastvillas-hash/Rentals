import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { Servicio } from "../types";

const icon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function MapView({ casas }: { casas: Servicio[] }) {
  const center: [number, number] = [25.7617, -80.1918];
  const withCoords = casas.filter(
    (c) => c.lat != null && c.lng != null
  ) as (Servicio & { lat: number; lng: number })[];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={center} zoom={11} className="h-[320px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={icon}>
            <Popup>
              <strong>{c.nombre}</strong>
              <br />
              {c.ubicacion}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
