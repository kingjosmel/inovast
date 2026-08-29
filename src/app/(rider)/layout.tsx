"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DutyStatusToggle } from "@/components/rider/DutyStatusToggle";
import {
  LayoutDashboard,
  Navigation2,
  Wallet,
  Bike,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/rider/dashboard", icon: LayoutDashboard },
  { label: "Active Trip", href: "/rider/trip", icon: Navigation2 },
  { label: "Earnings", href: "/rider/earnings", icon: Wallet },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RoleGuard allowedRoles={["RIDER", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        {/* Mobile App Bar Header */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-tight text-white">FoodGo</span>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 uppercase">
                    Rider
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                  Dispatch & GPS Portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DutyStatusToggle />
            </div>
          </div>
        </header>

        {/* Main Content Area (Mobile Viewport Constrained) */}
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-24">
          {children}
        </main>

        {/* Fixed PWA Bottom Navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
          <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-3 py-1.5">
            {navigation.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/rider/dashboard"
                  ? pathname === "/rider" || pathname === "/rider/dashboard"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  id={`rider-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 px-1 text-[11px] font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </RoleGuard>
  );
}
