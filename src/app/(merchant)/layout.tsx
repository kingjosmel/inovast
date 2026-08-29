"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  ChefHat,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Store,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/merchant/dashboard", icon: LayoutDashboard },
  { label: "Kitchen KDS (Kanban)", href: "/merchant/orders", icon: PackageCheck },
  { label: "Menu & Stock", href: "/merchant/menu", icon: UtensilsCrossed },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <RoleGuard allowedRoles={["MERCHANT_ADMIN", "SUPER_ADMIN"]}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        {/* Desktop Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          {/* Logo Header */}
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <Link href="/merchant/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-xs">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 leading-tight">FoodGo Kitchen</p>
                <p className="text-xs text-slate-500 font-medium">Merchant Portal</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 px-4 py-6">
            {navigation.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href ||
                (href === "/merchant/dashboard" && pathname === "/merchant");

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Live Kitchen Status Card */}
          <div className="mx-4 mb-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Real-Time Dispatch Engine</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700 leading-relaxed">
              KDS audio alerts active. Incoming orders sync live with Zero-Latency Socket.io.
            </p>
          </div>

          {/* User Profile Footer */}
          <div className="mt-auto border-t border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-100/80 p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {session?.user?.name?.[0] || "M"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {session?.user?.name || "Merchant Admin"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {session?.user?.role || "MERCHANT_ADMIN"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Bar for Mobile & Desktop */}
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6">
              {/* Mobile Branding */}
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                  <ChefHat className="h-4 w-4" />
                </div>
                <span className="font-bold text-slate-900 text-sm">Merchant Portal</span>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-600">
                  Store Operations & Kitchen Management
                </span>
              </div>

              {/* Status & Customer Portal Link */}
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Customer View
                </Link>

                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>KDS Online</span>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Tabs */}
            <div className="flex border-t border-slate-100 px-2 py-1.5 lg:hidden overflow-x-auto scrollbar-none">
              {navigation.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href ||
                  (href === "/merchant/dashboard" && pathname === "/merchant");

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
