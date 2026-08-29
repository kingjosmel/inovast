"use client";

import { useOptimisticSingleStock } from "@/hooks/useOptimisticStock";
import { Loader2 } from "lucide-react";

interface StockToggleProps {
  menuItemId: string;
  itemTitle: string;
  initialInStock: boolean;
  onToggleSuccess?: (menuItemId: string, nextStatus: boolean) => void;
}

export function StockToggle({
  menuItemId,
  itemTitle,
  initialInStock,
  onToggleSuccess,
}: StockToggleProps) {
  const { inStock, isPending, toggle } = useOptimisticSingleStock(
    menuItemId,
    initialInStock,
    itemTitle,
    onToggleSuccess
  );

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
          inStock
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}
      >
        <span
          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
            inStock ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
        {inStock ? "In Stock" : "Out of Stock"}
      </span>

      <button
        id={`stock-toggle-${menuItemId}`}
        type="button"
        role="switch"
        aria-checked={inStock}
        disabled={isPending}
        onClick={() => toggle(!inStock)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          inStock ? "bg-emerald-600" : "bg-slate-300"
        } ${isPending ? "opacity-60 cursor-wait" : ""}`}
      >
        <span className="sr-only">Toggle stock for {itemTitle}</span>
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
            inStock ? "translate-x-5" : "translate-x-0"
          }`}
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
        </span>
      </button>
    </div>
  );
}

