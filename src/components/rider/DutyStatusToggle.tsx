"use client";

import { useState, useTransition } from "react";
import { Radio, Loader2 } from "lucide-react";

interface DutyStatusToggleProps {
  initialStatus?: boolean;
  onStatusChange?: (isOnline: boolean) => void;
}

export function DutyStatusToggle({
  initialStatus = true,
  onStatusChange,
}: DutyStatusToggleProps) {
  const [isOnline, setIsOnline] = useState<boolean>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleToggle = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    // Audio chime
    try {
      if (typeof window !== "undefined" && window.AudioContext) {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(nextState ? 660 : 330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(nextState ? 880 : 220, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Ignore audio failure
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/rider/duty", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline: nextState }),
        });

        if (!res.ok) {
          throw new Error("Status update failed");
        }

        onStatusChange?.(nextState);
      } catch (err) {
        console.error("Failed to toggle duty status", err);
        // Revert on error
        setIsOnline(!nextState);
      }
    });
  };

  return (
    <button
      type="button"
      id="duty-status-toggle-btn"
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isOnline
          ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500"
          : "bg-slate-700 text-slate-100 hover:bg-slate-800 focus:ring-slate-400"
      }`}
      aria-label={`Duty status: ${isOnline ? "Online" : "Offline"}`}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isOnline ? (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-100" />
        </span>
      ) : (
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
      )}

      <span className="tracking-wide">
        {isOnline ? "ON DUTY" : "OFFLINE"}
      </span>

      <Radio className={`h-3 w-3 ${isOnline ? "text-emerald-200" : "text-slate-400"}`} />
    </button>
  );
}
