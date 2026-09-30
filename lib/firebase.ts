import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // needed for FCM
};

export const firebaseReady = Boolean(config.apiKey && config.projectId);

export const app = firebaseReady ? (getApps()[0] ?? initializeApp(config)) : undefined;
// Only touch these after checking `firebaseReady` (AuthProvider and the login pages do).
export const auth = (app && getAuth(app)) as Auth;
export const db = (app && getFirestore(app)) as Firestore;

/** Citizen profile, stored at users/{uid}. */
export interface Profile {
  name: string;
  email: string;
  state: string;
  district: string;
  place: string; // city / village
}

export { areaLabel, inArea, type Official } from "./area";
