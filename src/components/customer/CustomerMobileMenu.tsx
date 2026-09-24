"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";
import { LocationSelectorModal } from "./LocationSelectorModal";

const links = [
  { label: "Browse restaurants", href: "/" },
  { label: "My orders", href: "/orders" },
  { label: "Account", href: "/account" },
];

export function CustomerMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { selectedCity, selectedArea } = useLocationStore();

  const locationDisplay =
    selectedCity && selectedArea
      ? `${selectedCity} • ${selectedArea}`
      : selectedCity || "Set Location";

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-orange-400 hover:bg-orange-50"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="customer-mobile-menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div
          id="customer-mobile-menu"
          className="absolute inset-x-0 top-full border-b border-slate-200 bg-white px-4 py-4 shadow-lg sm:px-6"
        >
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold text-slate-700"
          >
            <span className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="truncate">{locationDisplay}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </button>

          <nav className="mt-3 grid gap-1" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
      />
    </div>
  );
}