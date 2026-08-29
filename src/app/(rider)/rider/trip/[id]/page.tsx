"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Navigation,
  Phone,
  CheckCircle2,
  CheckSquare,
  Square,
  ArrowLeft,
  ExternalLink,
  Package,
  AlertCircle,
  PartyPopper,
  Compass,
} from "lucide-react";
import { GpsStreamer } from "@/components/rider/GpsStreamer";
import type { RiderTripDetail } from "@/app/api/rider/trip/[id]/route";

type StepType = "HEADING_TO_PICKUP" | "AT_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED";

export default function RiderTripExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<RiderTripDetail | null>(null);
  const [currentStep, setCurrentStep] = useState<StepType>("HEADING_TO_PICKUP");
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/rider/trip/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success && json.trip) {
          setTrip(json.trip);
          setCurrentStep(json.trip.step || "HEADING_TO_PICKUP");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Initial trip load error", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleAdvanceStep = async () => {
    if (isAdvancing || !trip) return;
    setIsAdvancing(true);

    let nextStep: StepType = "AT_PICKUP";
    if (currentStep === "HEADING_TO_PICKUP") {
      nextStep = "AT_PICKUP";
    } else if (currentStep === "AT_PICKUP") {
      nextStep = "OUT_FOR_DELIVERY";
    } else if (currentStep === "OUT_FOR_DELIVERY") {
      nextStep = "DELIVERED";
    }

    try {
      const res = await fetch(`/api/rider/trip/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStep }),
      });

      const json = await res.json();
      if (json.success) {
        setCurrentStep(nextStep);
        if (nextStep === "DELIVERED") {
          setShowCompleteModal(true);
        }
      }
    } catch (err) {
      console.error("Failed to advance step", err);
      setCurrentStep(nextStep);
      if (nextStep === "DELIVERED") {
        setShowCompleteModal(true);
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const toggleCheckItem = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const allItemsChecked =
    trip?.items && trip.items.length > 0
      ? trip.items.every((_, idx) => !!checkedItems[idx])
      : true;

  // Destination coordinates based on step
  const targetCoords =
    currentStep === "HEADING_TO_PICKUP" || currentStep === "AT_PICKUP"
      ? trip?.pickup.coordinates || [3.4246, 6.4281]
      : trip?.dropoff.coordinates || [3.435, 6.435];

  const targetLng = targetCoords[0];
  const targetLat = targetCoords[1];

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`;
  const wazeUrl = `https://waze.com/ul?ll=${targetLat},${targetLng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${targetLat},${targetLng}`;

  if (loading && !trip) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 rounded-2xl bg-slate-900" />
        <div className="h-44 rounded-3xl bg-slate-900" />
        <div className="h-60 rounded-3xl bg-slate-900" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Trip Not Found</h2>
        <p className="text-xs text-slate-400">Order may have been cancelled or completed.</p>
        <Link
          href="/rider/dashboard"
          className="inline-flex rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/rider/dashboard"
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>

        <GpsStreamer
          activeOrderId={trip._id}
          isOnline={true}
        />
      </div>

      {/* TRIP STEP PROGRESS BAR */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-400">ORDER {trip.orderNumber}</span>
          <span className="text-emerald-400 font-mono">
            Payout: ₦{trip.payoutFee.toLocaleString()}
          </span>
        </div>

        {/* 3 Steps Indicator */}
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <div
            className={`rounded-xl p-2 text-center transition-all ${
              currentStep === "HEADING_TO_PICKUP"
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                : currentStep === "AT_PICKUP" ||
                  currentStep === "OUT_FOR_DELIVERY" ||
                  currentStep === "DELIVERED"
                ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-medium"
                : "bg-slate-950 text-slate-600"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider">Step 1</p>
            <p className="text-xs truncate font-bold mt-0.5">To Merchant</p>
          </div>

          {/* Step 2 */}
          <div
            className={`rounded-xl p-2 text-center transition-all ${
              currentStep === "AT_PICKUP"
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                : currentStep === "OUT_FOR_DELIVERY" || currentStep === "DELIVERED"
                ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-medium"
                : "bg-slate-950 text-slate-500"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider">Step 2</p>
            <p className="text-xs truncate font-bold mt-0.5">At Kitchen</p>
          </div>

          {/* Step 3 */}
          <div
            className={`rounded-xl p-2 text-center transition-all ${
              currentStep === "OUT_FOR_DELIVERY"
                ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold"
                : currentStep === "DELIVERED"
                ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold"
                : "bg-slate-950 text-slate-500"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider">Step 3</p>
            <p className="text-xs truncate font-bold mt-0.5">To Customer</p>
          </div>
        </div>
      </div>

      {/* ACTIVE DESTINATION & NAVIGATION CARD */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                currentStep === "HEADING_TO_PICKUP" || currentStep === "AT_PICKUP"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              }`}
            >
              {currentStep === "HEADING_TO_PICKUP"
                ? "Pickup Destination"
                : currentStep === "AT_PICKUP"
                ? "Restaurant Kitchen"
                : "Drop-off Destination"}
            </span>

            <h3 className="text-lg font-black text-white">
              {currentStep === "HEADING_TO_PICKUP" || currentStep === "AT_PICKUP"
                ? trip.pickup.name
                : trip.dropoff.customerName}
            </h3>
            <p className="text-xs text-slate-400">
              {currentStep === "HEADING_TO_PICKUP" || currentStep === "AT_PICKUP"
                ? trip.pickup.address
                : trip.dropoff.addressLine}
            </p>
          </div>

          <a
            href={`tel:${
              currentStep === "HEADING_TO_PICKUP" || currentStep === "AT_PICKUP"
                ? trip.pickup.phone
                : trip.dropoff.phone
            }`}
            id="call-contact-btn"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition active:scale-95"
            title="Call Contact"
          >
            <Phone className="h-5 w-5" />
          </a>
        </div>

        {/* Turn-by-Turn Navigation Apps Launcher Buttons */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Open in GPS Navigation App
          </p>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="open-google-maps-btn"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Navigation className="h-3.5 w-3.5 text-emerald-400" />
              <span>Google Maps</span>
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="open-waze-btn"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>Waze</span>
            </a>

            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="open-apple-maps-btn"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
              <span>Apple Maps</span>
            </a>
          </div>
        </div>

        {/* Customer Delivery Instructions if Out for Delivery */}
        {(currentStep === "OUT_FOR_DELIVERY" || currentStep === "AT_PICKUP") &&
          trip.dropoff.instructions && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 text-xs space-y-1">
              <p className="font-bold text-indigo-300 uppercase tracking-wide text-[10px]">
                Customer Delivery Instructions:
              </p>
              <p className="text-slate-200">{trip.dropoff.instructions}</p>
            </div>
          )}
      </div>

      {/* ITEMS VERIFICATION CHECKLIST (Important for Step 2: At Kitchen) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Order Package Checklist</h4>
          </div>
          <span className={`text-xs font-mono font-bold ${allItemsChecked ? "text-emerald-400" : "text-slate-400"}`}>
            {Object.values(checkedItems).filter(Boolean).length}/{trip.items.length} {allItemsChecked ? "✓ All Verified" : "Checked"}
          </span>
        </div>

        <div className="space-y-2">
          {trip.items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              id={`item-check-${idx}`}
              onClick={() => toggleCheckItem(idx)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                checkedItems[idx]
                  ? "border-emerald-500/40 bg-emerald-950/20 text-slate-200"
                  : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {checkedItems[idx] ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Square className="h-4 w-4 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-bold ${
                    checkedItems[idx] ? "text-emerald-300 line-through" : "text-white"
                  }`}
                >
                  {item.quantity}x {item.title}
                </p>
                {item.optionsSelected && item.optionsSelected.length > 0 && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.optionsSelected.join(", ")}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PRIMARY STEP ACTION BUTTON */}
      <div className="sticky bottom-20 z-30 pt-2">
        {currentStep === "HEADING_TO_PICKUP" && (
          <button
            type="button"
            id="arrived-at-pickup-btn"
            onClick={handleAdvanceStep}
            disabled={isAdvancing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 text-base font-black text-slate-950 shadow-xl shadow-amber-900/40 hover:bg-amber-400 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Store className="h-5 w-5" />
            <span>Arrived at Restaurant</span>
          </button>
        )}

        {currentStep === "AT_PICKUP" && (
          <button
            type="button"
            id="confirm-pickup-btn"
            onClick={handleAdvanceStep}
            disabled={isAdvancing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 transition active:scale-[0.98] disabled:opacity-50"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Confirm Order Picked Up</span>
          </button>
        )}

        {currentStep === "OUT_FOR_DELIVERY" && (
          <button
            type="button"
            id="complete-delivery-btn"
            onClick={handleAdvanceStep}
            disabled={isAdvancing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 transition active:scale-[0.98] disabled:opacity-50"
          >
            <PartyPopper className="h-5 w-5" />
            <span>Mark Order Delivered</span>
          </button>
        )}
      </div>

      {/* TRIP COMPLETION SUCCESS MODAL */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 text-center text-white shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <PartyPopper className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Delivery Completed!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Order {trip.orderNumber} successfully handed over.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/30 p-4">
              <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
                Trip Earnings Credited
              </p>
              <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
                +₦{trip.payoutFee.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Added to your daily wallet balance</p>
            </div>

            <button
              type="button"
              id="finish-trip-btn"
              onClick={() => {
                setShowCompleteModal(false);
                router.push("/rider/dashboard");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition"
            >
              Back to Dashboard & Ready for Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
