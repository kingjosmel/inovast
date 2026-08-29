"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Navigation2,
  ArrowRight,
} from "lucide-react";
import { GpsStreamer } from "@/components/rider/GpsStreamer";

export default function RiderTripIndexPage() {
  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    fetch("/api/rider/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          if (json.success && json.data?.activeTrip?._id) {
            router.replace(`/rider/trip/${json.data.activeTrip._id}`);
          }
        }
      })
      .catch((err) => {
        console.warn("Trip index check warning", err);
      });

    return () => {
      ignore = true;
    };
  }, [router]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <GpsStreamer isOnline={true} />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center space-y-4">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Navigation2 className="h-7 w-7" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-black text-white">No Active Trip</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            You are currently on standby. When a merchant dispatches an order, a live offer will appear on your screen.
          </p>
        </div>

        {/* Demo trip launcher */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <p className="text-xs text-slate-500">Need to preview the active trip execution interface?</p>
          <Link
            href="/rider/trip/demo-order-8821"
            id="launch-demo-trip-btn"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition active:scale-98"
          >
            <span>Launch Live Trip Console</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
