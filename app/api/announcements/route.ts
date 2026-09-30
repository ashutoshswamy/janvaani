import { FieldValue } from "firebase-admin/firestore";
import { inArea } from "@/lib/area";
import { adminDb, caller, json, officialOf, rateLimit, validId } from "@/lib/firebase-admin";
import { CATEGORIES, districtsOf } from "@/lib/mock-data";
import { pushToTopics, topicFor } from "@/lib/push";

const text = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

/** Official publishes an announcement for their area; linked requests get tagged; area subscribers get a push. */
export async function POST(req: Request) {
  const me = await caller(req);
  const official = officialOf(me);
  if (!me || !official) return json({ error: "Officials only" }, 403);
  const limited = await rateLimit("announce", me.uid, 30, 3600);
  if (limited) return limited;

  const b = await req.json().catch(() => ({}));
  const districts: string[] = Array.isArray(b.districts) ? b.districts.slice(0, 100) : [];
  const linked: string[] = Array.isArray(b.linkedRequestIds) ? b.linkedRequestIds.filter(validId).slice(0, 500) : [];
  if (!text(b.title, 200) || !text(b.body?.en, 5000) || !CATEGORIES.includes(b.category) || !districtsOf(b.state))
    return json({ error: "Title, body, category and state are required" }, 400);
  if (districts.some((d) => !districtsOf(b.state)!.includes(d))) return json({ error: "Unknown district" }, 400);
  // Must be inside the official's area: every chosen district, or the whole state for state/superadmins.
  const targets = districts.length ? districts : [null];
  if (targets.some((d) => !inArea(official, { state: b.state, district: d ?? official.district ?? "" }))) return json({ error: "Outside your area" }, 403);
  if (!districts.length && official.district) return json({ error: "Pick your district" }, 400);

  const body = { en: b.body.en, hi: text(b.body.hi, 5000) ? b.body.hi : b.body.en, mr: text(b.body.mr, 5000) ? b.body.mr : b.body.en };
  const title = { en: b.title, hi: text(b.titleLocal?.hi, 200) ? b.titleLocal.hi : b.title, mr: text(b.titleLocal?.mr, 200) ? b.titleLocal.mr : b.title };
  const place = text(b.place, 100) ? b.place.trim() : null;

  // Only link requests the official can actually see.
  const reqs = linked.length ? await adminDb().getAll(...linked.map((id) => adminDb().collection("requests").doc(id))) : [];
  const ok = reqs.filter((s) => s.exists && inArea(official, s.data() as { state: string; district: string }));

  const ref = adminDb().collection("announcements").doc();
  const batch = adminDb().batch();
  batch.set(ref, {
    title, body, category: b.category, state: b.state, district: districts.join(", ") || "All districts", place,
    addressed: ok.length, linkedRequestIds: ok.map((s) => s.id), createdBy: official.role, createdAt: FieldValue.serverTimestamp(),
  });
  ok.forEach((s) => batch.update(s.ref, { announcementId: ref.id }));
  await batch.commit();

  const topics = districts.length ? districts.map((d) => topicFor(b.state, d)) : [topicFor(b.state)];
  await pushToTopics(topics, { title: `📢 ${b.title}`, body: body.en.slice(0, 180), url: "/citizen/announcements" }).catch((e) => console.error("Push failed", e));

  const citizens = new Set(ok.map((s) => s.get("uid")).filter((u) => u !== "seed")).size;
  return json({ id: ref.id, linked: ok.length, citizens });
}
