"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bike,
  Minus,
  Plus,
  ReceiptText,
  ShoppingBag,
  Trash2,
  Clock,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useOptimisticCart } from "@/hooks/useOptimisticCart";
import { useLocationStore } from "@/store/useLocationStore";
import { toast } from "sonner";

interface DeliveryFeeData {
  distanceKm: number;
  durationMins: number;
  deliveryFee: number;
}

export function CartSummary({ showCheckoutButton = true }: { showCheckoutButton?: boolean }) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useOptimisticCart();
  const { selectedBranchId, userCoordinates, selectedCity, selectedArea } = useLocationStore();

  const [deliveryData, setDeliveryData] = useState<DeliveryFeeData | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState<boolean>(false);

  // Fetch delivery fee when branch or user coordinates change
  useEffect(() => {
    let isMounted = true;

    async function fetchDeliveryFee() {
      if (items.length === 0) {
        setDeliveryData(null);
        return;
      }

      setIsLoadingFee(true);

      // Use userCoordinates or default central Lagos coordinates
      const destinationCoords = userCoordinates || {
        lat: 6.4698,
        lng: 3.5852,
      };

      // If no branch is explicitly selected, use a fallback demo branch ID or first item branch
      const branchId = selectedBranchId || "65f000000000000000000001";

      try {
        const res = await fetch("/api/delivery/fee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId,
            destinationCoordinates: destinationCoords,
          }),
        });

        if (!res.ok) {
          throw new Error("Unable to calculate real-time delivery fee");
        }

        const data = await res.json();
        if (isMounted) {
          setDeliveryData(data);
        }
      } catch (err) {
        console.warn("Delivery fee fetch fallback", err);
        if (isMounted) {
          // Fallback estimated delivery fee
          setDeliveryData({
            distanceKm: 3.8,
            durationMins: 25,
            deliveryFee: 750,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingFee(false);
        }
      }
    }

    fetchDeliveryFee();

    return () => {
      isMounted = false;
    };
  }, [items.length, selectedBranchId, userCoordinates]);

  // Delivery Fee calculation
  const deliveryFee = deliveryData?.deliveryFee ?? (items.length > 0 ? 650 : 0);

  // Service fee: 5% of subtotal capped at ₦500 or minimum ₦200
  const serviceFee = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.max(200, Math.min(500, Math.round(subtotal * 0.05)));
  }, [subtotal, items.length]);

  // Grand total
  const grandTotal = subtotal + deliveryFee + serviceFee;

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-4 shadow-inner">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">Your Cart is Empty</h3>
        <p className="mt-1.5 max-w-sm text-sm text-slate-500">
          Looks like you haven&apos;t added any delicious meals yet. Browse restaurants and dishes in {selectedArea || selectedCity || "your area"}.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.98]"
        >
          <span>Explore Restaurants</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Cart Items List */}
      <div className="space-y-4 lg:col-span-7">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Cart Items ({items.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              clearCart();
              toast.success("Cart cleared");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Cart</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id || item.menuItemId}
              id={`cart-item-${item.menuItemId}`}
              className="flex items-center justify-between gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                  <Image
                    src={
                      item.imageUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                    }
                    alt={item.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs font-extrabold text-orange-600 mt-0.5">
                    ₦{item.unitPrice.toLocaleString()} each
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Total: ₦{(item.unitPrice * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Quantity adjusters */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
                    aria-label={`Decrease quantity of ${item.title}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
                    aria-label={`Increase quantity of ${item.title}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => {
                    removeItem(item.menuItemId);
                    toast.info(`Removed ${item.title}`);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${item.title} from cart`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Location & ETA banner */}
        <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-3.5 text-xs text-orange-900">
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4 text-orange-600 shrink-0" />
            <span>
              Delivering to <strong className="font-bold">{selectedArea || selectedCity || "Central Lagos"}</strong>
            </span>
          </div>
          {deliveryData && (
            <div className="flex items-center gap-1 font-semibold text-orange-700">
              <Clock className="h-3.5 w-3.5" />
              <span>~{deliveryData.durationMins} mins</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Fee Breakdown & Summary Card */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <ReceiptText className="h-5 w-5 text-orange-500" />
            <h3 className="text-base font-extrabold text-slate-900">Order Summary</h3>
          </div>

          {/* Breakdown Items */}
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₦{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1.5">
                <span>Delivery Fee</span>
                {isLoadingFee ? (
                  <span className="text-[10px] text-orange-600 animate-pulse">Calculating...</span>
                ) : deliveryData ? (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-500">
                    {deliveryData.distanceKm} km
                  </span>
                ) : null}
              </div>
              <span className="font-bold text-slate-900">
                {isLoadingFee ? "..." : `₦${deliveryFee.toLocaleString()}`}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1">
                <span>Service & Processing Fee</span>
              </div>
              <span className="font-bold text-slate-900">₦{serviceFee.toLocaleString()}</span>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-base font-extrabold text-slate-900">Grand Total</span>
                  <p className="text-[11px] text-slate-400">Includes all local taxes and fees</p>
                </div>
                <span className="text-2xl font-black text-slate-900">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Guarantee Note */}
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Guaranteed fresh delivery with real-time live rider tracking.</span>
          </div>

          {/* Action CTA Button */}
          {showCheckoutButton && (
            <div className="mt-6 space-y-3">
              <button
                type="button"
                id="proceed-to-checkout-button"
                onClick={handleProceedToCheckout}
                disabled={items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-extrabold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <Link
                href="/"
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
