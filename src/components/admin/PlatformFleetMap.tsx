"use client";

import { useState, useEffect } from "react";
import {
  Navigation,
  Store,
  Zap,
  Radio,
  BatteryCharging,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";

export interface MerchantPin {
  id: string;
  name: string;
  branch: string;
  lat: number;
  lng: number;
  activeOrders: number;
  isOpen: boolean;
  category: string;
}

export interface RiderPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "AVAILABLE" | "BUSY" | "OFFLINE";
  heading: number;
  vehicle: string;
  battery: number;
  activeOrderNumber?: string | null;
}

export interface OrderVector {
  id: string;
  orderNumber: string;
  origin: [number, number]; // [lat, lng]
  destination: [number, number];
  riderPosition: [number, number];
  status: string;
}

interface PlatformFleetMapProps {
  merchants?: MerchantPin[];
  riders?: RiderPin[];
  orderVectors?: OrderVector[];
  onRefresh?: () => void;
}

const defaultMerchants: MerchantPin[] = [
  { id: "m1", name: "Mega Chicken", branch: "Victoria Island", lat: 6.4281, lng: 3.4246, activeOrders: 8, isOpen: true, category: "Fast Food" },
  { id: "m2", name: "The Place", branch: "Lekki Phase 1", lat: 6.4474, lng: 3.4731, activeOrders: 12, isOpen: true, category: "African & Continental" },
  { id: "m3", name: "Sweet Sensation", branch: "Ikeja GRA", lat: 6.5891, lng: 3.3562, activeOrders: 5, isOpen: true, category: "Bakery & Grills" },
  { id: "m4", name: "Domino's Pizza", branch: "Ikoyi", lat: 6.4549, lng: 3.4354, activeOrders: 9, isOpen: true, category: "Pizza & Wings" },
  { id: "m5", name: "Kilimanjaro", branch: "Yaba", lat: 6.5165, lng: 3.3768, activeOrders: 8, isOpen: true, category: "Fast Food" },
];

const defaultRiders: RiderPin[] = [
  { id: "r1", name: "Tunde Bakare", lat: 6.4320, lng: 3.4280, status: "BUSY", heading: 45, vehicle: "Motorcycle", battery: 92, activeOrderNumber: "ORD-9421" },
  { id: "r2", name: "Chinedu Okafor", lat: 6.4490, lng: 3.4690, status: "BUSY", heading: 180, vehicle: "Motorcycle", battery: 78, activeOrderNumber: "ORD-9425" },
  { id: "r3", name: "Ibrahim Musa", lat: 6.5850, lng: 3.3600, status: "AVAILABLE", heading: 90, vehicle: "Bicycle", battery: 85, activeOrderNumber: null },
  { id: "r4", name: "Emeka Obi", lat: 6.4520, lng: 3.4310, status: "BUSY", heading: 270, vehicle: "Motorcycle", battery: 64, activeOrderNumber: "ORD-9430" },
  { id: "r5", name: "Amina Yusuf", lat: 6.5120, lng: 3.3720, status: "AVAILABLE", heading: 15, vehicle: "Scooter", battery: 95, activeOrderNumber: null },
  { id: "r6", name: "David Adeleke", lat: 6.4380, lng: 3.4410, status: "BUSY", heading: 120, vehicle: "Motorcycle", battery: 51, activeOrderNumber: "ORD-9433" },
];

const defaultVectors: OrderVector[] = [
  { id: "v1", orderNumber: "ORD-9421", origin: [6.4281, 3.4246], destination: [6.4350, 3.4320], riderPosition: [6.4320, 3.4280], status: "OUT_FOR_DELIVERY" },
  { id: "v2", orderNumber: "ORD-9425", origin: [6.4474, 3.4731], destination: [6.4560, 3.4810], riderPosition: [6.4490, 3.4690], status: "PICKED_UP" },
  { id: "v3", orderNumber: "ORD-9430", origin: [6.4549, 3.4354], destination: [6.4620, 3.4420], riderPosition: [6.4520, 3.4310], status: "OUT_FOR_DELIVERY" },
];

