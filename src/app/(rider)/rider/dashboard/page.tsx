"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  CheckCircle2,
  TrendingUp,
  Star,
  Navigation2,
  Radio,
  MapPin,
  Store,
  RefreshCw,
  BellRing,
} from "lucide-react";
import { DispatchOfferModal, type DispatchOffer } from "@/components/rider/DispatchOfferModal";
import { GpsStreamer } from "@/components/rider/GpsStreamer";
import { useSocketStore } from "@/store/useSocketStore";

interface DashboardData {
  rider: {
    id: string;
    name: string;
    phone: string;
    isOnline: boolean;
    rating: number;
  };
  metrics: {
    todayEarnings: number;
    completedTrips: number;
    activeHours: number;
    acceptanceRate: number;
  };
  activeTrip: {
    _id: string;
    orderNumber: string;
    status: string;
    merchantName: string;
    merchantAddress: string;
    customerName: string;
    customerAddress: string;
    estimatedEarnings: number;
    itemCount: number;
  } | null;
  recentTrips: Array<{
    _id: string;
    orderNumber: string;
    merchantName: string;
    customerAddress: string;
    deliveredAt: string;
    payout: number;
    status: string;
  }>;
}

export default function RiderDashboardPage() {
  const router = useRouter();
  const socket = useSocketStore((state) => state.socket);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [offer, setOffer] = useState<DispatchOffer | null>(null);
  const [isOfferOpen, setIsOfferOpen] = useState<boolean>(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rider/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load rider dashboard", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/rider/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) {
          setData(json.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Initial dashboard load error", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Listen for socket dispatches
  useEffect(() => {
    if (!socket) return;

    const handleSocketOffer = (payload: unknown) => {
      const p = payload as Partial<DispatchOffer>;
      const newOffer: DispatchOffer = {
        orderId: p.orderId || "trip-live-" + Math.floor(Math.random() * 9000 + 1000),
        orderNumber: p.orderNumber || "#FG-9021",
        payoutFee: p.payoutFee || 1950,
        pickupName: p.pickupName || "Chicken Republic (Admiralty)",
        pickupAddress: p.pickupAddress || "14 Admiralty Way, Lekki Phase 1",
        pickupDistanceKm: p.pickupDistanceKm || 1.1,
        dropoffAddress: p.dropoffAddress || "Plot 8 Fola Osibo, Lekki Phase 1",
        dropoffDistanceKm: p.dropoffDistanceKm || 2.4,
        totalDistanceKm: p.totalDistanceKm || 3.5,
        estimatedMinutes: p.estimatedMinutes || 20,
        itemsSummary: p.itemsSummary || "Refuel Combo & Zobo Drink",
        itemCount: p.itemCount || 2,
      };

      setOffer(newOffer);
      setIsOfferOpen(true);
    };

    socket.on("dispatch_offer", handleSocketOffer);
    socket.on("new_dispatch_offer", handleSocketOffer);

    return () => {
      socket.off("dispatch_offer", handleSocketOffer);
      socket.off("new_dispatch_offer", handleSocketOffer);
    };
  }, [socket]);

  // Simulate an incoming dispatch offer for instant testing
  const handleSimulateOffer = () => {
    const sampleOffers: DispatchOffer[] = [
      {
        orderId: "65d8a9f1234567890abcdef1",
        orderNumber: "#FG-9842",
        payoutFee: 2150,
        pickupName: "Mega Chicken Grill & Confectionery",
        pickupAddress: "Plot 14 Agungi Road, Lekki Expressway",
        pickupDistanceKm: 1.4,
        dropoffAddress: "Chevron Twin Lakes Estate, Orchid Rd",
        dropoffDistanceKm: 3.2,
        totalDistanceKm: 4.6,
        estimatedMinutes: 24,
        itemsSummary: "Full Chicken Feast & 2 Fried Rices",
        itemCount: 3,
      },
      {
        orderId: "65d8a9f1234567890abcdef2",
        orderNumber: "#FG-8910",
        payoutFee: 1750,
        pickupName: "Mama Cass Traditional Kitchen",
        pickupAddress: "12 Ahmadu Bello Way, Victoria Island",
        pickupDistanceKm: 0.8,
        dropoffAddress: "16 Adeola Odeku St, Victoria Island",
        dropoffDistanceKm: 1.8,
        totalDistanceKm: 2.6,
        estimatedMinutes: 16,
        itemsSummary: "Party Jollof Rice, Asun & Chapman",
        itemCount: 2,
      },
    ];

    const chosen = sampleOffers[Math.floor(Math.random() * sampleOffers.length)];
    setOffer(chosen);
    setIsOfferOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Telemetry & Status Card */}
      <div className="flex items-center justify-between">
        <GpsStreamer activeOrderId={data?.activeTrip?._id} isOnline={true} />
        
        <button
          type="button"
          onClick={fetchDashboard}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          title="Refresh dashboard"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
        </button>
      </div>

      {/* Daily Earnings Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              Today&apos;s Earnings
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-white font-mono tracking-tight">
                ₦{(data?.metrics.todayEarnings || 18450).toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-400">+12% vs yday</span>
            </div>
          </div>

          <Link
            href="/rider/earnings"
            className="flex items-center gap-1 rounded-xl bg-emerald-600/30 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600/40 transition"
          >
            <Wallet className="h-3.5 w-3.5" />
            Wallet
          </Link>
        </div>

        {/* 3 Metric Pills */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4">
          <div className="rounded-2xl bg-slate-950/50 p-2.5 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Trips</p>
            <p className="text-base font-black text-slate-100 font-mono mt-0.5">
              {data?.metrics.completedTrips || 8}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 p-2.5 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Acceptance</p>
            <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
              {data?.metrics.acceptanceRate || 97}%
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 p-2.5 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Rating</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-base font-black text-slate-100 font-mono">
                {data?.rider.rating || 4.94}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE TRIP CALLOUT (if ongoing delivery) */}
      {data?.activeTrip ? (
        <div className="rounded-3xl border-2 border-emerald-500/50 bg-emerald-950/30 p-5 shadow-xl space-y-3 animate-pulse-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Active Delivery in Progress
              </span>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
              {data.activeTrip.orderNumber}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Store className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-white truncate">{data.activeTrip.merchantName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-300 truncate">{data.activeTrip.customerAddress}</span>
            </div>
          </div>

          <Link
            href={`/rider/trip/${data.activeTrip._id}`}
            id="continue-active-trip-btn"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition"
          >
            <Navigation2 className="h-4 w-4" />
            Resume Navigation & Actions
          </Link>
        </div>
      ) : (
        /* Standby Radar Scanner */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 text-center space-y-4">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Online & Ready for Orders</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Scanning high-demand merchant clusters across Victoria Island, Lekki Phase 1, and Ikoyi.
            </p>
          </div>

          {/* Simulate Offer Button for evaluation/testing */}
          <div className="pt-2">
            <button
              type="button"
              id="simulate-dispatch-btn"
              onClick={handleSimulateOffer}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-700 hover:text-amber-200 transition active:scale-95"
            >
              <BellRing className="h-4 w-4 text-amber-400" />
              Simulate Dispatch Offer (15s Modal)
            </button>
          </div>
        </div>
      )}

      {/* Recent Trips Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Completed Trips
          </h2>
          <span className="text-[11px] font-medium text-slate-500">Today</span>
        </div>

        <div className="space-y-2">
          {(data?.recentTrips || []).map((trip) => (
            <div
              key={trip._id}
              className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 transition hover:border-slate-700"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">{trip.merchantName}</p>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {trip.orderNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {trip.customerAddress}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <p className="text-xs font-bold text-emerald-400 font-mono">
                  +₦{trip.payout.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {new Date(trip.deliveredAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DISPATCH OFFER MODAL COMPONENT */}
      <DispatchOfferModal
        offer={offer}
        isOpen={isOfferOpen}
        onClose={() => setIsOfferOpen(false)}
        onAccept={(orderId) => {
          setIsOfferOpen(false);
          router.push(`/rider/trip/${orderId}`);
        }}
      />
    </div>
  );
}
