"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Bike,
  Store,
  RefreshCw,
  Zap,
} from "lucide-react";
import { PlatformFleetMap, MerchantPin, RiderPin, OrderVector } from "@/components/admin/PlatformFleetMap";
import { LiveActivityFeed, ActivityEvent } from "@/components/admin/LiveActivityFeed";

interface AdminStats {
  gmv: number;
  netRevenue: number;
  totalActiveOrders: number;
  onlineRidersCount: number;
  activeMerchantsCount: number;
  totalMerchantsCount: number;
  escrowPendingTotal: number;
}

export default function AdminCommandCenterPage() {
  const [stats, setStats] = useState<AdminStats>({
    gmv: 14850000,
    netRevenue: 2227500,
    totalActiveOrders: 34,
    onlineRidersCount: 18,
    activeMerchantsCount: 22,
    totalMerchantsCount: 26,
    escrowPendingTotal: 4620000,
  });

  const [fleetMerchants, setFleetMerchants] = useState<MerchantPin[]>([]);
  const [fleetRiders, setFleetRiders] = useState<RiderPin[]>([]);
  const [orderVectors, setOrderVectors] = useState<OrderVector[]>([]);
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (json.success) {
        if (json.stats) setStats(json.stats);
        if (json.fleetMerchants) setFleetMerchants(json.fleetMerchants);
        if (json.fleetRiders) setFleetRiders(json.fleetRiders);
        if (json.orderVectors) setOrderVectors(json.orderVectors);
        if (json.recentEvents) setRecentEvents(json.recentEvents);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (!ignore && json.success) {
          if (json.stats) setStats(json.stats);
          if (json.fleetMerchants) setFleetMerchants(json.fleetMerchants);
          if (json.fleetRiders) setFleetRiders(json.fleetRiders);
          if (json.orderVectors) setOrderVectors(json.orderVectors);
          if (json.recentEvents) setRecentEvents(json.recentEvents);
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Command Center Overview
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time telemetry across Lagos Island & Mainland delivery zones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gross Merchandise Value (GMV) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              GMV (Platform Volume)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-slate-900">
            ₦{stats.gmv.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">
              +14.2%
            </span>
            <span className="text-slate-400 font-normal">vs previous period</span>
          </div>
        </div>

        {/* Net Platform Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Platform Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-emerald-600">
            ₦{stats.netRevenue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span>Take-rate ~15% commission</span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-blue-600">
            {stats.totalActiveOrders} Live
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span>In kitchen prep & transit</span>
          </div>
        </div>

        {/* Online Riders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Online Couriers
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <Bike className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-cyan-600">
            {stats.onlineRidersCount} Drivers
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-700">
            <Zap className="h-3 w-3" />
            <span>Streaming GPS telemetry</span>
          </div>
        </div>

        {/* Active Kitchens */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Open Kitchens
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-slate-900">
            {stats.activeMerchantsCount}
            <span className="text-sm font-normal text-slate-400">/{stats.totalMerchantsCount}</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span>Accepting dispatches</span>
          </div>
        </div>
      </div>

      {/* Main Operations Grid: Live Map (8 cols) + Activity Feed (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <PlatformFleetMap
            merchants={fleetMerchants}
            riders={fleetRiders}
            orderVectors={orderVectors}
            onRefresh={() => fetchDashboardData(true)}
          />
        </div>

        <div className="lg:col-span-4">
          <LiveActivityFeed initialEvents={recentEvents} />
        </div>
      </div>
    </div>
  );
}
