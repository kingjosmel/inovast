"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StockToggle } from "@/components/merchant/StockToggle";
import {
  UtensilsCrossed,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  PackageX,
  Sparkles,
} from "lucide-react";
import type { SerializedMenuItem } from "@/app/api/merchants/[slug]/route";

export default function MerchantMenuPage() {
  const [items, setItems] = useState<SerializedMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");

  const fetchMenuItems = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/merchant/menu");
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        }
      }
    } catch (error) {
      console.error("Failed to fetch menu items", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch("/api/merchant/menu");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.items) {
            setItems(data.items);
          }
        }
      } catch (error) {
        console.error("Failed to fetch menu items", error);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["All", ...Array.from(set)];
  }, [items]);

  // Handle local state update from StockToggle
  const handleToggleStock = (menuItemId: string, nextStatus: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item._id === menuItemId ? { ...item, inStock: nextStatus } : item,
      ),
    );
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      // Stock status filter
      if (stockFilter === "IN_STOCK" && !item.inStock) {
        return false;
      }
      if (stockFilter === "OUT_OF_STOCK" && item.inStock) {
        return false;
      }
      // Search term filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) || false;
        const matchesCategory = item.category?.toLowerCase().includes(q) || false;
        return matchesTitle || matchesDesc || matchesCategory;
      }
      return true;
    });
  }, [items, selectedCategory, stockFilter, searchQuery]);

  const inStockCount = useMemo(() => items.filter((i) => i.inStock).length, [items]);
  const outOfStockCount = useMemo(() => items.filter((i) => !i.inStock).length, [items]);

  return (
    <RoleGuard allowedRoles={["MERCHANT_ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-6">
        {/* Header & Metrics */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Menu & Stock Manager
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live inventory control • 1-click out-of-stock toggles to prevent order cancellations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="refresh-menu-btn"
              type="button"
              onClick={fetchMenuItems}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Sync Stock"}</span>
            </button>
          </div>
        </div>

        {/* Stock Overview Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            onClick={() => setStockFilter("ALL")}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              stockFilter === "ALL"
                ? "border-slate-900 bg-slate-900 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold uppercase tracking-wider ${stockFilter === "ALL" ? "text-slate-300" : "text-slate-500"}`}>
                Total Menu Items
              </p>
              <UtensilsCrossed className={`h-4 w-4 ${stockFilter === "ALL" ? "text-emerald-400" : "text-slate-400"}`} />
            </div>
            <p className="mt-2 text-2xl font-extrabold">{items.length}</p>
          </div>

          <div
            onClick={() => setStockFilter("IN_STOCK")}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              stockFilter === "IN_STOCK"
                ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-900 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold uppercase tracking-wider ${stockFilter === "IN_STOCK" ? "text-emerald-100" : "text-slate-500"}`}>
                Active In Stock
              </p>
              <CheckCircle2 className={`h-4 w-4 ${stockFilter === "IN_STOCK" ? "text-emerald-200" : "text-emerald-600"}`} />
            </div>
            <p className="mt-2 text-2xl font-extrabold">{inStockCount}</p>
          </div>

          <div
            onClick={() => setStockFilter("OUT_OF_STOCK")}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              stockFilter === "OUT_OF_STOCK"
                ? "border-rose-600 bg-rose-600 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-900 hover:border-rose-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold uppercase tracking-wider ${stockFilter === "OUT_OF_STOCK" ? "text-rose-100" : "text-slate-500"}`}>
                Sold Out / Paused
              </p>
              <AlertCircle className={`h-4 w-4 ${stockFilter === "OUT_OF_STOCK" ? "text-rose-200" : "text-rose-600"}`} />
            </div>
            <p className="mt-2 text-2xl font-extrabold">{outOfStockCount}</p>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="menu-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or ingredients..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Categorized Menu Items Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Dish & Details
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">
                    Stock Availability
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        <span>Loading menu catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <PackageX className="h-10 w-10 text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">No dishes match your filter</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try clearing your search query or category filter</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !item.inStock ? "bg-slate-50/40 opacity-75" : ""
                      }`}
                    >
                      {/* Dish title & photo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                sizes="56px"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <UtensilsCrossed className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
                              {item.description || "No description provided"}
                            </p>
                            {item.customizationGroups && item.customizationGroups.length > 0 && (
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700">
                                <Sparkles className="h-3 w-3" />
                                <span>{item.customizationGroups.length} customization group(s) available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {item.category || "General"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-extrabold text-slate-900">
                          ₦{item.price.toLocaleString()}
                        </span>
                      </td>

                      {/* Instant Stock Toggle */}
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <StockToggle
                            menuItemId={item._id}
                            itemTitle={item.title}
                            initialInStock={item.inStock}
                            onToggleSuccess={handleToggleStock}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
