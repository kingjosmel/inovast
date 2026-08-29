import Link from "next/link";
import { Utensils, Home, ShoppingBag, Store, Bike, ArrowRight } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | FoodGo",
  description: "The page or restaurant you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-6">
        {/* Visual Badge & Icon */}
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-xl shadow-orange-500/25">
          <Utensils className="h-14 w-14" />
          <span className="absolute -bottom-2 -right-2 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-black text-white ring-4 ring-slate-50">
            404
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Dish or Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
            We couldn&apos;t find the page or restaurant you requested. It might have moved, closed, or the URL might be mistyped.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            <span>Explore Restaurants</span>
          </Link>

          <Link
            href="/cart"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4 text-orange-500" />
            <span>View Active Cart</span>
          </Link>
        </div>

        {/* Quick Portal Links */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Other FoodGo Portals
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/merchant/dashboard"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Merchant Portal</h4>
                  <p className="text-[11px] text-slate-500">Kitchen & order management</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              href="/rider/dashboard"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bike className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Rider Console</h4>
                  <p className="text-[11px] text-slate-500">Fleet & dispatch system</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
