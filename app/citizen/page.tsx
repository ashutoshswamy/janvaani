"use client";
import Link from "next/link";
import { Mic, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth";
import { useAnnouncements, useMyRequests } from "@/components/data";
import { useLang } from "@/components/lang";
import { PushToggle } from "@/components/push";
import { StatusBadge } from "@/components/badges";
import { Card, CategoryIcon, InfoBox, Spinner } from "@/components/ui";
import { isDemoAnnouncement } from "@/lib/mock-data";
import { AnnouncementCard } from "@/components/announcement-card";

export default function CitizenHome() {
  const { t, L, date, num } = useLang();
  const { user, profile } = useAuth();
  const me = profile!; // layout guarantees a profile
  const mine = useMyRequests(user?.uid);
  const anns = useAnnouncements(true);
  const active = mine?.filter((r) => r.status !== "Resolved") ?? [];
  const local = anns?.filter((a) => a.state === me.state && (a.district === me.district || a.district === "All districts")) ?? [];
  const latest = (local.length ? local : (anns ?? [])).slice(0, 2); // fall back to latest anywhere

  return (
    <div className="fade-in space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{date(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-2xl font-bold text-indigo-950 sm:text-3xl">{t.hello}, {me.name.split(" ")[0]} 🙏</h1>
        </div>
        <PushToggle />
      </div>

      <Link href="/citizen/submit" className="group block overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-100 via-orange-50 to-indigo-200 p-6 text-indigo-950 shadow-sm sm:p-8">
        <div className="flex items-center gap-5">
          <span className="relative grid size-16 shrink-0 place-items-center rounded-full bg-orange-500 text-indigo-950 shadow-lg shadow-orange-500/40 transition group-hover:scale-105 sm:size-20">
            <span className="absolute inset-0 animate-ping rounded-full bg-orange-500/40" />
            <Mic className="relative size-8" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold sm:text-2xl">{t.raise}</h2>
            <p className="mt-1 text-slate-700">{t.raiseSub}</p>
          </div>
          <ArrowRight className="ml-auto hidden size-6 shrink-0 transition group-hover:translate-x-1 sm:block" />
        </div>
      </Link>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-indigo-950">{t.requests}</h2>
          <Link href="/citizen/requests" className="text-sm font-medium text-orange-700 hover:underline">{t.viewAll}</Link>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Card className="flex items-center gap-3 p-4">
            <Clock className="size-8 rounded-lg bg-blue-50 p-1.5 text-blue-600" />
            <div><p className="text-2xl font-bold">{num(active.length)}</p><p className="text-xs text-slate-500">{t.active}</p></div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <CheckCircle2 className="size-8 rounded-lg bg-green-50 p-1.5 text-green-600" />
            <div><p className="text-2xl font-bold">{num((mine?.length ?? 0) - active.length)}</p><p className="text-xs text-slate-500">{t.resolved}</p></div>
          </Card>
        </div>
        {!mine ? (
          <Card className="grid place-items-center p-8"><Spinner /></Card>
        ) : !active.length ? (
          <Card className="p-6 text-center text-sm text-slate-500">{t.empty.requests}</Card>
        ) : (
          <Card className="divide-y divide-slate-100">
            {active.slice(0, 5).map((r) => (
              <Link key={r.id} href={`/citizen/requests?id=${r.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                <CategoryIcon category={r.category} />
                <p className="line-clamp-1 min-w-0 flex-1 text-sm">{L(r.summary)}</p>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </Card>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-indigo-950">{t.announcements}{local.length ? ` · ${me.district}` : ""}</h2>
          <Link href="/citizen/announcements" className="text-sm font-medium text-orange-700 hover:underline">{t.viewAll}</Link>
        </div>
        {!anns ? (
          <Card className="grid place-items-center p-8"><Spinner /></Card>
        ) : !latest.length ? (
          <Card className="p-6 text-center text-sm text-slate-500">{t.empty.announcements}</Card>
        ) : (
          <>
            {latest.some(isDemoAnnouncement) && <InfoBox className="mb-4">{t.demoAnnouncements}</InfoBox>}
            <div className="grid gap-4 sm:grid-cols-2">
              {latest.map((a) => <AnnouncementCard key={a.id} a={a} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
