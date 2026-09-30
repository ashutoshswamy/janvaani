"use client";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where, type DocumentData, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Official } from "@/lib/area";
import type { Announcement, Req } from "@/lib/mock-data";

// Realtime Firestore listeners. Every query here must match firestore.rules, or the listener is rejected.

/** serverTimestamp `createdAt` → ISO `date` (still null locally while a write is pending). */
const withDate = <T,>(id: string, d: DocumentData) =>
  ({ ...d, id, date: d.createdAt?.toDate?.().toISOString() ?? d.date ?? new Date().toISOString() }) as T;

const newestFirst = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

/** Live list. `key` identifies the query; the listener resubscribes only when it changes. */
function useLive<T extends { date: string }>(key: string | null, make: () => Query): T[] | undefined {
  const [rows, setRows] = useState<{ key: string; rows: T[] }>();
  useEffect(() => {
    if (!key) return;
    return onSnapshot(
      make(),
      (snap) => setRows({ key, rows: snap.docs.map((d) => withDate<T>(d.id, d.data())).sort(newestFirst) }),
      (err) => {
        console.error("Firestore listener", key, err);
        setRows({ key, rows: [] });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` fully describes the query
  }, [key]);
  return rows?.key === key ? rows.rows : undefined; // undefined = loading
}

const requests = () => collection(db, "requests");

/** A citizen's own requests. */
export const useMyRequests = (uid: string | undefined) =>
  useLive<Req>(uid ? `mine:${uid}` : null, () => query(requests(), where("uid", "==", uid)));

/** Requests an official may see: everything for superadmin, else their state (+ district). */
export function useAreaRequests(o: Official | null) {
  const key = o && `area:${o.role}:${o.state ?? ""}:${o.district ?? ""}`;
  return useLive<Req>(key, () => {
    if (o!.role === "superadmin") return requests();
    const byState = query(requests(), where("state", "==", o!.state));
    return o!.district ? query(byState, where("district", "==", o!.district)) : byState;
  });
  // ponytail: loads the whole area client-side; move KPIs to server-side aggregates when areas hit ~10k requests.
}

export const useAnnouncements = (signedIn: boolean) =>
  useLive<Announcement>(signedIn ? "announcements" : null, () => query(collection(db, "announcements")));

/** Live single document (undefined = loading, null = missing / not allowed). */
export function useLiveDoc<T>(path: string | null, dated = false) {
  const [state, setState] = useState<{ path: string; data: T | null }>();
  useEffect(() => {
    if (!path) return;
    return onSnapshot(
      doc(db, path),
      (s) => setState({ path, data: s.exists() ? (dated ? withDate<T>(s.id, s.data()) : ({ id: s.id, ...s.data() } as T)) : null }),
      () => setState({ path, data: null }),
    );
  }, [path, dated]);
  return state?.path === path ? state.data : undefined;
}
