"use client";
import { useCallback, useEffect, useState } from "react";
import { UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { auth, areaLabel, type Official } from "@/lib/firebase";
import { INDIA_DISTRICTS, STATES } from "@/lib/mock-data";
import { useAuth } from "@/components/auth";
import { btn, Card, cx, input, PageTitle, Spinner, Badge } from "@/components/ui";
import { toast } from "@/components/toast";

type Row = Official & { uid: string; email: string; name: string; assignedBy?: string };

async function api(method: string, body?: unknown) {
  const res = await fetch("/api/officials", {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export default function Officials() {
  const { official } = useAuth();
  const [rows, setRows] = useState<Row[]>();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api("GET").then(setRows).catch((e) => { setRows([]); toast(e.message); }), []);
  useEffect(() => {
    if (official?.role === "superadmin") load();
  }, [official, load]);

  if (official?.role !== "superadmin")
    return <Card className="p-10 text-center text-slate-500">Only a superadmin can manage officials.</Card>;

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("POST", { email, state, district });
      toast(`${email} is now admin for ${areaLabel({ state, district: district || null })}. Applies at their next sign-in (or within an hour).`);
      setEmail("");
      await load();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Row) => {
    if (!confirm(`Remove admin access for ${r.email}? They will be signed out.`)) return;
    try {
      await api("DELETE", { uid: r.uid });
      toast(`Removed ${r.email}`);
      await load();
    } catch (err) {
      toast((err as Error).message);
    }
  };

  return (
    <div className="fade-in">
      <PageTitle title="Officials" sub="Assign area-wise admins. Accounts must first be created in Firebase Console → Authentication." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="overflow-hidden">
          {!rows ? (
            <div className="grid place-items-center p-16"><Spinner label="Loading officials…" /></div>
          ) : !rows.length ? (
            <p className="p-16 text-center text-slate-500">No officials yet. Assign the first admin →</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>{["Official", "Role", "Area", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.uid}>
                      <td className="px-4 py-3"><p className="font-medium">{r.name || r.email}</p>{r.name && <p className="text-xs text-slate-500">{r.email}</p>}</td>
                      <td className="px-4 py-3">
                        <Badge className={r.role === "superadmin" ? "bg-orange-100 text-orange-800" : "bg-indigo-50 text-indigo-800"}>
                          {r.role === "superadmin" && <ShieldCheck className="size-3" />}{r.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{areaLabel(r)}</td>
                      <td className="px-4 py-3 text-right">
                        {r.role === "admin" && (
                          <button onClick={() => remove(r)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${r.email}`}>
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="h-fit p-5">
          <h2 className="flex items-center gap-2 font-semibold text-indigo-950"><UserPlus className="size-4 text-orange-600" /> Assign admin</h2>
          <form onSubmit={assign} className="mt-4 space-y-3">
            <label className="block text-sm font-medium">
              Official&apos;s email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@district.gov.in" className={cx(input, "mt-1.5")} />
            </label>
            <label className="block text-sm font-medium">
              State / UT
              <select value={state} onChange={(e) => { setState(e.target.value); setDistrict(""); }} className={cx(input, "mt-1.5")}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              District
              <select value={district} onChange={(e) => setDistrict(e.target.value)} className={cx(input, "mt-1.5")}>
                <option value="">All districts (state-level admin)</option>
                {INDIA_DISTRICTS[state].map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
            <button disabled={busy} className={cx(btn.accent, "w-full")}>{busy ? <Spinner className="text-indigo-950" /> : "Assign admin role"}</button>
            <p className="text-xs text-slate-500">Re-assigning an existing admin updates their area. Changes apply at their next sign-in, or within an hour.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
