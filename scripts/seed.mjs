// Load the demo requests + announcements into Firestore (idempotent: same IDs overwrite).
// Usage: node --env-file=.env.local scripts/seed.mjs
// Node 23.6+ runs lib/mock-data.ts directly (type stripping).
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { ANNOUNCEMENTS, REQUESTS } from "../lib/mock-data.ts";

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("FIREBASE_SERVICE_ACCOUNT missing. Run: node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();

// Approximate district centres for the map (seed data only; real requests use GPS or Nominatim).
const CENTRES = {
  Beed: [18.99, 75.76], Chennai: [13.08, 80.27], Kolkata: [22.57, 88.36], Nagpur: [21.15, 79.09], Latur: [18.4, 76.56],
  "Chhatrapati Sambhajinagar": [19.88, 75.34], Gadchiroli: [20.18, 80.0], Dharashiv: [18.19, 76.04], Thane: [19.22, 72.98],
  Nashik: [20.0, 73.79], Madurai: [9.93, 78.12], Howrah: [22.59, 88.26], Solapur: [17.66, 75.91], Pune: [18.52, 73.86],
};
const jitter = () => (Math.random() - 0.5) * 0.15;
const local = (en, l) => ({ en, hi: l?.hi ?? en, mr: l?.mr ?? en });

const batch = db.batch();
for (const r of REQUESTS) {
  const [lat, lng] = CENTRES[r.district] ?? [];
  batch.set(db.collection("requests").doc(r.id), {
    uid: "seed",
    text: r.original,
    language: r.lang,
    summary: local(r.summary, r.summaryLocal),
    translation: local(r.summary),
    category: r.category,
    urgency: r.urgency,
    urgencyReason: r.urgencyReason,
    department: r.department,
    sentiment: r.sentiment,
    state: r.state,
    district: r.district,
    place: r.place,
    ...(lat && { lat: lat + jitter(), lng: lng + jitter() }),
    photoUrl: null,
    status: r.status,
    timeline: r.timeline ?? [{ status: "Submitted", date: r.date, note: { en: "Request received.", hi: "अनुरोध प्राप्त हुआ।", mr: "विनंती प्राप्त झाली." } }],
    citizen: r.citizen,
    contact: r.contact,
    ...(r.announcementId && { announcementId: r.announcementId }),
    createdAt: Timestamp.fromDate(new Date(r.date)),
  });
}
for (const a of ANNOUNCEMENTS) {
  const { id, date, ...rest } = a;
  batch.set(db.collection("announcements").doc(id), { ...rest, place: rest.place ?? null, createdAt: Timestamp.fromDate(new Date(date)) });
}
await batch.commit();
console.log(`Seeded ${REQUESTS.length} requests and ${ANNOUNCEMENTS.length} announcements.`);
