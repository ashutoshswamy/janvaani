import { Droplet, Route, HeartPulse, GraduationCap, Zap, Trash2, Loader2, Info } from "lucide-react";
import Image from "next/image";
import type { Category } from "@/lib/mock-data";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
  get primary() { return `${this.base} bg-indigo-950 text-white hover:bg-indigo-900`; },
  get accent() { return `${this.base} bg-orange-500 text-indigo-950 hover:bg-orange-400 shadow-sm shadow-orange-500/30`; },
  get outline() { return `${this.base} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`; },
  get ghost() { return `${this.base} text-slate-700 hover:bg-slate-100`; },
};

export const input =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

export const urgencyLabel = (u: number) => (u >= 5 ? "Critical" : u === 4 ? "High" : u === 3 ? "Medium" : "Low");

export const CATEGORY_ICON = { Water: Droplet, Roads: Route, Health: HeartPulse, Education: GraduationCap, Electricity: Zap, Sanitation: Trash2 };
export const CATEGORY_COLOR = {
  Water: "bg-sky-100 text-sky-700",
  Roads: "bg-stone-200 text-stone-700",
  Health: "bg-rose-100 text-rose-700",
  Education: "bg-violet-100 text-violet-700",
  Electricity: "bg-yellow-100 text-yellow-700",
  Sanitation: "bg-emerald-100 text-emerald-700",
};

export function CategoryIcon({ category, small }: { category: Category; small?: boolean }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span className={cx("inline-grid shrink-0 place-items-center rounded-xl", CATEGORY_COLOR[category], small ? "size-7" : "size-10")}>
      <Icon className={small ? "size-4" : "size-5"} aria-hidden />
    </span>
  );
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 text-sm text-slate-600", className)}>
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </span>
  );
}

export function Logo() {
  return (
    // The logo already contains the "JanVaani" wordmark.
    <Image src="/logo.png" alt="JanVaani" width={1536} height={1024} className="h-12 w-auto rounded-lg" priority />
  );
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-indigo-950">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/** Marks sample / demo data so nobody mistakes it for real figures. */
export function InfoBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="note" className={cx("flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900", className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
