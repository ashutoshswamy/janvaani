"use client";
import Link from "next/link";
import { Inbox, Sparkle, AlertTriangle, CheckCircle2, Timer, Flame } from "lucide-react";
import { areaLabel } from "@/lib/area";
import { isDemoRequest, type Req } from "@/lib/mock-data";
import { useAuth } from "@/components/auth";
import { useAreaRequests } from "@/components/data";
import { DistrictHeatmap } from "@/components/map";
import { Card, CategoryIcon, InfoBox, PageTitle, Spinner } from "@/components/ui";
import { CategoryBar, LanguageDonut, TrendLine } from "@/components/charts";

const DAY = 86_400_000;

const countBy = (rows: Req[], key: (r: Req) => string) =>
  Object.entries(rows.reduce<Record<string, number>>((m, r) => ({ ...m, [key(r)]: (m[key(r)] ?? 0) + 1 }), {}))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

function stats(rows: Req[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  // Response time = submission → first official status change.
  const responses = rows.flatMap((r) => (r.timeline?.[1] ? [(Date.parse(r.timeline[1].date) - Date.parse(r.date)) / DAY] : []));
  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * DAY).toISOString().slice(0, 10);
    return { day: d.slice(5), requests: rows.filter((r) => r.date.slice(0, 10) === d).length };
  });
  const hotspots = Object.values(
    rows.reduce<Record<string, { district: string; category: Req["category"]; n: number; urgency: number }>>((m, r) => {
      const k = `${r.district}|${r.category}`;
      m[k] ??= { district: r.district, category: r.category, n: 0, urgency: 0 };
      m[k].n++;
      m[k].urgency += r.urgency;
      return m;
    }, {}),
  )
    .map((h) => ({ ...h, urgency: h.urgency / h.n, weight: h.n * (h.urgency / h.n) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  return {
    total: rows.length,
    newToday: rows.filter((r) => r.date >= today).length,
    critical: rows.filter((r) => r.urgency >= 5 && r.status !== "Resolved").length,
    resolvedMonth: rows.filter((r) => r.status === "Resolved" && (r.timeline?.at(-1)?.date ?? "") >= monthStart).length,
    avgResponse: responses.length ? (responses.reduce((a, b) => a + b, 0) / responses.length).toFixed(1) : null,
    trend,
    hotspots,
  };
}

export default function Overview() {
  const official = useAuth().official!; // admin layout guarantees an official
  const rows = useAreaRequests(official);
  if (!rows) return <div className="grid min-h-[50vh] place-items-center"><Spinner label="Loading live data…" /></div>;
  const s = stats(rows);

  const kpis = [
    { label: "Total Requests", value: s.total, icon: Inbox, tone: "bg-indigo-50 text-indigo-700" },
    { label: "New Today", value: s.newToday, icon: Sparkle, tone: "bg-sky-50 text-sky-700" },
    { label: "Critical Pending", value: s.critical, icon: AlertTriangle, tone: "bg-red-50 text-red-600" },
    { label: "Resolved This Month", value: s.resolvedMonth, icon: CheckCircle2, tone: "bg-green-50 text-green-700" },
    { label: "Avg Response Time", value: s.avgResponse ? `${s.avgResponse} days` : "-", icon: Timer, tone: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="fade-in space-y-6">
      <PageTitle title="Overview" sub={`${areaLabel(official)} · live`}>
        <span className="flex items-center gap-2 text-xs text-green-700"><span className="size-2 animate-pulse rounded-full bg-green-500" /> Realtime</span>
      </PageTitle>
      {rows.some(isDemoRequest) && (
        <InfoBox>
          {rows.filter(isDemoRequest).length} of these {rows.length} requests are demo data from <code>scripts/seed.mjs</code> (no real citizen behind them). Everything else is live.
        </InfoBox>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{k.label}</p>
              <k.icon className={`size-8 rounded-lg p-1.5 ${k.tone}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-indigo-950">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-indigo-950">Request map</h2>
          <DistrictHeatmap rows={rows} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-indigo-950"><Flame className="size-4 text-orange-600" /> Top Hotspots</h2>
          {!s.hotspots.length && <p className="text-sm text-slate-500">No requests yet.</p>}
          <ol className="space-y-2">
            {s.hotspots.map((h, i) => (
              <li key={h.district + h.category}>
                <Link href="/admin/requests" className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                  <span className="w-4 text-sm font-semibold text-slate-400">{i + 1}</span>
                  <CategoryIcon category={h.category} small />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{h.district} - {h.category}</p>
                    <p className="text-xs text-slate-500">{h.n} request{h.n > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-700">{h.urgency.toFixed(1)}</p>
                    <p className="text-[10px] uppercase text-slate-400">Avg urgency</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="p-5"><h2 className="mb-4 font-semibold text-indigo-950">Requests by category</h2><CategoryBar data={countBy(rows, (r) => r.category)} /></Card>
        <Card className="p-5"><h2 className="mb-4 font-semibold text-indigo-950">Requests · last 30 days</h2><TrendLine data={s.trend} /></Card>
        <Card className="p-5"><h2 className="mb-4 font-semibold text-indigo-950">Requests by language</h2><LanguageDonut data={countBy(rows, (r) => r.language)} /></Card>
      </div>
    </div>
  );
}
