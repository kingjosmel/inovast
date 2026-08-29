"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChefHat, RefreshCw, LayoutDashboard, UtensilsCrossed } from "lucide-react";

interface MerchantErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MerchantError({ error, reset }: MerchantErrorProps) {
  useEffect(() => {
    console.error("Merchant Portal Error:", error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 shadow-inner">
          <ChefHat className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Kitchen Display Disconnected
        </h2>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          We lost connection to the kitchen dispatch feed or inventory system. Your orders and menu data remain safely saved.
        </p>

        {error.digest && (
          <p className="mt-2 text-[11px] font-mono text-slate-400">
            Trace Ref: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Kitchen</span>
          </button>

          <Link
            href="/merchant/dashboard"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            href="/merchant/menu"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Manage Menu & Stock Inventory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
