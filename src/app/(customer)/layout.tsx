import Link from "next/link";

import { Bell, ChevronDown, MapPin, Menu, ShoppingCart, User } from "lucide-react";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-slate-200 p-2 text-slate-700 md:hidden" type="button" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
                F
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">FoodGo</p>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 md:flex">
            <MapPin className="h-4 w-4 text-orange-500" />
            <span className="font-medium">Lagos</span>
            <span className="text-slate-400">•</span>
            <span>Ikeja</span>
            <ChevronDown className="h-4 w-4" />
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="rounded-full border border-slate-200 p-2 text-slate-700" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            <button type="button" className="relative rounded-full border border-slate-200 p-2 text-slate-700" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                2
              </span>
            </button>
            <button type="button" className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700" aria-label="Account menu">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© 2026 FoodGo</p>
          <div className="flex gap-4">
            <Link href="/help" className="hover:text-slate-900">Help</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