export function PlatformFleetMap({
  merchants: propsMerchants = [],
  riders: propsRiders = [],
  orderVectors: propsVectors = [],
  onRefresh,
}: PlatformFleetMapProps) {
  const merchants = propsMerchants.length > 0 ? propsMerchants : defaultMerchants;
  const vectors = propsVectors.length > 0 ? propsVectors : defaultVectors;

  const [simulatedRiders, setSimulatedRiders] = useState<RiderPin[]>(() =>
    propsRiders.length > 0 ? propsRiders : defaultRiders
  );

  const [showRiders, setShowRiders] = useState<boolean>(true);
  const [showMerchants, setShowMerchants] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: "MERCHANT" | "RIDER" | "VECTOR";
    data: MerchantPin | RiderPin | OrderVector;
  } | null>(null);

  // Live simulation tick for rider movements across Lagos grid
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedRiders((prev) =>
        prev.map((r) => {
          if (r.status === "OFFLINE") return r;
          const latDelta = (Math.random() - 0.5) * 0.0008;
          const lngDelta = (Math.random() - 0.5) * 0.0008;
          return {
            ...r,
            lat: Number((r.lat + latDelta).toFixed(4)),
            lng: Number((r.lng + lngDelta).toFixed(4)),
            battery: Math.max(10, r.battery - (Math.random() > 0.8 ? 1 : 0)),
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Map coordinate boundary projection (Lagos bounds: lat ~ 6.40 to 6.62, lng ~ 3.32 to 3.52)
  const minLat = 6.40;
  const maxLat = 6.62;
  const minLng = 3.32;
  const maxLng = 3.52;

  const projectToPercent = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Invert Y because SVG/HTML origin is top-left
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      left: `${Math.min(94, Math.max(6, x))}%`,
      top: `${Math.min(92, Math.max(8, y))}%`,
      rawX: Math.min(94, Math.max(6, x)),
      rawY: Math.min(92, Math.max(8, y)),
    };
  };

  return (
    <div
      id="platform-fleet-map-container"
      className={`relative flex flex-col rounded-2xl border border-slate-800 bg-slate-950 text-white overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-2rem)]" : "h-[460px] sm:h-[520px]"
      }`}
    >
      {/* Top Header & Layer Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/90 px-4 py-3 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-slate-100">Lagos Metro Fleet Radar</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Telemetry
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {simulatedRiders.filter((r) => r.status !== "OFFLINE").length} Riders active • {merchants.length} Kitchens open • {vectors.length} In-transit routes
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setShowMerchants(!showMerchants)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition border ${
              showMerchants
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-slate-800/40 border-slate-800 text-slate-500"
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Merchants</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRiders(!showRiders)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition border ${
              showRiders
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                : "bg-slate-800/40 border-slate-800 text-slate-500"
            }`}
          >
            <Navigation className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Riders</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVectors(!showVectors)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition border ${
              showVectors
                ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                : "bg-slate-800/40 border-slate-800 text-slate-500"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Routes</span>
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-slate-800 bg-slate-800/60 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Refresh Telemetry"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-lg border border-slate-800 bg-slate-800/60 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Radar"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Map Visual Canvas */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden select-none">
        {/* Radar Background Grid & Zone Watermarks */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {/* Lagos Zone Labels */}
        <div className="absolute left-[20%] top-[25%] pointer-events-none text-[11px] font-mono uppercase tracking-[0.2em] text-slate-700">
          Ikeja / Mainland
        </div>
        <div className="absolute left-[38%] top-[52%] pointer-events-none text-[11px] font-mono uppercase tracking-[0.2em] text-slate-700">
          Yaba / Tech District
        </div>
        <div className="absolute right-[32%] bottom-[28%] pointer-events-none text-[11px] font-mono uppercase tracking-[0.2em] text-slate-700">
          Victoria Island & Ikoyi
        </div>
        <div className="absolute right-[12%] bottom-[18%] pointer-events-none text-[11px] font-mono uppercase tracking-[0.2em] text-slate-700">
          Lekki Phase 1 / Expressway
        </div>

        {/* SVG Route Trajectory Lines */}
        {showVectors && (
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <defs>
              <linearGradient id="vectorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {vectors.map((vec) => {
              const orig = projectToPercent(vec.origin[0], vec.origin[1]);
              const dest = projectToPercent(vec.destination[0], vec.destination[1]);
              return (
                <g key={vec.id}>
                  {/* Trajectory dashed line */}
                  <line
                    x1={`${orig.rawX}%`}
                    y1={`${orig.rawY}%`}
                    x2={`${dest.rawX}%`}
                    y2={`${dest.rawY}%`}
                    stroke="url(#vectorGradient)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Destination pin marker */}
                  <circle
                    cx={`${dest.rawX}%`}
                    cy={`${dest.rawY}%`}
                    r="4"
                    fill="#a855f7"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Merchant Pins */}
        {showMerchants &&
          merchants.map((m) => {
            const pos = projectToPercent(m.lat, m.lng);
            const isSelected = selectedEntity?.type === "MERCHANT" && selectedEntity.data.id === m.id;

            return (
              <button
                type="button"
                key={m.id}
                onClick={() => setSelectedEntity({ type: "MERCHANT", data: m })}
                style={{ left: pos.left, top: pos.top }}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform ${
                  isSelected ? "scale-125 z-30" : "hover:scale-115 z-20"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute -inset-1 rounded-full bg-amber-500/20 blur-xs" />
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold shadow-lg border border-amber-300">
                    <Store className="h-3.5 w-3.5" />
                  </div>
                  {m.activeOrders > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow">
                      {m.activeOrders}
                    </span>
                  )}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-40">
                  <div className="rounded-lg bg-slate-900/95 border border-slate-700 px-2.5 py-1 text-center shadow-xl whitespace-nowrap">
                    <p className="text-xs font-bold text-amber-400">{m.name}</p>
                    <p className="text-[10px] text-slate-300">{m.branch} • {m.activeOrders} live orders</p>
                  </div>
                </div>
              </button>
            );
          })}

        {/* Rider Pins */}
        {showRiders &&
          simulatedRiders.map((r) => {
            const pos = projectToPercent(r.lat, r.lng);
            const isBusy = r.status === "BUSY";
            const isSelected = selectedEntity?.type === "RIDER" && selectedEntity.data.id === r.id;

            return (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelectedEntity({ type: "RIDER", data: r })}
                style={{ left: pos.left, top: pos.top }}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-1000 ease-out ${
                  isSelected ? "scale-125 z-30" : "hover:scale-115 z-20"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {/* Ping effect for active riders */}
                  {isBusy && (
                    <span className="absolute -inset-1.5 rounded-full bg-cyan-400 opacity-60 animate-ping" />
                  )}
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full shadow-lg border text-white ${
                      isBusy
                        ? "bg-cyan-600 border-cyan-300"
                        : "bg-slate-800 border-slate-600 text-slate-300"
                    }`}
                  >
                    <Navigation
                      className="h-3 w-3"
                      style={{ transform: `rotate(${r.heading}deg)` }}
                    />
                  </div>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-40">
                  <div className="rounded-lg bg-slate-900/95 border border-slate-700 px-2.5 py-1 text-center shadow-xl whitespace-nowrap">
                    <p className="text-xs font-bold text-cyan-400">{r.name}</p>
                    <p className="text-[10px] text-slate-300">
                      {r.vehicle} • {r.status} {r.activeOrderNumber ? `(${r.activeOrderNumber})` : ""}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

        {/* Selected Entity Inspector Card (Bottom Left Overlay) */}
        {selectedEntity && (
          <div className="absolute bottom-4 left-4 max-w-xs w-full rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md z-30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {selectedEntity.type === "MERCHANT" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Store className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Navigation className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedEntity.type} INSPECTOR
                  </span>
                  <h4 className="text-sm font-bold text-slate-100 truncate">
                    {"name" in selectedEntity.data ? selectedEntity.data.name : "Active Route"}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-2.5 border-t border-slate-800 pt-2 text-xs space-y-1 text-slate-300">
              {selectedEntity.type === "MERCHANT" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branch:</span>
                    <span className="font-semibold">{(selectedEntity.data as MerchantPin).branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Live Orders:</span>
                    <span className="font-bold text-amber-400">
                      {(selectedEntity.data as MerchantPin).activeOrders} in prep
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="font-mono text-[11px]">
                      {(selectedEntity.data as MerchantPin).lat.toFixed(4)}, {(selectedEntity.data as MerchantPin).lng.toFixed(4)}
                    </span>
                  </div>
                </>
              )}

              {selectedEntity.type === "RIDER" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`font-bold ${
                        (selectedEntity.data as RiderPin).status === "BUSY"
                          ? "text-cyan-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {(selectedEntity.data as RiderPin).status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle:</span>
                    <span>{(selectedEntity.data as RiderPin).vehicle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Battery:</span>
                    <span className="flex items-center gap-1 font-mono text-emerald-400">
                      <BatteryCharging className="h-3 w-3" />
                      {(selectedEntity.data as RiderPin).battery}%
                    </span>
                  </div>
                  {(selectedEntity.data as RiderPin).activeOrderNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Order:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {(selectedEntity.data as RiderPin).activeOrderNumber}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Legend Overlay (Bottom Right) */}
        <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-3 rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-md pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            <span>Merchants</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            <span>Active Riders</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-violet-400" />
            <span>Delivery Routes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
