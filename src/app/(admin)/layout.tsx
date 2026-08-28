"use client";

import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";

import { BarChart3, Building2, CircleDollarSign, ShieldCheck, SlidersHorizontal } from "lucide-react";

const navigation = [
  { label: "Command Center", href: "/admin", icon: ShieldCheck },
  { label: "Merchants", href: "/admin/merchants", icon: Building2 },
  { label: "Escrow / Payouts", href: "/admin/payouts", icon: CircleDollarSign },
  { label: "Surge Settings", href: "/admin/surge", icon: SlidersHorizontal },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 lg:block">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-sm font-bold text-white">
              A
            </div>
            <div>
              <p className="text-lg font-bold">AdminOS</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-800 p-4">
          <div className="rounded-xl bg-slate-900 p-3">
            <div className="flex items-center gap-2 text-violet-300">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.2em]">Ops health</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">Stable</p>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Operations</p>
              <h1 className="text-xl font-bold">Command Center</h1>
            </div>
            <div className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              Live
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
    </RoleGuard>
  );
}
