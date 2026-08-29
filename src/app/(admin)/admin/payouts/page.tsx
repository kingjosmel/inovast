"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Building2,
  Bike,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { PayoutsTable, PayoutRecord } from "@/components/admin/PayoutsTable";

interface EscrowSummary {
  totalEscrowHeld: number;
  merchantEscrow: number;
  riderEscrow: number;
  platformCommissionHold: number;
  pendingCount: number;
  settledCount: number;
}

export default function AdminPayoutsPage() {
  const [summary, setSummary] = useState<EscrowSummary>({
    totalEscrowHeld: 4620000,
    merchantEscrow: 3840000,
    riderEscrow: 780000,
    platformCommissionHold: 693000,
    pendingCount: 6,
    settledCount: 14,
  });

  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchPayoutsData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/payouts");
      const json = await res.json();
      if (json.success) {
        if (json.summary) setSummary(json.summary);
        if (json.payouts) setPayouts(json.payouts);
      }
    } catch (err) {
      console.error("Failed to load payouts data:", err);
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/payouts");
        const json = await res.json();
        if (!ignore && json.success) {
          if (json.summary) setSummary(json.summary);
          if (json.payouts) setPayouts(json.payouts);
        }
      } catch (err) {
        console.error("Failed to load payouts data:", err);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-xs">
              <Wallet className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Escrow & Batch Payout Manager
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated Paystack bank transfers with compliance hold release controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchPayoutsData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync Balances</span>
          </button>
        </div>
      </div>

      {/* Escrow Balances Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Escrow Held */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Escrow Held
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-slate-900">
            ₦{summary.totalEscrowHeld.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Held pending order completion</p>
        </div>

        {/* Merchant Escrow */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Merchant Payables
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-amber-600">
            ₦{summary.merchantEscrow.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <Clock className="h-3 w-3" />
            <span>T+1 Settlement batch</span>
          </div>
        </div>

        {/* Rider Escrow */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Courier Delivery Earnings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <Bike className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-cyan-600">
            ₦{summary.riderEscrow.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-cyan-700">
            <CheckCircle2 className="h-3 w-3" />
            <span>Calculated base + km + surge</span>
          </div>
        </div>

        {/* Platform Commission Withheld */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Commission Withheld
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-emerald-600">
            ₦{summary.platformCommissionHold.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Platform earnings retained</p>
        </div>
      </div>

      {/* Payouts Interactive Table */}
      <PayoutsTable payouts={payouts} onActionComplete={() => fetchPayoutsData(true)} />
    </div>
  );
}
