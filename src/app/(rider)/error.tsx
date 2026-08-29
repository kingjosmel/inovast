"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bike, RefreshCw, Navigation, Wallet } from "lucide-react";

interface RiderErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RiderError({ error, reset }: RiderErrorProps) {
  useEffect(() => {
    console.error("Rider Portal Error:", error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5 shadow-inner">
          <Bike className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Dispatch Stream Interrupted
        </h2>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          The delivery route tracker or live GPS synchronization encountered a temporary interruption.
        </p>

        {error.digest && (
          <p className="mt-2 text-[11px] font-mono text-slate-400">
            Courier Session Ref: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reconnect GPS</span>
          </button>

          <Link
            href="/rider/dashboard"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Navigation className="h-4 w-4" />
            <span>Rider Console</span>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            href="/rider/earnings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>View your payout & wallet history</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
