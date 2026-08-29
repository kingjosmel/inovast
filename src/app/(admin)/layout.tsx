"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Store,
  Bike,
  SlidersHorizontal,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useSession, signOut } from "next-auth/react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    name: "Command Center",
    href: "/admin",
    icon: LayoutDashboard,
    badge: "Live",
  },
  {
    name: "Escrow & Payouts",
    href: "/admin/payouts",
    icon: Wallet,
    badge: null,
  },
  {
    name: "Merchants & Vendors",
    href: "/admin/merchants",
    icon: Store,
    badge: null,
  },
  {
    name: "Riders & Fleet",
    href: "/admin/riders",
    icon: Bike,
    badge: null,
  },
  {
    name: "Rates & Surge",
    href: "/admin/settings",
    icon: SlidersHorizontal,
    badge: null,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
        {/* Top Operational Bar */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-black shadow-xs">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-slate-900">
                  FOODGO
                </span>
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Operations & Escrow Command Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Platform Status Pill */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>

            {/* Admin User Badge */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-900">
                  {user?.name || "Platform Admin"}
                </p>
                <p className="text-[10px] text-slate-500">{user?.email || "admin@foodgo.ng"}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Admin Body Container */}
        <div className="flex flex-1">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-4 space-y-6">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Platform Management
              </span>
              <nav className="mt-2 space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/admin" && pathname === "/admin/dashboard") ||
                    (item.href === "/admin/settings" && pathname === "/admin/surge");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge ? (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-extrabold text-emerald-400">
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className={`h-3 w-3 ${isActive ? "text-slate-400" : "text-transparent"}`} />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Metrics Callout */}
            <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold">Settlement Cycle</span>
                <span className="font-mono text-[11px] font-bold text-slate-900">T+1 Daily</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold">Gateway</span>
                <span className="font-mono text-[11px] font-bold text-emerald-600">Paystack Live</span>
              </div>
            </div>
          </aside>

          {/* Mobile Bottom & Horizontal Nav */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/admin" && pathname === "/admin/dashboard") ||
                (item.href === "/admin/settings" && pathname === "/admin/surge");
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-bold ${
                    isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-amber-500" : "text-slate-400"}`} />
                  <span>{item.name.split(" ")[0]}</span>
                </Link>
              );
            })}
          </div>

          {/* Main Dashboard Canvas */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
