"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, User, Sparkles, Building2, Link2, Languages, MapPin } from "lucide-react";
import { isDemoRequest, STATUSES, type Req, type Status } from "@/lib/mock-data";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { useAreaRequests, useLiveDoc } from "@/components/data";
import { PinMap } from "@/components/map";
import { CategoryTag, StatusBadge, StatusTimeline, UrgencyBadge } from "@/components/badges";
import { btn, Card, CategoryIcon, cx, InfoBox, input, Spinner } from "@/components/ui";
import { toast } from "@/components/toast";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const official = useAuth().official!; // admin layout guarantees an official
  // Firestore rules only return docs inside the official's area; anything else reads as missing.
  const req = useLiveDoc<Req>(`requests/${id}`, true);
  const note = useLiveDoc<{ text: string }>(`requestNotes/${id}`);
  const area = useAreaRequests(official);
  // Local edits override the live values; until then, changes by other officials flow straight in.
  const [statusEdit, setStatus] = useState<Status>();
  const [publicNote, setPublicNote] = useState("");
  const [notesEdit, setNotes] = useState<string>();
  const [saving, setSaving] = useState(false);
  const notes = notesEdit ?? note?.text ?? "";

  if (req === undefined) return <div className="grid min-h-[50vh] place-items-center"><Spinner /></div>;
  if (!req)
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div>
          <p className="text-lg font-semibold">Request {id} not found in your area</p>
          <Link href="/admin/requests" className={cx(btn.outline, "mt-4")}>Back to requests</Link>
        </div>
      </div>
    );

  const status = statusEdit ?? req.status;
  const similar = (area ?? []).filter((r) => r.id !== req.id && r.category === req.category && r.district === req.district);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
      body: JSON.stringify({ status: status !== req.status || publicNote.trim() ? status : undefined, publicNote: publicNote.trim() || undefined, internalNote: notes }),
    }).catch(() => undefined);
    setSaving(false);
    if (!res?.ok) return toast((await res?.json().catch(() => null))?.error ?? "Couldn't save. Try again.");
    setPublicNote("");
    setStatus(undefined);
    setNotes(undefined);
    toast(status !== req.status ? `${req.id} → ${status} · citizen notified` : "Saved");
  };

  return (
    <div className="fade-in">
      <Link href="/admin/requests" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-950">
        <ArrowLeft className="size-4" /> All requests
      </Link>
      {isDemoRequest(req) && (
        <InfoBox className="mb-4">This is a demo request from <code>scripts/seed.mjs</code>. The citizen and contact are fictional, so status changes notify nobody.</InfoBox>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CategoryIcon category={req.category} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-slate-500">{req.id} · {[req.place, req.district, req.state].filter(Boolean).join(", ")} · {new Date(req.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
          <h1 className="text-xl font-bold text-indigo-950">{req.summary.en}</h1>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><Languages className="size-3.5" /> Original message · {req.language}</p>
            <p className="mt-3 text-lg leading-relaxed">{req.text}</p>
            {req.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves optimised images
              <img src={req.photoUrl} alt="Photo from citizen" className="mt-5 max-h-80 w-full rounded-xl object-cover" />
            )}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">English translation</p>
              <p className="mt-2 text-slate-700">{req.translation?.en ?? req.summary.en}</p>
            </div>
          </Card>

          {req.lat != null && req.lng != null && (
            <Card className="p-5">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><MapPin className="size-3.5" /> Location</p>
              <PinMap lat={req.lat} lng={req.lng} label={[req.place, req.district].filter(Boolean).join(", ")} />
            </Card>
          )}

          <Card className="p-5">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500">Timeline (visible to citizen)</p>
            <StatusTimeline timeline={req.timeline ?? []} />
          </Card>

          <Card className="flex flex-wrap gap-x-8 gap-y-3 p-5 text-sm">
            <span className="flex items-center gap-2"><User className="size-4 text-slate-400" /> {req.citizen || "Citizen"}</span>
            {req.contact && <span className="flex items-center gap-2 font-mono"><Mail className="size-4 text-slate-400" /> {req.contact}</span>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-indigo-100 px-5 py-3 text-indigo-950">
              <Sparkles className="size-4 text-orange-700" /> <h2 className="font-semibold">AI Analysis</h2>
            </div>
            <dl className="space-y-4 p-5 text-sm">
              <div className="flex items-center justify-between"><dt className="text-slate-500">Category</dt><dd><CategoryTag category={req.category} /></dd></div>
              <div>
                <div className="flex items-center justify-between"><dt className="text-slate-500">Urgency</dt><dd><UrgencyBadge level={req.urgency} /></dd></div>
                {req.urgencyReason && <p className="mt-1.5 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{req.urgencyReason}</p>}
              </div>
              {req.department && <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">Suggested department</dt><dd className="flex items-center gap-1.5 text-right font-medium"><Building2 className="size-4 text-slate-400" />{req.department}</dd></div>}
              {req.sentiment && <div className="flex items-center justify-between"><dt className="text-slate-500">Sentiment</dt><dd className="font-medium">{req.sentiment}</dd></div>}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-indigo-950">Similar Requests ({similar.length})</h2>
            <p className="text-xs text-slate-500">{req.category} · {req.district}</p>
            <ul className="mt-3 space-y-1">
              {similar.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/requests/${r.id}`} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-slate-50">
                    <span className="font-mono text-xs text-indigo-700">{r.id}</span>
                    <span className="line-clamp-1 flex-1">{r.summary.en}</span>
                  </Link>
                </li>
              ))}
              {!similar.length && <li className="text-sm text-slate-500">No similar requests yet.</li>}
            </ul>
          </Card>

          <Card className="space-y-4 p-5">
            <label className="block text-sm font-medium">
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={cx(input, "mt-1.5")}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Update for the citizen <span className="font-normal text-slate-500">(optional, shown in their timeline + push)</span>
              <textarea value={publicNote} onChange={(e) => setPublicNote(e.target.value)} maxLength={1000} rows={2} placeholder="e.g. Site inspection scheduled for Monday." className={cx(input, "mt-1.5")} />
            </label>
            <label className="block text-sm font-medium">
              Internal notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} rows={3} placeholder="Visible to officials only…" className={cx(input, "mt-1.5")} />
            </label>
            <div className="flex flex-wrap gap-3">
              <button onClick={save} disabled={saving} className={btn.primary}>{saving ? <Spinner className="text-white" /> : "Save changes"}</button>
              <Link href={`/admin/announcements?link=${req.id}`} className={btn.outline}><Link2 className="size-4" /> Link to Announcement</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
