// Server-only: imported by route handlers. Never import from client components.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import type { Official } from "./area";

function app() {
  if (getApps()[0]) return getApps()[0];
  const key = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set (see .env.example)");
  return initializeApp({ credential: cert(JSON.parse(key)) });
}

export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());
export const adminMessaging = () => getMessaging(app());

export const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Verified caller from the `Authorization: Bearer <ID token>` header, or null. */
export async function caller(req: Request): Promise<DecodedIdToken | null> {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  return adminAuth().verifyIdToken(token, true).catch(() => null); // true = reject revoked sessions
}

/** Firestore document ids we generate: letters, digits, _ and -. Rejects "", "/", "..", etc. before they reach doc(). */
export const validId = (v: unknown): v is string => typeof v === "string" && /^[\w-]{1,128}$/.test(v);

/**
 * Fixed-window rate limit per caller, stored in rateLimits/{bucket}:{uid}:{window} so it holds across serverless instances.
 * Returns a 429 Response when over the limit, else null.
 * ponytail: fixed window allows up to 2x `limit` across a window edge; switch to sliding window if that matters.
 * Old docs are cleaned up by a Firestore TTL policy on rateLimits.expireAt (enable once in the console).
 */
export async function rateLimit(bucket: string, uid: string, limit: number, windowSec: number) {
  const window = Math.floor(Date.now() / 1000 / windowSec);
  const ref = adminDb().collection("rateLimits").doc(`${bucket}:${uid}:${window}`);
  const count = await adminDb().runTransaction(async (tx) => {
    const n = ((await tx.get(ref)).get("count") ?? 0) + 1;
    if (n <= limit) tx.set(ref, { count: n, expireAt: new Date((window + 1) * windowSec * 1000) });
    return n;
  });
  if (count <= limit) return null;
  const retry = String((window + 1) * windowSec - Math.floor(Date.now() / 1000));
  return Response.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": retry } });
}

/** Official role from verified custom claims, or null for citizens. */
export function officialOf(t: DecodedIdToken | null): Official | null {
  if (t?.role !== "admin" && t?.role !== "superadmin") return null;
  return { role: t.role, state: t.state ?? null, district: t.district ?? null };
}
