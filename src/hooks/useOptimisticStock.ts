"use client";

import { useOptimistic, useTransition, useCallback } from "react";
import { toast } from "sonner";
import type { SerializedMenuItem } from "@/app/api/merchants/[slug]/route";

export interface StockOptimisticAction {
  menuItemId: string;
  inStock: boolean;
}

export function useOptimisticStock(
  items: SerializedMenuItem[],
  onUpdateSuccess?: (menuItemId: string, nextStatus: boolean) => void
) {
  const [isPending, startTransition] = useTransition();

  const [optimisticItems, setOptimisticStock] = useOptimistic<
    SerializedMenuItem[],
    StockOptimisticAction
  >(items, (currentItems, action) => {
    return currentItems.map((item) =>
      item._id === action.menuItemId ? { ...item, inStock: action.inStock } : item
    );
  });

  const toggleStock = useCallback(
    async (menuItemId: string, nextStatus: boolean, itemTitle?: string) => {
      const targetTitle = itemTitle || "Menu item";

      startTransition(async () => {
        // 1. Optimistic state mutation
        setOptimisticStock({ menuItemId, inStock: nextStatus });

        try {
          // 2. Server mutation
          const res = await fetch("/api/merchant/stock", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              menuItemId,
              inStock: nextStatus,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || "Failed to update stock status on server");
          }

          if (onUpdateSuccess) {
            onUpdateSuccess(menuItemId, nextStatus);
          }

          toast.success(
            nextStatus
              ? `"${targetTitle}" is now IN STOCK`
              : `"${targetTitle}" is now OUT OF STOCK`,
            { duration: 2500 }
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          toast.error(`Failed to update stock for "${targetTitle}". Reverting changes. (${errorMessage})`);
          // Note: On transition failure or error, React useOptimistic automatically rolls back when the state is re-rendered
          if (onUpdateSuccess) {
            onUpdateSuccess(menuItemId, !nextStatus);
          }
        }
      });
    },
    [setOptimisticStock, onUpdateSuccess]
  );

  return {
    items: optimisticItems,
    isPending,
    toggleStock,
  };
}

export function useOptimisticSingleStock(
  menuItemId: string,
  initialInStock: boolean,
  itemTitle?: string,
  onStatusChange?: (menuItemId: string, nextStatus: boolean) => void
) {
  const [isPending, startTransition] = useTransition();

  const [optimisticInStock, setOptimisticInStock] = useOptimistic<boolean, boolean>(
    initialInStock,
    (_current, nextStatus) => nextStatus
  );

  const toggle = useCallback(
    async (nextStatus: boolean) => {
      const targetTitle = itemTitle || "Menu item";

      startTransition(async () => {
        setOptimisticInStock(nextStatus);

        try {
          const res = await fetch("/api/merchant/stock", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              menuItemId,
              inStock: nextStatus,
            }),
          });

          if (!res.ok) {
            throw new Error("Failed to persist stock update");
          }

          if (onStatusChange) {
            onStatusChange(menuItemId, nextStatus);
          }

          toast.success(
            nextStatus
              ? `"${targetTitle}" marked IN STOCK`
              : `"${targetTitle}" marked OUT OF STOCK`,
            { duration: 2500 }
          );
        } catch {
          toast.error(`Could not update "${targetTitle}". Rolled back.`);
          if (onStatusChange) {
            onStatusChange(menuItemId, !nextStatus);
          }
        }
      });
    },
    [menuItemId, itemTitle, setOptimisticInStock, onStatusChange]
  );

  return {
    inStock: optimisticInStock,
    isPending,
    toggle,
  };
}
