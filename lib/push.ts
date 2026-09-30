// Server-only: Firebase Cloud Messaging helpers.
import { adminDb, adminMessaging } from "./firebase-admin";

/** FCM topic per area. Topic names allow [a-zA-Z0-9-_.~%] only. */
export const topicFor = (state: string, district?: string | null) =>
  ["area", state, district].filter(Boolean).join("-").replace(/[^a-zA-Z0-9-]/g, "_");

type Note = { title: string; body: string; url: string };

// Data-only payload: our service worker (public/firebase-messaging-sw.js) renders it.
const data = (n: Note) => ({ data: n, webpush: { headers: { Urgency: "high" } } });

/** Notify every device a citizen registered. Prunes tokens FCM says are dead. */
export async function pushToUser(uid: string, n: Note) {
  const snap = await adminDb().collection("pushTokens").where("uid", "==", uid).get();
  if (snap.empty) return;
  const res = await adminMessaging().sendEachForMulticast({ tokens: snap.docs.map((d) => d.get("token")), ...data(n) });
  await Promise.all(
    res.responses.map((r, i) =>
      r.error?.code === "messaging/registration-token-not-registered" ? snap.docs[i].ref.delete() : null,
    ),
  );
}

/** Broadcast to everyone subscribed to these area topics. */
export const pushToTopics = (topics: string[], n: Note) =>
  Promise.all(topics.map((topic) => adminMessaging().send({ topic, ...data(n) })));
