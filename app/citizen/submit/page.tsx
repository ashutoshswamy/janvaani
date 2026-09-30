"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Square, ImagePlus, LocateFixed, Sparkles, CheckCircle2, Languages } from "lucide-react";
import { INDIA_DISTRICTS, STATES, type Category, type Localized } from "@/lib/mock-data";
import { useAuth } from "@/components/auth";
import { auth } from "@/lib/firebase";
import { useLang } from "@/components/lang";
import { btn, Card, cx, input, PageTitle, Spinner, urgencyLabel } from "@/components/ui";

type Result = { id: string; language: string; category: Category; urgency: number; summary: Localized; translation: Localized };
import { toast } from "@/components/toast";

export default function Submit() {
  const { t, L } = useLang();
  const me = useAuth().profile!; // layout guarantees a profile
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [state, setState] = useState(me.state);
  const [district, setDistrict] = useState(me.district);
  const [place, setPlace] = useState(me.place);
  const [locating, setLocating] = useState(false);
  const [phase, setPhase] = useState<"form" | "loading" | "done">("form");
  const [coords, setCoords] = useState<GeolocationCoordinates>();
  const [res, setRes] = useState<Result>();
  const rec = useRef<MediaRecorder>(null);
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Voice → /api/transcribe (Gemini). Recorder by janvaani-d9.
  const toggleMic = async () => {
    if (recording) return rec.current?.stop();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!stream) return toast(t.micNeeded);
    // Gemini documents ogg/aac/mp3/wav; Chrome only records webm, so prefer ogg/mp4 where supported
    const mimeType = ["audio/ogg;codecs=opus", "audio/mp4", "audio/webm"].find((m) => MediaRecorder.isTypeSupported(m));
    const r = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((tr) => tr.stop());
      setRecording(false);
      setTranscribing(true);
      const body = new FormData();
      body.set("audio", new Blob(chunks, { type: r.mimeType }), "voice");
      const res = await fetch("/api/transcribe", { method: "POST", headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` }, body }).catch(() => undefined);
      setTranscribing(false);
      if (!res?.ok) return toast(t.transcribeFailed);
      const { text: spoken } = await res.json();
      setText((prev) => (prev ? prev + " " : "") + spoken);
    };
    rec.current = r;
    r.start();
    setSeconds(0);
    setRecording(true);
  };

  const changeState = (s: string) => {
    setState(s);
    setDistrict(INDIA_DISTRICTS[s][0]);
  };

  // GPS pin for the map. State/district/place stay as typed; the server geocodes the address when there's no pin.
  const locate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords(p.coords); setLocating(false); toast(t.located); },
      () => { setLocating(false); toast(t.locationFailed); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async () => {
    setPhase("loading");
    const body = new FormData();
    Object.entries({ text, state, district, place }).forEach(([k, v]) => body.set(k, v));
    if (photo) body.set("photo", photo);
    if (coords) { body.set("lat", String(coords.latitude)); body.set("lng", String(coords.longitude)); }
    const r = await fetch("/api/requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
      body,
    }).catch(() => undefined);
    if (!r?.ok) {
      toast(t.submitFailed);
      return setPhase("form");
    }
    setRes(await r.json());
    setPhase("done");
  };

  if (phase === "loading")
    return (
      <div className="fade-in grid min-h-[60vh] place-items-center text-center">
        <div>
          <div className="relative mx-auto grid size-20 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-orange-200" />
            <span className="relative grid size-20 place-items-center rounded-full bg-orange-500 text-indigo-950"><Sparkles className="size-8 animate-pulse" /></span>
          </div>
          <p className="mt-6 text-lg font-semibold text-indigo-950">{t.understanding}</p>
          <p className="mt-1 text-sm text-slate-500">{t.understandingSub}</p>
        </div>
      </div>
    );

  if (phase === "done" && res)
    return (
      <div className="fade-in mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3 text-green-700">
          <CheckCircle2 className="size-8" />
          <div>
            <h1 className="text-xl font-bold">{t.submitted}</h1>
            <p className="text-sm text-slate-500">{t.refSms.replace("{id}", res.id)}</p>
          </div>
        </div>
        <Card className="p-6">
          <p className="text-sm font-medium text-slate-500">{t.understoodAs}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t.category}</dt>
              <dd className="font-semibold">{t.cat[res.category]}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t.urgency}</dt>
              <dd className="font-semibold text-red-600">{t.urg[urgencyLabel(res.urgency)]}</dd>
            </div>
            <div className="col-span-2 rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t.location}</dt>
              <dd className="font-semibold">{[place, district, state].filter(Boolean).join(", ")}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">{t.summary}</p>
          <p className="mt-1 font-medium text-indigo-950">{L(res.summary)}</p>
          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Languages className="size-3.5" /> {t.original} ({res.language})</p>
            <p className="mt-1">{text}</p>
            <p className="mt-3 text-xs font-medium text-slate-500">{t.translation}</p>
            <p className="mt-1 text-slate-600">{L(res.translation)}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/citizen/requests" className={btn.primary}>{t.viewMine}</Link>
            <button onClick={() => { setText(""); setPhoto(undefined); setCoords(undefined); setPhase("form"); }} className={btn.outline}>{t.another}</button>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="fade-in mx-auto max-w-2xl">
      <PageTitle title={t.raise} sub={t.submitSub} />

      <Card className="p-6 text-center">
        <button
          onClick={toggleMic}
          disabled={transcribing}
          aria-pressed={recording}
          aria-label={recording ? t.tapStop : t.tapSpeak}
          className={cx(
            "relative mx-auto grid size-28 place-items-center rounded-full shadow-xl transition",
            recording ? "bg-red-600 text-white shadow-red-600/40" : "bg-orange-500 text-indigo-950 shadow-orange-500/40 hover:scale-105",
          )}
        >
          {recording && <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />}
          {recording ? <Square className="relative size-9" fill="currentColor" /> : <Mic className="size-11" />}
        </button>
        {recording ? (
          <div className="mt-5">
            <div className="flex h-10 items-center justify-center gap-1" aria-hidden>
              {Array.from({ length: 24 }, (_, i) => (
                <span key={i} className="wave-bar h-full w-1 rounded-full bg-red-500" style={{ animationDelay: `${(i * 97) % 900}ms` }} />
              ))}
            </div>
            <p className="mt-2 font-mono text-sm text-red-600">● {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")} · {t.tapStop}</p>
          </div>
        ) : transcribing ? (
          <Spinner label={t.transcribing} className="mt-4" />
        ) : (
          <p className="mt-4 font-semibold text-indigo-950">{t.tapSpeak}</p>
        )}
      </Card>

      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> {t.or} <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-5">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={t.placeholder} className={input} />

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 transition hover:border-orange-400 hover:bg-orange-50/40">
          <ImagePlus className="size-7 text-slate-400" />
          {photo ? <span className="font-medium text-indigo-950">{photo.name}</span> : <span>{t.addPhoto} <span className="text-slate-400">{t.optional}</span></span>}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0])} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            {t.state}
            <select value={state} onChange={(e) => changeState(e.target.value)} className={cx(input, "mt-1.5")}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            {t.district}
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={cx(input, "mt-1.5")}>
              {INDIA_DISTRICTS[state].map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            {t.place}
            <div className="mt-1.5 flex gap-3">
              <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t.placePh} className={input} />
              <button type="button" onClick={locate} disabled={locating} className={cx(btn.outline, "shrink-0")}>
                {locating ? <Spinner /> : <LocateFixed className={cx("size-4", coords && "text-green-600")} />} <span className="hidden sm:inline">{t.useLocation}</span>
              </button>
            </div>
          </label>
        </div>

        <button onClick={submit} disabled={!text.trim() || recording || transcribing} className={cx(btn.accent, "w-full py-4 text-base")}>
          <Sparkles className="size-5" /> {t.submit}
        </button>
      </div>
    </div>
  );
}
