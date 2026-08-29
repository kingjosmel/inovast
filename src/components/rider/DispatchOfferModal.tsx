"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import { useSocketStore } from "@/store/useSocketStore";

export interface DispatchOffer {
  orderId: string;
  orderNumber: string;
  payoutFee: number;
  pickupName: string;
  pickupAddress: string;
  pickupDistanceKm: number;
  dropoffAddress: string;
  dropoffDistanceKm: number;
  totalDistanceKm: number;
  estimatedMinutes: number;
  itemsSummary: string;
  itemCount: number;
}

interface DispatchOfferModalProps {
  offer: DispatchOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (orderId: string) => void;
}

function DispatchOfferContent({
  offer,
  onClose,
  onAccept,
}: {
  offer: DispatchOffer;
  onClose: () => void;
  onAccept?: (orderId: string) => void;
}) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.28);
      });
    } catch {
      // Audio fallback
    }
  }, []);

  const handleDecline = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await fetch("/api/rider/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: offer.orderId }),
      });
    } catch (e) {
      console.warn("Decline call failed", e);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  }, [offer.orderId, isProcessing, onClose]);

  // Handle 15s Countdown timer
  useEffect(() => {
    playChime();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleDecline, playChime]);

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/rider/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: offer.orderId }),
      });

      const data = await res.json();
      if (data.success) {
        onAccept?.(offer.orderId);
        onClose();
        router.push(`/rider/trip/${offer.orderId}`);
      } else {
        alert(data.error || "Failed to accept order");
      }
    } catch (err) {
      console.error("Accept dispatch failed", err);
      router.push(`/rider/trip/${offer.orderId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const progressPercent = (timeLeft / 15) * 100;
  const timerColor =
    timeLeft > 8 ? "bg-emerald-500" : timeLeft > 4 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden"
      >
        {/* Header Bar with Countdown */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                New Delivery Offer
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-mono font-bold text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Visual Countdown Progress Bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${timerColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Earnings & Trip Summary Banner */}
        <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-900/90 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-emerald-950/40 border border-emerald-500/30 p-4">
            <div>
              <p className="text-xs font-medium text-emerald-300 uppercase tracking-wide">
                Guaranteed Payout
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ₦{offer.payoutFee.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-300/80">(incl. tip)</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-medium text-slate-400">Est. Trip</p>
              <p className="text-sm font-bold text-slate-200">
                {offer.totalDistanceKm} km • ~{offer.estimatedMinutes} mins
              </p>
            </div>
          </div>

          {/* Route Timeline (Pickup to Drop-off) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Store className="h-4 w-4" />
                </div>
                <div className="w-0.5 h-6 bg-slate-700 my-1" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase text-amber-400 tracking-wider">
                    1. Pickup
                  </p>
                  <span className="text-xs text-slate-400 font-mono">
                    {offer.pickupDistanceKm} km away
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 truncate">{offer.pickupName}</p>
                <p className="text-xs text-slate-400 truncate">{offer.pickupAddress}</p>
              </div>
            </div>

            {/* Drop-off */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase text-indigo-400 tracking-wider">
                    2. Drop-off
                  </p>
                  <span className="text-xs text-slate-400 font-mono">
                    {offer.dropoffDistanceKm} km
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 truncate">{offer.dropoffAddress}</p>
                <p className="text-xs text-slate-400">Direct Customer Delivery</p>
              </div>
            </div>
          </div>

          {/* Order Package Preview */}
          <div className="flex items-center justify-between rounded-xl bg-slate-800/60 px-3.5 py-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <Package className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">
                {offer.itemCount} items • {offer.itemsSummary}
              </span>
            </div>
            <span className="font-mono font-semibold text-slate-400 shrink-0 ml-2">
              {offer.orderNumber}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="decline-dispatch-btn"
              onClick={handleDecline}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 text-rose-400" />
              Decline
            </button>

            <button
              type="button"
              id="accept-dispatch-btn"
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept (₦{offer.payoutFee.toLocaleString()})
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function DispatchOfferModal({
  offer,
  isOpen,
  onClose,
  onAccept,
}: DispatchOfferModalProps) {
  const socket = useSocketStore((state) => state.socket);

  // Listen to socket dispatch offers
  useEffect(() => {
    if (!socket) return;

    const handleSocketOffer = (data: unknown) => {
      console.log("Received new dispatch offer via socket:", data);
    };

    socket.on("new_dispatch_offer", handleSocketOffer);
    socket.on("dispatch_assigned", handleSocketOffer);

    return () => {
      socket.off("new_dispatch_offer", handleSocketOffer);
      socket.off("dispatch_assigned", handleSocketOffer);
    };
  }, [socket]);

  return (
    <AnimatePresence>
      {isOpen && offer && (
        <DispatchOfferContent
          key={offer.orderId}
          offer={offer}
          onClose={onClose}
          onAccept={onAccept}
        />
      )}
    </AnimatePresence>
  );
}
