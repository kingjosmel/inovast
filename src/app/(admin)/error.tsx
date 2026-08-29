"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw, LayoutDashboard, DollarSign, Users } from "lucide-react";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("Super Admin Portal Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-5 shadow-inner">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Command Center Telemetry Exception
        </h2>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          An error occurred while computing platform analytics or loading fleet coordinates. System audit logs and database records are secure.
        </p>

        {error.digest && (
          <div className="mt-3 inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-mono text-slate-600">
            Internal Diagnostic Digest: {error.digest}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            href="/admin"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Command Center</span>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
          <Link
            href="/admin/payouts"
            className="inline-flex items-center gap-1 hover:text-indigo-600"
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Payouts</span>
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/admin/merchants"
            className="inline-flex items-center gap-1 hover:text-indigo-600"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Merchants</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
