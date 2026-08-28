"use client";

import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";

import { DollarSign, Home, MapPinned, Navigation } from "lucide-react";

const navigation = [
  { label: "Home", href: "/rider", icon: Home },
  { label: "Active Trip", href: "/rider/trip", icon: Navigation },
  { label: "Earnings", href: "/rider/earnings", icon: DollarSign },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["RIDER", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rider</p>
            <h1 className="text-xl font-bold">Live map</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <MapPinned className="h-3.5 w-3.5" />
            Available
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1 px-2 py-2">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
    </RoleGuard>
  );
}
