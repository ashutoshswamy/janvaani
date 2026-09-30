"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { authErrorKey, logout, useAuth } from "@/components/auth";
import { useLang } from "@/components/lang";
import { LangSelect } from "@/components/lang-select";
import { LocationFields, type Location } from "@/components/location-fields";
import { btn, Card, cx, input, Logo, Spinner } from "@/components/ui";
import { toast } from "@/components/toast";

const saveProfile = (uid: string, name: string, email: string, loc: Location) =>
  setDoc(doc(db, "users", uid), { name: name.trim(), email, ...loc, place: loc.place.trim(), createdAt: serverTimestamp() });

export default function Login() {
  const router = useRouter();
  const { t } = useLang();
  const a = t.auth;
  const { user, profile, official, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loc, setLoc] = useState<Location>({ state: "Maharashtra", district: "Beed", place: "" });
  const [busy, setBusy] = useState(false);
  const [signingUp, setSigningUp] = useState(false); // hides the "complete profile" step while sign-up writes the profile
  const [error, setError] = useState<keyof typeof a>();

  useEffect(() => {
    if (user && profile) router.replace("/citizen");
  }, [user, profile, router]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      if ((e as { code?: string }).code !== "auth/popup-closed-by-user") setError(authErrorKey(e) as keyof typeof a);
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (mode === "signin") return signInWithEmailAndPassword(auth, email, password);
      setSigningUp(true);
      try {
        const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(u, { displayName: name.trim() });
        await saveProfile(u.uid, name, email, loc);
        sendEmailVerification(u).catch(() => {}); // ponytail: sent, not enforced
      } finally {
        setSigningUp(false);
      }
    });
  };

  const resetPassword = () => {
    if (!email) return setError("enterEmail");
    run(async () => {
      await sendPasswordResetEmail(auth, email);
      toast(a.resetSent);
    });
  };

  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-orange-100 to-indigo-100 px-4 py-6">
      <header className="flex w-full max-w-md items-center justify-between">
        <Link href="/"><Logo /></Link>
        <LangSelect />
      </header>
      <Card className="fade-in mt-10 w-full max-w-md p-6 sm:p-8">{children}</Card>
      <Link href="/admin/login" className="mt-6 text-sm text-slate-600 hover:text-indigo-950">{a.official}</Link>
    </main>
  );

  if (!firebaseReady) return shell(<p className="text-sm text-red-600">{a.notConfigured}</p>);
  if (loading || (user && profile) || (user && signingUp)) return shell(<div className="grid place-items-center py-10"><Spinner /></div>);

  // Citizen and official sign-in share one Firebase session: an official landing here has no citizen profile.
  if (user && official)
    return shell(
      <div className="space-y-4 text-sm">
        <p>{a.officialSession}</p>
        <p className="text-slate-500">{a.signedInAs} <span className="font-medium text-indigo-950">{user.email}</span></p>
        <div className="flex gap-3">
          <Link href="/admin" className={cx(btn.primary, "flex-1")}>{a.toAdmin}</Link>
          <button onClick={logout} className={cx(btn.outline, "flex-1")}>{a.signOut}</button>
        </div>
      </div>,
    );

  // Signed in (e.g. via Google) but no profile yet: ask for location.
  if (user && !profile)
    return shell(
      <CompleteProfile
        defaultName={user.displayName ?? ""}
        email={user.email ?? ""}
        onSave={(n, l) => run(() => saveProfile(user.uid, n, user.email ?? "", l))}
        busy={busy}
        error={error && a[error]}
      />,
    );

  return shell(
    <>
      <h1 className="text-xl font-bold text-indigo-950">{a.welcome}</h1>
      <p className="mt-1 text-sm text-slate-500">{a.welcomeSub}</p>

      <button onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))} disabled={busy} className={cx(btn.outline, "mt-6 w-full")}>
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {a.google}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> {a.orEmail} <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submitEmail} className="space-y-3">
        {mode === "signup" && <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder={a.name} autoComplete="name" className={input} />}
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={a.email} autoComplete="email" className={input} />
        <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={a.password} autoComplete={mode === "signin" ? "current-password" : "new-password"} className={input} />
        {mode === "signup" && <LocationFields value={loc} onChange={setLoc} />}
        {error && <p role="alert" className="text-sm text-red-600">{a[error]}</p>}
        <button disabled={busy} className={cx(btn.accent, "w-full")}>{busy ? <Spinner className="text-indigo-950" /> : mode === "signin" ? a.signIn : a.signUp}</button>
      </form>

      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        {mode === "signin" && <button onClick={resetPassword} className="text-slate-500 hover:text-indigo-950">{a.forgot}</button>}
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(undefined); }} className="ml-auto font-medium text-orange-700 hover:underline">
          {mode === "signin" ? `${a.noAccount} ${a.signUp}` : `${a.haveAccount} ${a.signIn}`}
        </button>
      </div>
    </>,
  );
}

function CompleteProfile({ defaultName, email, onSave, busy, error }: { defaultName: string; email: string; onSave: (name: string, loc: Location) => void; busy: boolean; error?: string }) {
  const { t } = useLang();
  const [name, setName] = useState(defaultName);
  const [loc, setLoc] = useState<Location>({ state: "Maharashtra", district: "Beed", place: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(name, loc); }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-indigo-950">{t.auth.completeTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.auth.completeSub}</p>
        <p className="mt-3 text-xs text-slate-500">
          {t.auth.signedInAs} <span className="font-medium text-indigo-950">{email}</span> · {t.auth.notYou}{" "}
          <button type="button" onClick={logout} className="font-medium text-orange-700 underline">{t.auth.signOut}</button>
        </p>
      </div>
      <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.auth.name} className={input} />
      <LocationFields value={loc} onChange={setLoc} />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className={cx(btn.accent, "w-full")}>{busy ? <Spinner className="text-indigo-950" /> : t.auth.save}</button>
    </form>
  );
}
