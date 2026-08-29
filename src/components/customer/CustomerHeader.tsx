"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, ShoppingCart, User, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocationStore } from "@/store/useLocationStore";
import { useCartStore } from "@/store/useCartStore";
import { LocationSelectorModal } from "./LocationSelectorModal";

export function CustomerHeader() {
  const { data: session } = useSession();
  const { selectedCity, selectedArea } = useLocationStore();
  const { items } = useCartStore();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const locationDisplay =
    selectedCity && selectedArea
      ? `${selectedCity} • ${selectedArea}`
      : selectedCity || "Set Location";

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Interactive Location Selector Button */}
        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-orange-400 hover:bg-orange-50/60 sm:text-sm"
          aria-label="Change delivery location"
        >
          <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="max-w-[140px] truncate sm:max-w-[200px]">
            {locationDisplay}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cart Button */}
        <Link
          href="/cart"
          id="header-cart-button"
          className="relative flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-orange-400 hover:bg-orange-50/50 sm:text-sm"
          aria-label="View Cart"
        >
          <ShoppingCart className="h-4 w-4 text-orange-500" />
          <span className="hidden sm:inline">Cart</span>
          {totalItemCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-extrabold text-white">
              {totalItemCount}
            </span>
          )}
        </Link>

        {/* User Account / Login Button */}
        {session?.user ? (
          <Link
            href={
              session.user.role === "MERCHANT_ADMIN"
                ? "/merchant"
                : session.user.role === "RIDER"
                ? "/rider"
                : session.user.role === "SUPER_ADMIN"
                ? "/admin"
                : "/account"
            }
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 sm:text-sm"
          >
            <User className="h-4 w-4 text-slate-600" />
            <span className="hidden max-w-[100px] truncate md:inline">
              {session.user.name || "Account"}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 sm:text-sm"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>

      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
      />
    </>
  );
}
