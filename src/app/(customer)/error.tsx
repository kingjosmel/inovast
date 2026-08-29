"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShoppingBag } from "lucide-react";

interface CustomerErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CustomerError({ error, reset }: CustomerErrorProps) {
  useEffect(() => {
    // Log unexpected customer portal errors
    console.error("Customer Portal Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-5 shadow-inner">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Something went wrong
        </h2>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          We encountered an unexpected issue while loading your food feed or restaurant details.
        </p>

        {error.digest && (
          <p className="mt-2 text-[11px] font-mono text-slate-400">
            Error Ref: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Home className="h-4 w-4" />
            <span>Explore Restaurants</span>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>View your active cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
