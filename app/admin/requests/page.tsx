"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Layers, List, SearchX } from "lucide-react";
import { CATEGORIES, INDIA_DISTRICTS, STATES, STATUSES, isDemoRequest, type Req } from "@/lib/mock-data";
import { areaLabel } from "@/lib/area";
import { useAuth } from "@/components/auth";
import { useAreaRequests } from "@/components/data";
import { StatusBadge, UrgencyBadge } from "@/components/badges";
import { Card, CategoryIcon, cx, InfoBox, input, PageTitle, Spinner, urgencyLabel } from "@/components/ui";

type FilterKey = "state" | "district" | "category" | "urgency" | "status" | "language";
const fieldOf = (r: Req, k: FilterKey) => (k === "urgency" ? urgencyLabel(r.urgency) : r[k]);

function Table({ rows, fresh }: { rows: Req[]; fresh: Set<string> }) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>{["ID", "Summary (English)", "Language", "Category", "Location", "Urgency", "Status", "Date"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} onClick={() => router.push(`/admin/requests/${r.id}`)} className={cx("cursor-pointer transition-colors duration-1000 hover:bg-indigo-50/50", fresh.has(r.id) && "bg-orange-50")}>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-indigo-700">{r.id}{fresh.has(r.id) && <span className="ml-2 rounded bg-orange-500 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-indigo-950">NEW</span>}</td>
              <td className="max-w-xs px-4 py-3"><p className="line-clamp-2">{r.summary.en}</p></td>
              <td className="px-4 py-3 text-slate-600">{r.language}</td>
              <td className="px-4 py-3"><span className="flex items-center gap-2"><CategoryIcon category={r.category} small />{r.category}</span></td>
              <td className="px-4 py-3"><p className="whitespace-nowrap">{[r.place, r.district].filter(Boolean).join(", ")}</p><p className="text-xs text-slate-500">{r.state}</p></td>
              <td className="px-4 py-3"><UrgencyBadge level={r.urgency} /></td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminRequests() {
  const official = useAuth().official!; // admin layout guarantees an official
  const all = useAreaRequests(official);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [clustered, setClustered] = useState(false);

  // Live inbox: highlight requests that arrive while the page is open.
  const seen = useRef<Set<string>>(null);
  const [fresh, setFresh] = useState(new Set<string>());
  useEffect(() => {
    if (!all) return;
    if (!seen.current) {
      seen.current = new Set(all.map((r) => r.id));
      return;
    }
    const added = all.filter((r) => !seen.current!.has(r.id)).map((r) => r.id);
    if (!added.length) return;
    added.forEach((id) => seen.current!.add(id));
    setFresh((f) => new Set([...f, ...added]));
    const t = setTimeout(() => setFresh((f) => new Set([...f].filter((id) => !added.includes(id)))), 15000);
    return () => clearTimeout(t);
  }, [all]);

  const languages = useMemo(() => [...new Set((all ?? []).map((r) => r.language))].sort(), [all]);
  const filterDefs: { key: FilterKey; label: string; options: readonly string[] }[] = [
    { key: "state", label: "State", options: STATES },
    { key: "district", label: "District", options: INDIA_DISTRICTS[filters.state ?? ""] ?? [] },
    { key: "category", label: "Category", options: CATEGORIES },
    { key: "urgency", label: "Urgency", options: ["Critical", "High", "Medium", "Low"] },
    { key: "status", label: "Status", options: STATUSES },
    { key: "language", label: "Language", options: languages },
  ];

  const rows = useMemo(
    () =>
      (all ?? []).filter(
        (r) =>
          filterDefs.every(({ key }) => !filters[key] || fieldOf(r, key) === filters[key]) &&
          `${r.id} ${r.summary.en} ${r.text} ${r.place} ${r.district}`.toLowerCase().includes(q.toLowerCase()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterDefs derives from filters/languages
    [all, q, filters],
  );

  // Auto-clusters: same district + category.
  const groups = useMemo(() => {
    const m = new Map<string, Req[]>();
    rows.forEach((r) => m.set(`${r.category}|${r.district}|${r.state}`, [...(m.get(`${r.category}|${r.district}|${r.state}`) ?? []), r]));
    return [...m.values()].sort((a, b) => b.length - a.length);
  }, [rows]);

  if (!all) return <div className="grid min-h-[50vh] place-items-center"><Spinner label="Loading live inbox…" /></div>;

  const views = [
    { label: "Individual", icon: List, value: false },
    { label: "Clustered", icon: Layers, value: true },
  ];

  return (
    <div className="fade-in">
      <PageTitle title="Requests" sub={`${rows.length} shown · area: ${areaLabel(official)} · updates live`}>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
          {views.map((v) => (
            <button key={v.label} onClick={() => setClustered(v.value)} className={cx("flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition", clustered === v.value ? "bg-indigo-950 text-white" : "text-slate-600")}>
              <v.icon className="size-4" /> {v.label}
            </button>
          ))}
        </div>
      </PageTitle>
      {all.some(isDemoRequest) && (
        <InfoBox className="mb-4">
          {all.filter(isDemoRequest).length} of these {all.length} requests are demo data from <code>scripts/seed.mjs</code> (no real citizen behind them). Everything else is live.
        </InfoBox>
      )}

      <Card className="mb-4 flex flex-wrap gap-3 p-3">
        <label className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search summary, original text, ID…" className={cx(input, "pl-9")} />
        </label>
        {filterDefs.map((f) => (
          <select
            key={f.key}
            value={filters[f.key] ?? ""}
            disabled={!f.options.length}
            onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value || undefined, ...(f.key === "state" && { district: undefined }) })}
            className={cx(input, "w-auto max-w-52")}
            aria-label={f.label}
          >
            <option value="">{f.key === "district" && !filters.state ? "Pick a state first" : `All ${f.label.toLowerCase()}`}</option>
            {f.options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        {(q || Object.values(filters).some(Boolean)) && (
          <button onClick={() => { setQ(""); setFilters({}); }} className="px-2 text-sm font-medium text-orange-700 hover:underline">Clear</button>
        )}
      </Card>

      {!rows.length ? (
        <Card className="grid place-items-center p-16 text-center text-slate-500">
          <SearchX className="mb-2 size-8 text-slate-300" /> {all.length ? "No requests match these filters." : "No requests in your area yet. New ones appear here instantly."}
        </Card>
      ) : clustered ? (
        <div className="space-y-3">
          {groups.map((g, i) => (
            <details key={g[0].category + g[0].district + g[0].state} open={i === 0} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-slate-50">
                <ChevronRight className="size-4 text-slate-400 transition group-open:rotate-90" />
                <CategoryIcon category={g[0].category} small />
                <div className="flex-1">
                  <p className="font-semibold text-indigo-950">{g[0].category} issues in {g[0].district} - {g.length} request{g.length > 1 ? "s" : ""}</p>
                  <p className="text-xs text-slate-500">{g[0].state} · avg urgency {(g.reduce((a, r) => a + r.urgency, 0) / g.length).toFixed(1)}</p>
                </div>
              </summary>
              <div className="border-t border-slate-100"><Table rows={g} fresh={fresh} /></div>
            </details>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden"><Table rows={rows} fresh={fresh} /></Card>
      )}
    </div>
  );
}
