"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Languages, Send } from "lucide-react";
import { CATEGORIES, INDIA_DISTRICTS, STATES, type Category, type Req, isDemoAnnouncement, isDemoRequest } from "@/lib/mock-data";
import { areaLabel } from "@/lib/area";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { useAnnouncements, useAreaRequests } from "@/components/data";
import { AnnouncementCard } from "@/components/announcement-card";
import { btn, Card, cx, InfoBox, input, PageTitle, Spinner } from "@/components/ui";
import { toast } from "@/components/toast";

const chip = (on: boolean) => cx("rounded-full border px-3 py-1 text-xs font-medium transition", on ? "border-indigo-950 bg-indigo-950 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400");
const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
type Translations = Record<string, { title: string; body: string }>;

async function api(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function Announcements() {
  const official = useAuth().official!; // admin layout guarantees an official
  const list = useAnnouncements(true);
  const area = useAreaRequests(official);
  const linkParam = useSearchParams().get("link");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<Category>("Water");
  const [state, setState] = useState(official.state ?? "Maharashtra");
  const [districts, setDistricts] = useState<string[]>(official.district ? [official.district] : []);
  const [place, setPlace] = useState("");
  const [linked, setLinked] = useState<string[]>(linkParam ? linkParam.split(",") : []);
  const [busy, setBusy] = useState<"draft" | "translate" | "publish">();
  const [translations, setTranslations] = useState<Translations>();
  const [tab, setTab] = useState("English");

  // Linkable requests: open requests in the chosen state/districts, grouped like the inbox clusters.
  const groups = useMemo(() => {
    const m = new Map<string, Req[]>();
    (area ?? [])
      .filter((r) => r.status !== "Resolved" && r.state === state && (!districts.length || districts.includes(r.district)))
      .forEach((r) => m.set(`${r.category} in ${r.district}`, [...(m.get(`${r.category} in ${r.district}`) ?? []), r]));
    return [...m].sort((a, b) => b[1].length - a[1].length);
  }, [area, state, districts]);
  const linkedReqs = (area ?? []).filter((r) => linked.includes(r.id));
  const citizens = new Set(linkedReqs.map((r) => r.uid).filter((u) => u !== "seed")).size;

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(undefined);
    }
  };

  const draft = () =>
    run("draft", async () => {
      const r = await api("/api/assist", { task: "draft", summaries: linkedReqs.map((x) => x.summary.en), area: [districts.join(", ") || "All districts", state].join(", "), notes });
      setTitle(r.title);
      setBody(r.body);
      setTranslations(undefined);
      setTab("English");
    });

  const translate = () =>
    run("translate", async () => {
      setTranslations(await api("/api/assist", { task: "translate", title, body }));
      setTab("Hindi");
    });

  const publish = () =>
    run("publish", async () => {
      if (!title.trim() || !body.trim()) throw new Error("Add a title and body first");
      const r = await api("/api/announcements", {
        title, category, state, districts, place, linkedRequestIds: linked,
        body: { en: body, hi: translations?.Hindi?.body, mr: translations?.Marathi?.body },
        titleLocal: { hi: translations?.Hindi?.title, mr: translations?.Marathi?.title },
      });
      toast(`Published. ${r.citizens} citizen${r.citizens === 1 ? "" : "s"} with linked requests + area subscribers will be notified.`);
      setTitle(""); setBody(""); setNotes(""); setPlace(""); setLinked([]); setTranslations(undefined); setTab("English");
    });

  const mine = official.role === "superadmin" ? list : list?.filter((a) => a.state === official.state);

  return (
    <div className="fade-in">
      <PageTitle title="Announcements" sub={`Close the loop - tell citizens what action was taken · ${areaLabel(official)}`} />
      {(mine?.some(isDemoAnnouncement) || area?.some(isDemoRequest)) && (
        <InfoBox className="mb-6">
          Announcements tagged Demo and requests with no real citizen come from <code>scripts/seed.mjs</code>. Linking demo requests notifies nobody.
        </InfoBox>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
        <section className="order-2 xl:order-1">
          <h2 className="mb-3 font-semibold text-indigo-950">Published ({mine?.length ?? "…"})</h2>
          {!mine ? (
            <Card className="grid place-items-center p-16"><Spinner /></Card>
          ) : !mine.length ? (
            <Card className="p-16 text-center text-slate-500">Nothing published yet.</Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">{mine.map((a) => <AnnouncementCard key={a.id} a={a} />)}</div>
          )}
        </section>

        <Card className="order-1 h-fit space-y-4 p-5 xl:sticky xl:top-24 xl:order-2">
          <h2 className="font-semibold text-indigo-950">New Announcement</h2>

          <label className="block text-sm font-medium">
            State / UT
            <select value={state} disabled={!!official.state} onChange={(e) => { setState(e.target.value); setDistricts([]); setLinked([]); }} className={cx(input, "mt-1.5")}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>

          <fieldset disabled={!!official.district}>
            <legend className="mb-2 flex w-full justify-between text-sm font-medium">
              Districts <span className="font-normal text-slate-500">{districts.length ? `${districts.length} selected` : "All districts"}</span>
            </legend>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {INDIA_DISTRICTS[state].map((d) => <button key={d} type="button" aria-pressed={districts.includes(d)} onClick={() => setDistricts(toggle(districts, d))} className={chip(districts.includes(d))}>{d}</button>)}
            </div>
          </fieldset>

          <label className="block text-sm font-medium">
            City / Village <span className="font-normal text-slate-500">(optional)</span>
            <input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={100} placeholder="e.g. Dharur" className={cx(input, "mt-1.5")} />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Link requests <span className="font-normal text-slate-500">({linked.length} selected)</span></legend>
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {!area ? <Spinner /> : !groups.length && <p className="text-sm text-slate-500">No open requests in this area.</p>}
              {groups.map(([label, rs]) => {
                const ids = rs.map((r) => r.id);
                const all = ids.every((id) => linked.includes(id));
                return (
                  <label key={label} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={all} onChange={() => setLinked(all ? linked.filter((id) => !ids.includes(id)) : [...new Set([...linked, ...ids])])} className="accent-orange-500" />
                    <span className="flex-1">{label}</span>
                    <span className="text-xs text-slate-500">{rs.length}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="block text-sm font-medium">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={cx(input, "mt-1.5")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} placeholder="Action taken (for the AI draft): what, where, when…" className={input} />
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Title" className={input} />

          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <button onClick={draft} disabled={!!busy || !linked.length} title={linked.length ? "" : "Link requests first"} className={cx(btn.outline, "px-3 py-1.5 text-xs")}>
                {busy === "draft" ? <Spinner label="Drafting…" /> : <><Sparkles className="size-3.5 text-orange-600" /> Draft with AI</>}
              </button>
              <button onClick={translate} disabled={!!busy || !body || !title} className={cx(btn.outline, "px-3 py-1.5 text-xs")}>
                {busy === "translate" ? <Spinner label="Translating…" /> : <><Languages className="size-3.5 text-orange-600" /> Translate to all languages</>}
              </button>
            </div>
            {translations && (
              <div className="mb-2 flex gap-1 border-b border-slate-200 text-sm" role="tablist">
                {["English", ...Object.keys(translations)].map((l) => (
                  <button key={l} role="tab" aria-selected={tab === l} onClick={() => setTab(l)} className={cx("-mb-px border-b-2 px-3 py-1.5", tab === l ? "border-orange-500 font-medium text-indigo-950" : "border-transparent text-slate-500")}>{l}</button>
                ))}
              </div>
            )}
            {tab === "English" || !translations ? (
              <textarea value={body} onChange={(e) => { setBody(e.target.value); setTranslations(undefined); }} rows={6} maxLength={5000} placeholder="What action was taken, where, and when?" className={cx(input, busy === "draft" && "animate-pulse")} />
            ) : (
              <div className="fade-in min-h-36 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed">
                <p className="font-semibold">{translations[tab].title}</p>
                <p className="mt-2">{translations[tab].body}</p>
              </div>
            )}
          </div>

          <button onClick={publish} disabled={!!busy} className={cx(btn.accent, "w-full")}>
            {busy === "publish" ? <Spinner label="Publishing…" className="text-indigo-950" /> : <><Send className="size-4" /> Publish · notify {citizens} citizen{citizens === 1 ? "" : "s"} + subscribers</>}
          </button>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense><Announcements /></Suspense>;
}
