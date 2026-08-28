"use client";

import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";

import { BarChart3, CreditCard, LayoutDashboard, PackageCheck, UtensilsCrossed } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/merchant", icon: LayoutDashboard },
  { label: "Orders (Kanban)", href: "/merchant/orders", icon: PackageCheck },
  { label: "Menu & Stock", href: "/merchant/menu", icon: UtensilsCrossed },
  { label: "Earnings", href: "/merchant/earnings", icon: BarChart3 },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["MERCHANT_ADMIN", "SUPER_ADMIN"]}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
              M
            </div>
            <div>
              <p className="text-lg font-bold">Merchant Portal</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-3">
            <div className="rounded-full bg-emerald-500 p-2 text-white">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Payout status</p>
              <p className="text-sm font-semibold text-slate-800">On track</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <h1 className="text-xl font-bold">Merchant hub</h1>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Online
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
    </RoleGuard>
  );
}
