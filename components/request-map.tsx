"use client";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

export type MapPoint = { key: string; lat: number; lng: number; label: string; radius: number; color: string };

// ponytail: public OSM tiles, fine for a pilot (tile policy: attribution, modest traffic).
// Switch to a tile provider or self-hosted tiles before heavy production use.
// Leaflet touches `window`, so load this via components/map.tsx (dynamic, ssr: false).
export default function RequestMap({ points, center, zoom }: { points: MapPoint[]; center: [number, number]; zoom: number }) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="z-0 h-full w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker key={p.key} center={[p.lat, p.lng]} radius={p.radius} pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: 0.55, weight: 1.5 }}>
          <Tooltip>{p.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
