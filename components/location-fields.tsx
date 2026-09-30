"use client";
import { INDIA_DISTRICTS, STATES } from "@/lib/mock-data";
import { useLang } from "@/components/lang";
import { cx, input } from "@/components/ui";

export type Location = { state: string; district: string; place: string };

/** State → district → city/village picker. District list follows the chosen state. */
export function LocationFields({ value, onChange }: { value: Location; onChange: (v: Location) => void }) {
  const { t } = useLang();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">
        {t.state}
        <select
          required
          value={value.state}
          onChange={(e) => onChange({ ...value, state: e.target.value, district: INDIA_DISTRICTS[e.target.value][0] })}
          className={cx(input, "mt-1.5")}
        >
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium">
        {t.district}
        <select required value={value.district} onChange={(e) => onChange({ ...value, district: e.target.value })} className={cx(input, "mt-1.5")}>
          {INDIA_DISTRICTS[value.state].map((d) => <option key={d}>{d}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        {t.place}
        <input required maxLength={100} value={value.place} onChange={(e) => onChange({ ...value, place: e.target.value })} placeholder={t.placePh} className={cx(input, "mt-1.5")} />
      </label>
    </div>
  );
}
