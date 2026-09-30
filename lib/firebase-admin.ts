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

/** Official role from verified custom claims, or null for citizens. */
export function officialOf(t: DecodedIdToken | null): Official | null {
  if (t?.role !== "admin" && t?.role !== "superadmin") return null;
  return { role: t.role, state: t.state ?? null, district: t.district ?? null };
}
