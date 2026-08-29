"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Radio } from "lucide-react";

interface GpsStreamerProps {
  activeOrderId?: string;
  isOnline?: boolean;
  onLocationUpdate?: (coords: { lat: number; lng: number }) => void;
}

export function GpsStreamer({
  activeOrderId,
  isOnline = true,
  onLocationUpdate,
}: GpsStreamerProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 6.4281,
    lng: 3.4246,
  });
  const [accuracy, setAccuracy] = useState<number | null>(6);
  const [status, setStatus] = useState<"ACTIVE" | "SEARCHING" | "SIMULATED">("SIMULATED");
  const lastSentRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  const sendLocationToServer = useCallback(
    async (lat: number, lng: number) => {
      if (!activeOrderId) return;
      const now = Date.now();
      // Throttle server transmissions to every 6 seconds minimum
      if (now - lastSentRef.current < 5500) return;
      lastSentRef.current = now;

      try {
        await fetch("/api/rider/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            activeOrderId,
          }),
        });
      } catch (err) {
        console.warn("Location push error", err);
      }
    },
    [activeOrderId]
  );

  useEffect(() => {
    if (!isOnline) {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCoords({ lat, lng });
            setAccuracy(Math.round(pos.coords.accuracy));
            setStatus("ACTIVE");
            onLocationUpdate?.({ lat, lng });
            sendLocationToServer(lat, lng);
          },
          (err) => {
            console.warn("Geolocation watch fallback to simulated stream:", err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000,
          }
        );
        watchIdRef.current = id;
      } catch (err) {
        console.warn("Geolocation init error:", err);
      }
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isOnline, sendLocationToServer, onLocationUpdate]);

  // Simulation drift interval for live testing if hardware GPS unavailable
  useEffect(() => {
    if (status !== "SIMULATED" || !isOnline) return;

    const interval = setInterval(() => {
      setCoords((prev) => {
        // Small drift along Lagos coordinate delta
        const nextLat = prev.lat + (Math.random() - 0.48) * 0.0003;
        const nextLng = prev.lng + (Math.random() - 0.48) * 0.0003;
        const newCoords = { lat: nextLat, lng: nextLng };
        onLocationUpdate?.(newCoords);
        sendLocationToServer(nextLat, nextLng);
        return newCoords;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [status, isOnline, sendLocationToServer, onLocationUpdate]);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        {status === "ACTIVE" ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        ) : (
          <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
        )}
        <span className="font-mono font-medium text-[11px] text-slate-200">
          GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </span>
      </div>

      <span className="text-slate-600">|</span>

      <span className="text-[11px] text-slate-400">
        {status === "ACTIVE" ? `±${accuracy}m` : "LIVE SIM"}
      </span>
    </div>
  );
}
