"use client";
import dynamic from "next/dynamic";
import type { Req } from "@/lib/mock-data";
import type { MapPoint } from "@/components/request-map";

const RequestMap = dynamic(() => import("@/components/request-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />,
});

const urgencyColor = (u: number) => (u >= 4.5 ? "#dc2626" : u >= 3.5 ? "#f97316" : u >= 2.5 ? "#f59e0b" : "#64748b");

/** One circle per district: size = request count, colour = average urgency. */
export function DistrictHeatmap({ rows }: { rows: Req[] }) {
  const groups = new Map<string, Req[]>();
  rows.filter((r) => r.lat != null && r.lng != null).forEach((r) => {
    const k = `${r.district}|${r.state}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  });
  const points: MapPoint[] = [...groups].map(([k, rs]) => {
    const avg = rs.reduce((a, r) => a + r.urgency, 0) / rs.length;
    return {
      key: k,
      lat: rs.reduce((a, r) => a + r.lat!, 0) / rs.length,
      lng: rs.reduce((a, r) => a + r.lng!, 0) / rs.length,
      radius: 6 + Math.sqrt(rs.length) * 5,
      color: urgencyColor(avg),
      label: `${rs[0].district}, ${rs[0].state}: ${rs.length} request${rs.length > 1 ? "s" : ""} · avg urgency ${avg.toFixed(1)}`,
    };
  });
  const center: [number, number] = points.length
    ? [points.reduce((a, p) => a + p.lat, 0) / points.length, points.reduce((a, p) => a + p.lng, 0) / points.length]
    : [22.5, 79]; // India
  return (
    <div>
      <div className="h-80"><RequestMap points={points} center={center} zoom={points.length ? 6 : 4} /></div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {[["Low", 1], ["Medium", 3], ["High", 4], ["Critical", 5]].map(([l, u]) => (
          <span key={l} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: urgencyColor(u as number) }} />{l}</span>
        ))}
        <span className="ml-auto">Circle size = number of requests · avg urgency colour</span>
      </div>
    </div>
  );
}

export function PinMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return (
    <div className="h-48">
      <RequestMap points={[{ key: "pin", lat, lng, label, radius: 9, color: "#4d5441" }]} center={[lat, lng]} zoom={11} />
    </div>
  );
}
