import { createHash } from "node:crypto";
import { adminDb, adminMessaging, caller, json, rateLimit } from "@/lib/firebase-admin";
import { topicFor } from "@/lib/push";

/** Citizen registers this browser's FCM token: saved for personal updates, subscribed to their area topics. */
export async function POST(req: Request) {
  const me = await caller(req);
  if (!me) return json({ error: "Sign in required" }, 401);
  const limited = await rateLimit("push", me.uid, 20, 3600);
  if (limited) return limited;
  const { token } = await req.json().catch(() => ({}));
  if (typeof token !== "string" || token.length < 20 || token.length > 4096) return json({ error: "Invalid token" }, 400);

  const profile = (await adminDb().collection("users").doc(me.uid).get()).data();
  if (!profile) return json({ error: "Complete your profile first" }, 400);

  await adminDb()
    .collection("pushTokens")
    .doc(createHash("sha256").update(token).digest("hex"))
    .set({ uid: me.uid, token, state: profile.state, district: profile.district, updatedAt: new Date().toISOString() });
  // ponytail: topics are only (re)subscribed on registration; if a citizen moves district, re-register.
  await Promise.all([topicFor(profile.state), topicFor(profile.state, profile.district)].map((t) => adminMessaging().subscribeToTopic(token, t)));
  return json({ ok: true });
}
