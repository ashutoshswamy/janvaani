"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Building2, MapPin, Megaphone, RotateCcw, MessageSquare, Bot, Send } from "lucide-react";
import { isDemoRequest, type Category, type Req } from "@/lib/mock-data";
import { areaLabel } from "@/lib/area";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { useAreaRequests } from "@/components/data";
import { btn, Card, CategoryIcon, cx, InfoBox, input, PageTitle, Spinner } from "@/components/ui";
import { toast } from "@/components/toast";

const DAY = 86_400_000;
const FACTORS = ["Demand", "Urgency", "Backlog", "Waiting time"] as const;
const FACTOR_HELP = ["Requests vs. the busiest group", "Average AI urgency (1-5)", "Share still unresolved", "Average days open (capped at 30)"];
const FACTOR_COLORS = ["bg-indigo-900", "bg-orange-500", "bg-rose-500", "bg-sky-500"];
type Weights = [number, number, number, number];
const DEFAULT_WEIGHTS: Weights = [35, 30, 20, 15];
const SUGGESTIONS = ["Which district needs water intervention most urgently?", "Which categories have the most unresolved critical requests?", "Which department has the biggest backlog?"];

async function assist<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "AI request failed");
  return data;
}

/** District × category groups scored 0-100 on each factor, from live requests. */
function rank(rows: Req[], w: Weights) {
  const groups = new Map<string, Req[]>();
  rows.forEach((r) => groups.set(`${r.district}|${r.category}`, [...(groups.get(`${r.district}|${r.category}`) ?? []), r]));
  const maxN = Math.max(1, ...[...groups.values()].map((g) => g.length));
  const total = w.reduce((a, b) => a + b, 0) || 1;
  return [...groups.values()]
    .map((g) => {
      const open = g.filter((r) => r.status !== "Resolved");
      const factors = [
        (g.length / maxN) * 100,
        ((g.reduce((a, r) => a + r.urgency, 0) / g.length - 1) / 4) * 100,
        (open.length / g.length) * 100,
        open.length ? (Math.min(30, open.reduce((a, r) => a + (Date.now() - Date.parse(r.date)) / DAY, 0) / open.length) / 30) * 100 : 0,
      ];
      const parts = factors.map((f, i) => (f * w[i]) / total);
      return { district: g[0].district, category: g[0].category, requests: g.length, open: open.length, parts, score: Math.round(parts.reduce((a, b) => a + b, 0)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

type Project = { title: string; district: string; department: string; category: Category; reasoning: string; requestIds: string[] };

function Recommendations({ empty }: { empty: boolean }) {
  const [projects, setProjects] = useState<Project[]>();
  const [busy, setBusy] = useState(false);
  const generate = async () => {
    setBusy(true);
    try {
      setProjects((await assist<{ projects: Project[] }>({ task: "recommend" })).projects);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-indigo-950"><Sparkles className="size-4 text-orange-600" /> Recommended projects</h2>
        <button onClick={generate} disabled={busy || empty} className={cx(btn.outline, "ml-auto px-3 py-1.5 text-xs")}>
          {busy ? <Spinner label="Analysing requests…" /> : <><Sparkles className="size-3.5 text-orange-600" /> {projects ? "Regenerate" : "Generate with AI"}</>}
        </button>
      </div>
      {!projects ? (
        <Card className="p-10 text-center text-sm text-slate-500">{empty ? "No requests in your area yet." : "Gemini reads your area's open requests and proposes projects that resolve the most urgent, widespread problems."}</Card>
      ) : !projects.length ? (
        <Card className="p-10 text-center text-sm text-slate-500">No clear projects found in the current requests.</Card>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <Card key={p.title} className="p-5">
              <div className="flex items-start gap-3">
                <CategoryIcon category={p.category} />
                <div className="flex-1">
                  <h3 className="font-semibold text-indigo-950">{p.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5"><MapPin className="size-4 text-slate-400" />{p.district}</span>
                    <span className="flex items-center gap-1.5"><Building2 className="size-4 text-slate-400" />{p.department}</span>
                  </div>
                </div>
                <span className="rounded-lg bg-orange-50 px-2 py-1 text-sm font-bold text-orange-700">{p.requestIds.length} req.</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.reasoning}</p>
              <Link href={`/admin/announcements?link=${encodeURIComponent(p.requestIds.join(","))}`} className={cx(btn.accent, "mt-4")}><Megaphone className="size-4" /> Create Announcement</Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

type Msg = { role: "user" | "ai"; text: string };

function AskTheData() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [typing, setTyping] = useState(false);

  const ask = async (question: string) => {
    if (!question.trim() || typing) return;
    setQ("");
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setTyping(true);
    try {
      const { answer } = await assist<{ answer: string }>({ task: "ask", question });
      setMsgs((m) => [...m, { role: "ai", text: answer }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "ai", text: `Sorry, that failed: ${(e as Error).message}` }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <Card className="flex h-full min-h-[28rem] flex-col">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <MessageSquare className="size-4 text-orange-600" /><h2 className="font-semibold text-indigo-950">Ask the data</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {!msgs.length && <p className="py-8 text-center text-sm text-slate-500">Ask about requests, districts or departments in your area.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={cx("fade-in max-w-[90%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm", m.role === "user" ? "ml-auto bg-indigo-950 text-white" : "bg-slate-100")}>
            {m.role === "ai" && <Bot className="mb-1 size-4 text-orange-600" />}
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="flex w-fit gap-1 rounded-2xl bg-slate-100 px-4 py-3" aria-label="AI is typing">
            {[0, 150, 300].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />)}
          </div>
        )}
      </div>
      <div className="space-y-2 border-t border-slate-100 p-4">
        {!msgs.length && SUGGESTIONS.map((s) => (
          <button key={s} disabled={typing} onClick={() => ask(s)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 disabled:opacity-50">{s}</button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder="Ask a question…" aria-label="Question" className={input} />
          <button disabled={typing || !q.trim()} className={cx(btn.primary, "shrink-0")} aria-label="Ask"><Send className="size-4" /></button>
        </form>
      </div>
    </Card>
  );
}

export default function AIInsights() {
  const official = useAuth().official!; // admin layout guarantees an official
  const rows = useAreaRequests(official);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const ranked = useMemo(() => rank(rows ?? [], weights), [rows, weights]);

  if (!rows) return <div className="grid min-h-[50vh] place-items-center"><Spinner label="Loading live data…" /></div>;

  return (
    <div className="fade-in space-y-6">
      <PageTitle title="AI Decision Assistant" sub={`${areaLabel(official)} · transparent, adjustable prioritisation from live requests`} />
      {rows.some(isDemoRequest) && (
        <InfoBox>
          Rankings and AI answers include {rows.filter(isDemoRequest).length} demo requests from <code>scripts/seed.mjs</code>. Treat results as illustrative until they are replaced by real requests.
        </InfoBox>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-indigo-950">Priority ranking · District × Category</h2>
            <div className="ml-auto flex flex-wrap gap-3 text-xs text-slate-500">
              {FACTORS.map((f, i) => <span key={f} className="flex items-center gap-1.5"><span className={cx("size-2.5 rounded-sm", FACTOR_COLORS[i])} />{f}</span>)}
            </div>
          </div>
          {!ranked.length && <p className="p-10 text-center text-sm text-slate-500">No requests in your area yet.</p>}
          <ol className="divide-y divide-slate-100">
            {ranked.map((r, i) => (
              <li key={r.district + r.category} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-5">
                <span className="w-5 text-sm font-semibold text-slate-400">{i + 1}</span>
                <CategoryIcon category={r.category} small />
                <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
                  <p className="text-sm font-medium">{r.district} · {r.category}</p>
                  <p className="text-xs text-slate-500">{r.requests} request{r.requests > 1 ? "s" : ""} · {r.open} open</p>
                </div>
                {/* Phones: the factor bar drops to its own full-width line under the label. */}
                <div className="order-last flex h-3 basis-full overflow-hidden rounded-full bg-slate-100 sm:order-none sm:flex-1 sm:basis-auto" title={FACTORS.map((f, j) => `${f}: ${r.parts[j].toFixed(1)}`).join(" · ")}>
                  {r.parts.map((p, j) => <span key={j} className={cx("h-full transition-all duration-500", FACTOR_COLORS[j])} style={{ width: `${p}%` }} />)}
                </div>
                <span className="w-10 text-right text-lg font-bold text-indigo-950">{r.score}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="h-fit p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-indigo-950">Factor weights</h2>
            <button onClick={() => setWeights(DEFAULT_WEIGHTS)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-950"><RotateCcw className="size-3" /> Reset</button>
          </div>
          <div className="space-y-5">
            {FACTORS.map((f, i) => (
              <label key={f} className="block text-sm">
                <span className="flex justify-between"><span className="flex items-center gap-1.5"><span className={cx("size-2.5 rounded-sm", FACTOR_COLORS[i])} />{f}</span><span className="font-mono text-slate-500">{weights[i]}</span></span>
                <span className="text-xs text-slate-500">{FACTOR_HELP[i]}</span>
                <input
                  type="range" min={0} max={100} value={weights[i]}
                  onChange={(e) => setWeights((w) => w.map((v, j) => (j === i ? +e.target.value : v)) as Weights)}
                  className="mt-2 w-full accent-orange-500"
                />
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Recommendations empty={!rows.length} />
        <AskTheData />
      </div>
    </div>
  );
}
