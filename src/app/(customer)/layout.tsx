import Link from "next/link";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerMobileMenu } from "@/components/customer/CustomerMobileMenu";
import { LocationSelectorModal } from "@/components/customer/LocationSelectorModal";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <CustomerMobileMenu />
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-lg font-bold text-white shadow-sm shadow-orange-500/20">
                F
              </div>
              <div>
                <p className="text-lg font-black tracking-tight text-slate-900">Zestora</p>
              </div>
            </Link>
          </div>

          <CustomerHeader />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <LocationSelectorModal />

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© 2026 Zestora - Multi-Portal On-Demand Delivery</p>
          <div className="flex gap-4">
            <Link href="/help" className="hover:text-slate-900 transition">Help</Link>
            <Link href="/terms" className="hover:text-slate-900 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

