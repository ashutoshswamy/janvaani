import { FieldValue } from "firebase-admin/firestore";
import { inArea } from "@/lib/area";
import { adminDb, caller, json, officialOf, rateLimit, validId } from "@/lib/firebase-admin";
import { STATUSES, type Status } from "@/lib/mock-data";
import { pushToUser } from "@/lib/push";

/**
 * Official updates a request in their area:
 *  - status (+ optional publicNote): appended to the citizen-visible timeline, citizen gets a push.
 *  - internalNote: officials-only, stored in requestNotes/{id}.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/requests/[id]">) {
  const me = await caller(req);
  const official = officialOf(me);
  if (!me || !official) return json({ error: "Officials only" }, 403);
  const limited = await rateLimit("update", me.uid, 300, 3600);
  if (limited) return limited;

  const { id } = await ctx.params;
  if (!validId(id)) return json({ error: "Not found in your area" }, 404);
  const ref = adminDb().collection("requests").doc(id);
  const snap = await ref.get();
  const r = snap.data();
  if (!r || !inArea(official, r as { state: string; district: string })) return json({ error: "Not found in your area" }, 404);

  const { status, publicNote, internalNote } = await req.json().catch(() => ({}));
  if (status !== undefined && !STATUSES.includes(status)) return json({ error: "Invalid status" }, 400);
  if ((publicNote && (typeof publicNote !== "string" || publicNote.length > 1000)) || (internalNote !== undefined && (typeof internalNote !== "string" || internalNote.length > 5000)))
    return json({ error: "Notes must be text (public ≤1000, internal ≤5000 chars)" }, 400);

  if (status && (status !== r.status || publicNote)) {
    const note = publicNote?.trim() || `Status updated to ${status}.`;
    await ref.update({ status, timeline: FieldValue.arrayUnion({ status, date: new Date().toISOString(), note }) });
    await pushToUser(r.uid, {
      title: `Update on your request: ${status as Status}`,
      body: note,
      url: `/citizen/requests?id=${id}`,
    }).catch((e) => console.error("Push failed", e)); // a failed push must not fail the update
  }
  if (typeof internalNote === "string")
    await adminDb().collection("requestNotes").doc(id).set({ text: internalNote, state: r.state, district: r.district, updatedAt: new Date().toISOString() });

  return json({ ok: true });
}
