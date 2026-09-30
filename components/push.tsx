"use client";
import { useEffect, useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { Bell, BellOff, BellRing } from "lucide-react";
import { app, auth } from "@/lib/firebase";
import { useLang } from "@/components/lang";
import { btn, cx, Spinner } from "@/components/ui";

async function register() {
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(getMessaging(app), { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
  const res = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error("register failed");
}

/** Opt-in to Firebase Cloud Messaging push for status changes and area announcements. */
export function PushToggle() {
  const { t } = useLang();
  const [state, setState] = useState<"unsupported" | "default" | "granted" | "denied" | "busy">();

  useEffect(() => {
    isSupported().then((ok) => {
      if (!ok || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) return setState("unsupported");
      const p = Notification.permission;
      setState(p);
      if (p === "granted") register().catch(console.error); // tokens rotate; re-register quietly each visit
    });
  }, []);

  if (!state || state === "unsupported") return null;
  const enable = async () => {
    setState("busy");
    const p = await Notification.requestPermission();
    if (p === "granted") await register().catch(console.error);
    setState(p);
  };
  if (state === "granted")
    return <p className="flex items-center gap-2 text-sm text-green-700"><BellRing className="size-4" /> {t.push.on}</p>;
  if (state === "denied")
    return <p className="flex items-center gap-2 text-sm text-slate-500"><BellOff className="size-4" /> {t.push.blocked}</p>;
  return (
    <button onClick={enable} disabled={state === "busy"} className={cx(btn.outline, "w-full sm:w-auto")}>
      {state === "busy" ? <Spinner /> : <Bell className="size-4 text-orange-600" />} {t.push.enable}
    </button>
  );
}
