"use client";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, Megaphone, LogOut } from "lucide-react";
import { logout, useAuth } from "@/components/auth";
import { useLang } from "@/components/lang";
import { LangSelect } from "@/components/lang-select";
import { cx, Logo, Spinner } from "@/components/ui";

function Nav() {
  const path = usePathname();
  const { t } = useLang();
  const { profile } = useAuth();
  const initials = (profile?.name ?? "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const links = [
    { href: "/citizen", label: t.home, icon: Home },
    { href: "/citizen/requests", label: t.requests, icon: FileText },
    { href: "/citizen/announcements", label: t.announcements, icon: Megaphone },
  ];
  const active = (href: string) => (href === "/citizen" ? path === href : path.startsWith(href));
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 sm:gap-4">
          <Link href="/"><Logo /></Link>
          <nav className="ml-6 hidden gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cx("rounded-lg px-3 py-2 text-sm font-medium", active(l.href) ? "bg-indigo-50 text-indigo-950" : "text-slate-600 hover:bg-slate-50")}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto"><LangSelect /></div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">{initials}</span>
            <div className="hidden text-sm leading-tight sm:block">
              <p className="font-medium">{profile?.name}</p>
              <p className="text-xs text-slate-500">{profile?.place}, {profile?.district}</p>
            </div>
            <button onClick={logout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-950" aria-label={t.auth.signOut} title={t.auth.signOut}>
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>
      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-slate-200 bg-white md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={cx("flex flex-col items-center gap-1 py-2.5 text-xs", active(l.href) ? "text-orange-700" : "text-slate-500")}>
            <l.icon className="size-5" />
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  // ponytail: client-side guard; real data protection lives in Firestore rules / API checks.
  useEffect(() => {
    if (!loading && !(user && profile)) router.replace("/login");
  }, [loading, user, profile, router]);
  if (!(user && profile)) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:pb-12">{children}</main>
    </>
  );
}
