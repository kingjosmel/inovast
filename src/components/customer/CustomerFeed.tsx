"use client";

import { useMemo, useState } from "react";
import { MerchantCard } from "./MerchantCard";
import { MerchantFeedItem } from "@/app/api/merchants/route";
import { useLocationStore } from "@/store/useLocationStore";
import { Search, Sparkles, Store, UtensilsCrossed } from "lucide-react";

export const CATEGORIES = [
  { id: "All", label: "All Stores", icon: Store },
  { id: "Fast Food", label: "Fast Food", icon: UtensilsCrossed },
  { id: "Local", label: "Local & Buka", icon: Sparkles },
  { id: "Burgers & Grill", label: "Burgers & Grill", icon: UtensilsCrossed },
  { id: "Chicken", label: "Crispy Chicken", icon: Sparkles },
  { id: "Rice & Pasta", label: "Rice & Specials", icon: UtensilsCrossed },
  { id: "Shawarma", label: "Shawarma & Wraps", icon: UtensilsCrossed },
  { id: "Drinks & Desserts", label: "Drinks & Desserts", icon: Sparkles },
];

interface CustomerFeedProps {
  initialMerchants: MerchantFeedItem[];
}

export function CustomerFeed({ initialMerchants }: CustomerFeedProps) {
  const { selectedCity, selectedArea } = useLocationStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const filteredMerchants = useMemo(() => {
    return initialMerchants.filter((merchant) => {
      // Location filtering if user has selected a city/area
      if (selectedCity && merchant.city) {
        if (merchant.city.toLowerCase() !== selectedCity.toLowerCase()) {
          // Keep showing if no strict local matches or let user see options
        }
      }

      // Category filter
      if (selectedCategory !== "All") {
        const matchesCategory = merchant.categories.some((cat) =>
          cat.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(cat.toLowerCase()),
        );
        if (!matchesCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = merchant.name.toLowerCase().includes(q);
        const matchesCat = merchant.categories.some((c) =>
          c.toLowerCase().includes(q),
        );
        const matchesArea = merchant.area?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesArea) return false;
      }

      // Open now filter
      if (onlyOpen && !merchant.isOpen) {
        return false;
      }

      return true;
    });
  }, [initialMerchants, selectedCity, selectedCategory, searchQuery, onlyOpen]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="merchant-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants, cuisines, or dishes..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:border-slate-300">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-400 h-3.5 w-3.5"
            />
            <span>Open Now</span>
          </label>
        </div>
      </div>

      {/* Horizontal Scrollable Category Filter Chips */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const isSelected = selectedCategory === id;
          return (
            <button
              key={id}
              type="button"
              id={`filter-category-${id}`}
              onClick={() => setSelectedCategory(id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                isSelected
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-orange-500"}`} />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Merchant Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            {selectedCategory === "All" ? "Featured Restaurants" : `${selectedCategory}`}
            {selectedArea ? ` in ${selectedArea}` : ""}
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {filteredMerchants.length} {filteredMerchants.length === 1 ? "store" : "stores"} available
          </span>
        </div>

        {filteredMerchants.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMerchants.map((merchant) => (
              <MerchantCard
                key={merchant.id || merchant.slug}
                id={merchant.id}
                name={merchant.name}
                slug={merchant.slug}
                logoUrl={merchant.logoUrl}
                coverImageUrl={merchant.coverImageUrl}
                deliveryFee={merchant.deliveryFee}
                rating={merchant.rating}
                ratingCount={merchant.ratingCount}
                deliveryTime={merchant.deliveryTime}
                isOpen={merchant.isOpen}
                categories={merchant.categories}
                area={merchant.area}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 mb-3">
              <Store className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No restaurants found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              We couldn&apos;t find any merchants matching &quot;{searchQuery || selectedCategory}&quot;. Try resetting your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                setOnlyOpen(false);
              }}
              className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
