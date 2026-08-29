"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

interface TripEarning {
  id: string;
  orderNumber: string;
  merchant: string;
  destination: string;
  date: string;
  baseFee: number;
  distanceBonus: number;
  tip: number;
  total: number;
}

interface EarningsData {
  todayEarnings: number;
  weekEarnings: number;
  tipsEarned: number;
  availableBalance: number;
  tripsCountToday: number;
  trips: TripEarning[];
}

export default function RiderEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [cashingOut, setCashingOut] = useState<boolean>(false);
  const [cashoutSuccess, setCashoutSuccess] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/rider/earnings")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) {
          setData(json.data);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Earnings load error", err);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleCashout = () => {
    setCashingOut(true);
    setTimeout(() => {
      setCashingOut(false);
      setCashoutSuccess(true);
      if (data) {
        setData({
          ...data,
          availableBalance: 0,
        });
      }
      setTimeout(() => setCashoutSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* WALLET BALANCE CARD */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
            Instant Payout
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            ₦{(data?.availableBalance || 42600).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">Linked to Access Bank •••• 4092</p>
        </div>

        {/* Cash-out action */}
        <div>
          {cashoutSuccess ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 py-3 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>₦42,600 Transferred to Bank Account</span>
            </div>
          ) : (
            <button
              type="button"
              id="cashout-earnings-btn"
              onClick={handleCashout}
              disabled={cashingOut || (data?.availableBalance || 0) <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition active:scale-98 disabled:opacity-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>{cashingOut ? "Processing Transfer..." : "Cash Out to Bank Account"}</span>
            </button>
          )}
        </div>
      </div>

      {/* WEEKLY & DAILY OVERVIEW STATS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Today&apos;s Revenue</span>
          <p className="text-xl font-black text-white font-mono">
            ₦{(data?.todayEarnings || 18450).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">
            {data?.tripsCountToday || 8} completed trips
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Weekly Total</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            ₦{(data?.weekEarnings || 94200).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Incl. ₦7,500 tips</p>
        </div>
      </div>

      {/* TRIP RECEIPTS BREAKDOWN LIST */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Trip Earnings Breakdown
          </h3>
          <span className="text-xs text-slate-500">Recent Deliveries</span>
        </div>

        <div className="space-y-2">
          {(data?.trips || []).map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 space-y-2 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {t.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(t.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">{t.merchant}</p>
                  <p className="text-xs text-slate-400 truncate">{t.destination}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-emerald-400 font-mono">
                    +₦{t.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Breakdown Tags */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
                <span>Base: ₦{t.baseFee}</span>
                <span>•</span>
                <span>Dist: +₦{t.distanceBonus}</span>
                <span>•</span>
                <span className="text-amber-400">Tip: +₦{t.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
