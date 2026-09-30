"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

// ponytail: event-bus toast, no provider needed; swap for sonner if stacking/actions are ever needed.
export const toast = (msg: string) => window.dispatchEvent(new CustomEvent("jv-toast", { detail: msg }));

export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    const onToast = (e: Event) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, msg: (e as CustomEvent<string>).detail }]);
      setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
    };
    window.addEventListener("jv-toast", onToast);
    return () => window.removeEventListener("jv-toast", onToast);
  }, []);
  return (
    <div aria-live="polite" className="fixed inset-x-4 bottom-20 z-50 md:bottom-4 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
      {items.map((t) => (
        <div key={t.id} className="fade-in flex items-center gap-2 rounded-xl bg-indigo-950 px-4 py-3 text-sm text-white shadow-lg">
          <CheckCircle2 className="size-4 text-green-400" /> {t.msg}
        </div>
      ))}
    </div>
  );
}
