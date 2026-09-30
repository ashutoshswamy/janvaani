"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Megaphone, FileText } from "lucide-react";
import { AnnouncementCard } from "@/components/announcement-card";
import { useLang } from "@/components/lang";
import { useAuth } from "@/components/auth";
import { useAnnouncements, useMyRequests } from "@/components/data";
import { StatusBadge, StatusTimeline } from "@/components/badges";
import { Card, CategoryIcon, cx, PageTitle, Spinner } from "@/components/ui";

function Requests() {
  const [selected, setSelected] = useState(useSearchParams().get("id"));
  const { t, L, date } = useLang();
  const mine = useMyRequests(useAuth().user?.uid);
  const anns = useAnnouncements(true);
  const detailRef = useRef<HTMLDivElement>(null);
  const req = mine?.find((r) => r.id === selected);
  const ann = anns?.find((a) => a.id === req?.announcementId);

  useEffect(() => {
    if (selected && window.innerWidth < 1024) detailRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected]);

  return (
    <div className="fade-in">
      <PageTitle title={t.requests} sub={t.reqSub.replace("{n}", String(mine?.length ?? 0))} />
      {!mine ? (
        <Card className="grid place-items-center p-16"><Spinner /></Card>
      ) : !mine.length ? (
        <Card className="p-16 text-center text-slate-500">{t.empty.requests}</Card>
      ) : (
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          {mine.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={cx(
                "flex w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-indigo-300",
                selected === r.id ? "border-indigo-600 ring-2 ring-indigo-600/15" : "border-slate-200",
              )}
            >
              <CategoryIcon category={r.category} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{L(r.summary)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <StatusBadge status={r.status} />
                  <span>{r.id}</span>·<span>{r.place}</span>·<span>{date(r.date, { day: "numeric", month: "short" })}</span>
                </div>
              </div>
              <ChevronRight className="mt-2 size-4 text-slate-400" />
            </button>
          ))}
        </div>

        <div ref={detailRef} className="scroll-mt-20">
          {req ? (
            <Card key={req.id} className="fade-in p-6">
              <div className="flex items-start gap-3">
                <CategoryIcon category={req.category} />
                <div>
                  <p className="text-xs text-slate-500">{req.id} · {t.cat[req.category]} · {req.place}, {req.district}, {req.state}</p>
                  <h2 className="font-semibold text-indigo-950">{L(req.summary)}</h2>
                </div>
              </div>
              <blockquote className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">“{req.text}”</blockquote>
              {req.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves optimised images
                <img src={req.photoUrl} alt={t.photo} className="mt-4 max-h-72 w-full rounded-xl object-cover" />
              )}
              <h3 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">{t.progress}</h3>
              <StatusTimeline timeline={req.timeline ?? []} />
              {ann && (
                <div className="mt-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-700">
                    <Megaphone className="size-4" /> {t.linkedAnn}
                  </h3>
                  <AnnouncementCard a={ann} />
                </div>
              )}
            </Card>
          ) : (
            <div className="grid h-full min-h-64 place-items-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
              <div>
                <FileText className="mx-auto mb-2 size-8 text-slate-300" />
                {t.selectReq}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense><Requests /></Suspense>;
}
