"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Inbox, BrainCircuit, Megaphone, Settings, ShieldCheck, LogOut } from "lucide-react";
import { areaLabel } from "@/lib/firebase";
import { logout, useAuth } from "@/components/auth";
import { cx, Logo, Spinner } from "@/components/ui";
import { LangProvider } from "@/components/lang";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/ai", label: "AI Insights", icon: BrainCircuit },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/officials", label: "Officials", icon: ShieldCheck, superadmin: true },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, official, loading } = useAuth();
  const isLogin = path === "/admin/login";

  // ponytail: client-side guard; the officials API re-checks the role server-side on every call.
  useEffect(() => {
    if (!isLogin && !loading && !official) router.replace("/admin/login");
  }, [isLogin, loading, official, router]);

  // ponytail: admin console is English-only; nested provider shields it from the citizen language choice.
  if (isLogin) return <LangProvider>{children}</LangProvider>;
  if (!official) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;

  const links = LINKS.filter((l) => !l.superadmin || official.role === "superadmin");
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  const name = user?.displayName || user?.email || "";
  const initials = name.split(/[\s@.]/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <LangProvider>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 text-slate-600 lg:flex">
          <Link href="/" className="mb-8 px-2 pt-1"><Logo /></Link>
          <nav className="space-y-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cx("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition", active(l.href) ? "bg-orange-100 text-indigo-950" : "hover:bg-slate-50 hover:text-indigo-950")}>
                <l.icon className={cx("size-4", active(l.href) && "text-orange-700")} /> {l.label}
              </Link>
            ))}
          </nav>
          <p className="mt-auto px-2 text-xs text-slate-500">Area: {areaLabel(official)}</p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <div className="lg:hidden"><Logo /></div>
              <div className="ml-auto flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-900">{initials}</span>
                <div className="hidden text-sm leading-tight sm:block">
                  <p className="font-medium">{name}</p>
                  <p className="text-xs capitalize text-slate-500">{official.role} · {areaLabel(official)}</p>
                </div>
                <button onClick={logout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-950" aria-label="Sign out" title="Sign out">
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={cx("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm", active(l.href) ? "bg-orange-100 font-medium text-indigo-950" : "text-slate-600")}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </LangProvider>
  );
}
