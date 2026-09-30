"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ShieldCheck } from "lucide-react";
import { auth, firebaseReady } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { btn, Card, cx, input, Logo, Spinner } from "@/components/ui";
import { toast } from "@/components/toast";

// Officials only: accounts are created in Firebase Console, roles assigned by a superadmin. No sign-up here.
export default function OfficialLogin() {
  const router = useRouter();
  const { official, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (official) router.replace("/admin");
  }, [official, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const { claims } = await user.getIdTokenResult();
      if (claims.role !== "admin" && claims.role !== "superadmin") {
        await signOut(auth);
        setError("This account has no official role. Ask your superadmin to assign one.");
      }
    } catch {
      setError("Wrong email or password.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email) return setError("Enter your email first.");
    await sendPasswordResetEmail(auth, email).catch(() => {});
    toast("If this account exists, a reset email is on its way.");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <Card className="fade-in w-full max-w-sm p-8">
        <Logo />
        <h1 className="mt-6 flex items-center gap-2 text-xl font-bold text-indigo-950"><ShieldCheck className="size-5 text-orange-600" /> Official sign in</h1>
        <p className="mt-1 text-sm text-slate-500">For government officials. Accounts are issued by your administrator.</p>
        {!firebaseReady ? (
          <p className="mt-6 text-sm text-red-600">Firebase is not configured. Add your keys to .env.local (see .env.example).</p>
        ) : loading ? (
          <div className="grid place-items-center py-10"><Spinner /></div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Official email" autoComplete="username" className={input} />
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className={input} />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button disabled={busy} className={cx(btn.primary, "w-full")}>{busy ? <Spinner className="text-white" /> : "Sign in"}</button>
            <button type="button" onClick={reset} className="w-full text-center text-sm text-slate-500 hover:text-indigo-950">Forgot password?</button>
          </form>
        )}
      </Card>
      <Link href="/login" className="mt-6 text-sm text-slate-500 hover:text-indigo-950">Citizen? Sign in here</Link>
    </main>
  );
}
