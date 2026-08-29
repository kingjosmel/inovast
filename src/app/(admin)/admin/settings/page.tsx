"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  Zap,
  DollarSign,
  CloudRain,
  Moon,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Percent,
  Calculator,
} from "lucide-react";

interface ZoneSurge {
  zone: string;
  multiplier: number;
  isActive: boolean;
}

export default function AdminSettingsSurgePage() {
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<number>(800);
  const [perKmRate, setPerKmRate] = useState<number>(150);
  const [platformServiceFeeRate, setPlatformServiceFeeRate] = useState<number>(5); // 5%
  const [globalSurgeMultiplier, setGlobalSurgeMultiplier] = useState<number>(1.2);
  const [zoneSurges, setZoneSurges] = useState<ZoneSurge[]>([
    { zone: "Victoria Island", multiplier: 1.4, isActive: true },
    { zone: "Lekki Phase 1", multiplier: 1.5, isActive: true },
    { zone: "Ikeja GRA", multiplier: 1.2, isActive: true },
    { zone: "Ikoyi", multiplier: 1.3, isActive: true },
    { zone: "Yaba / Tech Hub", multiplier: 1.2, isActive: false },
    { zone: "Surulere", multiplier: 1.1, isActive: false },
  ]);
  const [badWeatherSurge, setBadWeatherSurge] = useState<boolean>(false);
  const [nightSurge, setNightSurge] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Live simulation calculator distance
  const [previewDistanceKm, setPreviewDistanceKm] = useState<number>(5);
  const [previewZone, setPreviewZone] = useState<string>("Victoria Island");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.success && json.settings) {
        const s = json.settings;
        setBaseDeliveryFee(s.baseDeliveryFee ?? 800);
        setPerKmRate(s.perKmRate ?? 150);
        setPlatformServiceFeeRate((s.platformServiceFeeRate ?? 0.05) * 100);
        setGlobalSurgeMultiplier(s.globalSurgeMultiplier ?? 1.2);
        if (s.zoneSurges && s.zoneSurges.length > 0) {
          setZoneSurges(s.zoneSurges);
        }
        setBadWeatherSurge(Boolean(s.badWeatherSurge));
        setNightSurge(Boolean(s.nightSurge));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (!ignore && json.success && json.settings) {
          const s = json.settings;
          setBaseDeliveryFee(s.baseDeliveryFee ?? 800);
          setPerKmRate(s.perKmRate ?? 150);
          setPlatformServiceFeeRate((s.platformServiceFeeRate ?? 0.05) * 100);
          setGlobalSurgeMultiplier(s.globalSurgeMultiplier ?? 1.2);
          if (s.zoneSurges && s.zoneSurges.length > 0) {
            setZoneSurges(s.zoneSurges);
          }
          setBadWeatherSurge(Boolean(s.badWeatherSurge));
          setNightSurge(Boolean(s.nightSurge));
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseDeliveryFee,
          perKmRate,
          platformServiceFeeRate: platformServiceFeeRate / 100,
          globalSurgeMultiplier,
          zoneSurges,
          badWeatherSurge,
          nightSurge,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          message: "Dynamic rate and surge settings published to all client and dispatch nodes.",
          type: "success",
        });
      } else {
        setNotification({
          message: data.error || "Failed to save platform pricing",
          type: "error",
        });
      }
    } catch {
      setNotification({ message: "Network error saving settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateZoneMultiplier = (index: number, multiplier: number) => {
    setZoneSurges((prev) =>
      prev.map((z, i) => (i === index ? { ...z, multiplier } : z))
    );
  };

  const toggleZoneActive = (index: number) => {
    setZoneSurges((prev) =>
      prev.map((z, i) => (i === index ? { ...z, isActive: !z.isActive } : z))
    );
  };

  // Preview fee computation
  const activeZoneObj = zoneSurges.find((z) => z.zone === previewZone && z.isActive);
  const zoneMultiplier = activeZoneObj ? activeZoneObj.multiplier : 1.0;
  const weatherMultiplier = badWeatherSurge ? 1.3 : 1.0;
  const nightMultiplier = nightSurge ? 1.2 : 1.0;
  const effectiveMultiplier = globalSurgeMultiplier * zoneMultiplier * weatherMultiplier * nightMultiplier;

  const rawDeliveryCost = baseDeliveryFee + previewDistanceKm * perKmRate;
  const computedDeliveryFee = Math.round(rawDeliveryCost * effectiveMultiplier);
  const estimatedBasketAmount = 12000;
  const computedServiceFee = Math.round(estimatedBasketAmount * (platformServiceFeeRate / 100));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white font-bold shadow-xs">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Dynamic Rates & Surge Configurator
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure algorithmic pricing, weather multipliers, zone-based surge, and platform commission policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSettings}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            id="save-surge-settings-btn"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-400" />}
            <span>Publish Pricing</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Settings (7 cols) + Live Calculator Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Base Logistics Rates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Base Logistics Parameters
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base Delivery Fee (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={baseDeliveryFee}
                    onChange={(e) => setBaseDeliveryFee(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Minimum floor dispatch fare</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Per-Km Rate (₦/km)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={perKmRate}
                    onChange={(e) => setPerKmRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Distance multiplier per kilometer</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Platform Service Fee (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={platformServiceFeeRate}
                    onChange={(e) => setPlatformServiceFeeRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Customer platform fee %</p>
              </div>
            </div>
          </div>

          {/* Global Dynamic Surge Multiplier Slider */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Global Platform Surge Multiplier
                </h3>
              </div>
              <span
                className={`font-mono text-sm font-black px-2.5 py-0.5 rounded-lg border ${
                  globalSurgeMultiplier > 1.4
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : globalSurgeMultiplier > 1.1
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {globalSurgeMultiplier.toFixed(2)}x
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Standard (1.00x)</span>
                <span>Moderate Peak (1.50x)</span>
                <span>Heavy Demand (2.50x)</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={globalSurgeMultiplier}
                onChange={(e) => setGlobalSurgeMultiplier(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Environmental & Time Surges
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rain Surge */}
              <div
                onClick={() => setBadWeatherSurge(!badWeatherSurge)}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  badWeatherSurge
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600">
                    <CloudRain className="h-5 w-5" />
                    <span className="font-bold text-xs text-slate-900">Heavy Rain Surge</span>
                  </div>
                  <span
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      badWeatherSurge ? "border-blue-600 bg-blue-600 text-white text-[10px]" : "border-slate-300"
                    }`}
                  >
                    {badWeatherSurge && "✓"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Automatically adds <span className="font-bold text-blue-600">+30%</span> to courier dispatch compensation.
                </p>
              </div>

              {/* Night Surge */}
              <div
                onClick={() => setNightSurge(!nightSurge)}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  nightSurge
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Moon className="h-5 w-5" />
                    <span className="font-bold text-xs text-slate-900">Late-Night Hours Surge</span>
                  </div>
                  <span
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      nightSurge ? "border-indigo-600 bg-indigo-600 text-white text-[10px]" : "border-slate-300"
                    }`}
                  >
                    {nightSurge && "✓"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Applies <span className="font-bold text-indigo-600">+20%</span> premium for deliveries between 10PM–5AM.
                </p>
              </div>
            </div>
          </div>

          {/* Zone-Specific Surge Grid */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. Metro Zone Multipliers
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Localized demand spikes</span>
            </div>

            <div className="space-y-3">
              {zoneSurges.map((z, idx) => (
                <div
                  key={z.zone}
                  className={`flex items-center justify-between rounded-xl border p-3 transition ${
                    z.isActive ? "border-slate-300 bg-slate-50/50" : "border-slate-100 bg-white opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={z.isActive}
                      onChange={() => toggleZoneActive(idx)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{z.zone}</p>
                      <p className="text-[10px] text-slate-400">
                        {z.isActive ? "Surge active in zone" : "Standard pricing"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      disabled={!z.isActive}
                      value={z.multiplier}
                      onChange={(e) => updateZoneMultiplier(idx, parseFloat(e.target.value))}
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-slate-900 focus:outline-none disabled:bg-slate-100"
                    />
                    <span className="text-xs font-bold text-slate-500">x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Delivery Fee Simulation Calculator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 text-white p-6 shadow-xl space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-violet-400">
                <Calculator className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Live Pricing Simulator
                </h3>
              </div>
              <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/20">
                Active Formula
              </span>
            </div>

            {/* Simulation Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Simulation Zone
                </label>
                <select
                  value={previewZone}
                  onChange={(e) => setPreviewZone(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 focus:border-violet-500 focus:outline-none"
                >
                  {zoneSurges.map((z) => (
                    <option key={z.zone} value={z.zone}>
                      {z.zone} {z.isActive ? `(${z.multiplier}x)` : "(Standard)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Trip Distance</span>
                  <span className="font-mono font-bold text-violet-400">{previewDistanceKm} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={previewDistanceKm}
                  onChange={(e) => setPreviewDistanceKm(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>

            {/* Formula Breakdown */}
            <div className="space-y-2 rounded-xl bg-slate-900/80 border border-slate-800/80 p-4 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Base Dispatch:</span>
                <span>₦{baseDeliveryFee}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Distance Cost ({previewDistanceKm}km @ ₦{perKmRate}):</span>
                <span>₦{previewDistanceKm * perKmRate}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Raw Base Total:</span>
                <span>₦{rawDeliveryCost}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-amber-400 font-bold">
                <span>Total Surge Multiplier:</span>
                <span>{effectiveMultiplier.toFixed(2)}x</span>
              </div>
            </div>

            {/* Customer Charged Delivery Fee Box */}
            <div className="rounded-xl bg-violet-950/60 border border-violet-600/40 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                Customer Delivery Fee
              </span>
              <p className="mt-1 font-mono text-3xl font-black text-white">
                ₦{computedDeliveryFee.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-violet-300">
                Includes base, per-km, and compound zone/weather multipliers.
              </p>
            </div>

            {/* Platform Service Fee Box */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Platform Take ({platformServiceFeeRate}%)
                  </span>
                  <p className="font-mono text-lg font-bold text-emerald-400">
                    ₦{computedServiceFee.toLocaleString()}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 text-right">
                  On ₦{estimatedBasketAmount.toLocaleString()} order
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-violet-500 active:scale-95 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              <span>Publish Pricing Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
