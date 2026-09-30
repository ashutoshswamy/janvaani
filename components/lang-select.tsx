"use client";
import { Languages } from "lucide-react";
import { LANG_OPTIONS, useLang, type Lang } from "@/components/lang";

export function LangSelect() {
  const { lang, setLang, t } = useLang();
  return (
    <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5 text-sm">
      <Languages className="size-4 text-slate-500" />
      <span className="sr-only">{t.language}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="bg-transparent outline-none [&>option]:text-slate-900">
        {LANG_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
    </label>
  );
}
