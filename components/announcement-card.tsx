"use client";
import { MapPin, Users } from "lucide-react";
import { isDemoAnnouncement, type Announcement } from "@/lib/mock-data";
import { useLang } from "@/components/lang";
import { CategoryTag } from "@/components/badges";
import { Badge, CategoryIcon } from "@/components/ui";

const GRADIENT = {
  Water: "from-sky-400 to-blue-700",
  Roads: "from-stone-400 to-stone-700",
  Health: "from-rose-400 to-rose-700",
  Education: "from-violet-400 to-violet-700",
  Electricity: "from-amber-300 to-orange-600",
  Sanitation: "from-emerald-400 to-teal-700",
};

export function AnnouncementCard({ a }: { a: Announcement }) {
  const { t, L, date, num } = useLang();
  return (
    <article className="fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ponytail: gradient placeholder instead of photos */}
      <div className={`relative grid h-32 place-items-center bg-gradient-to-br ${GRADIENT[a.category]}`}>
        <div className="scale-150 opacity-90"><CategoryIcon category={a.category} /></div>
        {isDemoAnnouncement(a) && <Badge className="absolute left-3 top-3 bg-sky-50 text-sky-900 ring-1 ring-sky-200">{t.demoBadge}</Badge>}
        <Badge className="absolute right-3 top-3 bg-white/90 text-green-700"><Users className="size-3" /> {t.addressed.replace("{n}", num(a.addressed))}</Badge>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge className="bg-indigo-50 text-indigo-800"><MapPin className="size-3" /> {[a.place, a.district, a.state].filter(Boolean).join(", ")}</Badge>
          <CategoryTag category={a.category} />
          <span className="ml-auto text-slate-500">{date(a.date)}</span>
        </div>
        <h3 className="mt-3 font-semibold leading-snug text-indigo-950">{L(a.title)}</h3>
        <p className="mt-2 text-sm text-slate-600">{L(a.body)}</p>
      </div>
    </article>
  );
}
