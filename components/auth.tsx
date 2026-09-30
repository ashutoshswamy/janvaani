"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, firebaseReady, type Official, type Profile } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  profile: Profile | null; // citizen profile (users/{uid})
  official: Official | null; // from custom claims
  loading: boolean;
}

const Ctx = createContext<AuthState>({ user: null, profile: null, official: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, official: null, loading: firebaseReady });

  useEffect(() => {
    if (!firebaseReady) return;
    let stopProfile = () => {};
    const stopAuth = onAuthStateChanged(auth, async (user) => {
      stopProfile();
      if (!user) return setState({ user: null, profile: null, official: null, loading: false });
      setState((s) => ({ ...s, loading: true }));
      const { claims } = await user.getIdTokenResult();
      const official: Official | null =
        claims.role === "admin" || claims.role === "superadmin"
          ? { role: claims.role, state: claims.state as string | undefined, district: claims.district as string | undefined }
          : null;
      // Live listener so a profile written right after sign-up shows up without a race.
      stopProfile = onSnapshot(
        doc(db, "users", user.uid),
        (snap) => setState({ user, official, profile: snap.exists() ? (snap.data() as Profile) : null, loading: false }),
        (err) => {
          console.error("Profile read failed", err); // surfaces rule/config problems instead of silently asking for a profile
          setState({ user, official, profile: null, loading: false });
        },
      );
    });
    return () => {
      stopAuth();
      stopProfile();
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
export const logout = () => signOut(auth);

/** Friendly message key for common Firebase auth errors. */
export function authErrorKey(e: unknown) {
  const code = (e as { code?: string }).code ?? "";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(code)) return "errBadCreds";
  if (code === "auth/email-already-in-use") return "errInUse";
  if (code === "auth/weak-password") return "errWeak";
  return "errGeneric";
}
