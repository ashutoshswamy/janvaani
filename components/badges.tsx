"use client";
import { Check } from "lucide-react";
import { STATUSES, type Category, type Status, type TimelineEntry } from "@/lib/mock-data";
import { useLang } from "@/components/lang";
import { Badge, CATEGORY_COLOR, CATEGORY_ICON, cx, urgencyLabel } from "@/components/ui";

// Text badges live here (client) so their labels follow the selected language.

const STATUS_STYLE: Record<Status, string> = {
  Submitted: "bg-slate-100 text-slate-700",
  "Under Review": "bg-blue-100 text-blue-700",
  "Action Planned": "bg-amber-100 text-amber-800",
  Resolved: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useLang();
  return (
    <Badge className={STATUS_STYLE[status]}>
      <span className="size-1.5 rounded-full bg-current" />
      {t.status[status]}
    </Badge>
  );
}

const URGENCY_STYLE: Record<string, string> = {
  Critical: "bg-red-600 text-white",
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-slate-100 text-slate-600",
};

export function UrgencyBadge({ level }: { level: number }) {
  const { t } = useLang();
  const l = urgencyLabel(level);
  return <Badge className={URGENCY_STYLE[l]}>{level} · {t.urg[l]}</Badge>;
}

export function CategoryTag({ category }: { category: Category }) {
  const { t } = useLang();
  const Icon = CATEGORY_ICON[category];
  return (
    <Badge className={CATEGORY_COLOR[category]}>
      <Icon className="size-3" aria-hidden />
      {t.cat[category]}
    </Badge>
  );
}

export function StatusTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  const { t, L, date } = useLang();
  return (
    <ol className="relative">
      {STATUSES.map((s, i) => {
        const entry = timeline.find((e) => e.status === s);
        const current = entry && i === timeline.length - 1;
        return (
          <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
            {i < STATUSES.length - 1 && (
              <span className={cx("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5", entry && timeline[i + 1] ? "bg-green-500" : "bg-slate-200")} />
            )}
            <span
              className={cx(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2",
                // current step = marigold with ink check; earlier steps = green
                !entry ? "border-slate-200 bg-white text-slate-300"
                  : current && s !== "Resolved" ? "border-orange-500 bg-orange-500 text-indigo-950 ring-4 ring-orange-100"
                  : "border-green-500 bg-green-500 text-white",
              )}
            >
              {entry ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className={cx("font-semibold", !entry && "text-slate-400")}>{t.status[s]}</p>
                {entry && <p className="text-xs text-slate-500">{date(entry.date)}</p>}
              </div>
              <p className={cx("mt-1 text-sm", entry ? "text-slate-600" : "text-slate-400")}>{entry ? L(entry.note) : t.pending}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
