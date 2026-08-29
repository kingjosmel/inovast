"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Motorbike,
  Phone,
  Star,
  Utensils,
} from "lucide-react";
import { MenuItemCard } from "./MenuItemCard";
import {
  CustomizationItemData,
  ItemCustomizationModal,
} from "./ItemCustomizationModal";
import { MerchantFeedItem } from "@/app/api/merchants/route";
import { SerializedMenuItem } from "@/app/api/merchants/[slug]/route";

interface MerchantMenuClientProps {
  merchant: MerchantFeedItem & { address?: string; phone?: string };
  menuItems: SerializedMenuItem[];
}

export function MerchantMenuClient({
  merchant,
  menuItems,
}: MerchantMenuClientProps) {
  const [selectedItem, setSelectedItem] = useState<CustomizationItemData | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Extract unique categories in order
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((item) => set.add(item.category));
    return ["All", ...Array.from(set)];
  }, [menuItems]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, SerializedMenuItem[]> = {};
    menuItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [menuItems]);

  const handleSelectItem = (item: CustomizationItemData) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const formattedFee =
    merchant.deliveryFee === 0
      ? "Free delivery"
      : `₦${merchant.deliveryFee.toLocaleString()} delivery`;

  return (
    <div className="space-y-6 pb-16">
      {/* Back to Discovery Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 transition hover:text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to all restaurants</span>
        </Link>
      </div>

      {/* Hero Header Section */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-48 w-full bg-slate-100 sm:h-64">
          <Image
            src={merchant.coverImageUrl}
            alt={merchant.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent" />

          {/* Open / Closed Status Badge */}
          <div className="absolute left-4 top-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide shadow-md backdrop-blur-md ${
                merchant.isOpen
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-900/90 text-slate-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  merchant.isOpen ? "bg-white animate-pulse" : "bg-slate-400"
                }`}
              />
              {merchant.isOpen ? "Open for Orders" : "Closed"}
            </span>
          </div>
        </div>

        {/* Merchant Info Body */}
        <div className="relative px-5 pb-6 pt-4 sm:px-8">
          {/* Logo overlapping banner */}
          {merchant.logoUrl && (
            <div className="relative -mt-16 mb-4 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
              <Image
                src={merchant.logoUrl}
                alt={`${merchant.name} logo`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {merchant.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                {/* Rating */}
                <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 font-bold text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{merchant.rating?.toFixed(1) || "4.8"}</span>
                  <span className="font-normal text-amber-600/70">
                    ({merchant.ratingCount || 120}+ reviews)
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                  <span>
                    {merchant.area}, {merchant.city}
                  </span>
                </div>

                {/* Phone */}
                {merchant.phone && (
                  <div className="hidden items-center gap-1 font-medium sm:flex">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{merchant.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics (Delivery time & Fee) */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2 sm:gap-4 sm:p-3">
              <div className="flex items-center gap-2 px-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Delivery
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {merchant.deliveryTime || "25-35 min"}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-2 px-2">
                <Motorbike className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Rate
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {formattedFee}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Category Navigation Bar */}
      <div className="sticky top-[61px] z-30 -mx-4 border-y border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {categories.map((category) => {
            const isSelected = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                id={`cat-nav-${category.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => {
                  setActiveCategory(category);
                  if (category !== "All") {
                    const el = document.getElementById(
                      `category-section-${category.toLowerCase().replace(/\s+/g, "-")}`,
                    );
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                  isSelected
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Utensils className="h-3 w-3" />
                <span>{category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Items Grouped by Category */}
      <div className="space-y-10">
        {Object.entries(groupedItems).map(([category, items]) => {
          if (activeCategory !== "All" && activeCategory !== category) {
            return null;
          }

          const categorySlug = category.toLowerCase().replace(/\s+/g, "-");

          return (
            <div
              key={category}
              id={`category-section-${categorySlug}`}
              className="space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  {category}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {items.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {items.map((item) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    onSelect={handleSelectItem}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Customization Modal */}
      <ItemCustomizationModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}
