// One-time bootstrap: make an existing Firebase account a superadmin.
// Usage: node --env-file=.env.local scripts/set-superadmin.mjs someone@example.gov.in
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = process.argv[2];
if (!email || !process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Usage: node --env-file=.env.local scripts/set-superadmin.mjs <email>  (needs FIREBASE_SERVICE_ACCOUNT)");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const user = await getAuth().getUserByEmail(email.toLowerCase());
await getAuth().setCustomUserClaims(user.uid, { role: "superadmin" });
await getFirestore().collection("officials").doc(user.uid).set({
  email: user.email,
  name: user.displayName ?? "",
  role: "superadmin",
  state: null,
  district: null,
  assignedBy: "cli",
  assignedAt: new Date().toISOString(),
});
console.log(`${user.email} is now a superadmin. Sign in at /admin/login.`);
