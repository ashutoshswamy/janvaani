import { adminAuth, adminDb, rateLimit, validId } from "@/lib/firebase-admin";
import { districtsOf } from "@/lib/mock-data";

// Superadmin-only management of admin roles. Roles live in Firebase custom claims
// (tamper-proof, readable in security rules); officials/{uid} mirrors them for listing.

const json = (body: unknown, status = 200) => Response.json(body, { status });

async function superadmin(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    const me = await adminAuth().verifyIdToken(token, true); // true = reject revoked sessions
    return me.role === "superadmin" ? me : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  if (!(await superadmin(req))) return json({ error: "Superadmin only" }, 403);
  const snap = await adminDb().collection("officials").orderBy("email").get();
  return json(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
}

/** Assign (or re-assign) the admin role + area to an existing Firebase account. */
export async function POST(req: Request) {
  const me = await superadmin(req);
  if (!me) return json({ error: "Superadmin only" }, 403);
  const limited = await rateLimit("officials", me.uid, 60, 3600);
  if (limited) return limited;

  const { email, state, district } = await req.json().catch(() => ({}));
  const districts = districtsOf(state);
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email.trim()) || !districts || (district && !districts.includes(district)))
    return json({ error: "A valid email, state and (optional) district are required." }, 400);

  const user = await adminAuth().getUserByEmail(email.trim().toLowerCase()).catch(() => null);
  if (!user) return json({ error: "No Firebase account with this email. Create it in Firebase Console → Authentication first." }, 404);
  if (user.customClaims?.role === "superadmin") return json({ error: "Superadmin roles can't be changed here." }, 409);

  const area = { state, district: district || null };
  await adminAuth().setCustomUserClaims(user.uid, { role: "admin", ...area });
  const record = { email: user.email, name: user.displayName ?? "", role: "admin", ...area, assignedBy: me.email ?? me.uid, assignedAt: new Date().toISOString() };
  await adminDb().collection("officials").doc(user.uid).set(record);
  return json({ uid: user.uid, ...record });
}

/** Remove the admin role. Signs the user out everywhere. */
export async function DELETE(req: Request) {
  const me = await superadmin(req);
  if (!me) return json({ error: "Superadmin only" }, 403);
  const limited = await rateLimit("officials", me.uid, 60, 3600);
  if (limited) return limited;
  const { uid } = await req.json().catch(() => ({}));
  if (!validId(uid)) return json({ error: "uid required" }, 400);

  const user = await adminAuth().getUser(uid).catch(() => null);
  if (!user) return json({ error: "User not found" }, 404);
  if (user.customClaims?.role === "superadmin") return json({ error: "Superadmin roles can't be changed here." }, 409);

  await adminAuth().setCustomUserClaims(uid, null);
  await adminAuth().revokeRefreshTokens(uid);
  await adminDb().collection("officials").doc(uid).delete();
  return json({ ok: true });
}
