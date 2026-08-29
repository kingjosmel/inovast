"use client";

import { useOptimistic, useTransition, useCallback, useMemo } from "react";
import { useCartStore, type CartItem } from "@/store/useCartStore";

export type CartOptimisticAction =
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; menuItemId: string }
  | { type: "UPDATE_QTY"; menuItemId: string; quantity: number }
  | { type: "CLEAR" };

export function useOptimisticCart() {
  const { items: storeItems, addItem: storeAddItem, removeItem: storeRemoveItem, updateQuantity: storeUpdateQty, clearCart: storeClearCart } = useCartStore();
  const [isPending, startTransition] = useTransition();

  const [optimisticItems, setOptimisticCart] = useOptimistic<CartItem[], CartOptimisticAction>(
    storeItems,
    (currentItems, action) => {
      switch (action.type) {
        case "ADD": {
          const existingIndex = currentItems.findIndex(
            (item) => item.menuItemId === action.item.menuItemId
          );
          if (existingIndex > -1) {
            return currentItems.map((item, index) =>
              index === existingIndex
                ? { ...item, quantity: item.quantity + action.item.quantity }
                : item
            );
          }
          return [...currentItems, action.item];
        }

        case "UPDATE_QTY": {
          if (action.quantity <= 0) {
            return currentItems.filter((item) => item.menuItemId !== action.menuItemId);
          }
          return currentItems.map((item) =>
            item.menuItemId === action.menuItemId
              ? { ...item, quantity: action.quantity }
              : item
          );
        }

        case "REMOVE":
          return currentItems.filter((item) => item.menuItemId !== action.menuItemId);

        case "CLEAR":
          return [];

        default:
          return currentItems;
      }
    }
  );

  const optimisticSubtotal = useMemo(() => {
    return optimisticItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [optimisticItems]);

  const optimisticTotalCount = useMemo(() => {
    return optimisticItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [optimisticItems]);

  const addItem = useCallback(
    async (item: CartItem) => {
      startTransition(async () => {
        setOptimisticCart({ type: "ADD", item });
        storeAddItem(item);
      });
    },
    [setOptimisticCart, storeAddItem]
  );

  const updateQuantity = useCallback(
    async (menuItemId: string, quantity: number) => {
      startTransition(async () => {
        setOptimisticCart({ type: "UPDATE_QTY", menuItemId, quantity });
        storeUpdateQty(menuItemId, quantity);
      });
    },
    [setOptimisticCart, storeUpdateQty]
  );

  const removeItem = useCallback(
    async (menuItemId: string) => {
      startTransition(async () => {
        setOptimisticCart({ type: "REMOVE", menuItemId });
        storeRemoveItem(menuItemId);
      });
    },
    [setOptimisticCart, storeRemoveItem]
  );

  const clearCart = useCallback(
    async () => {
      startTransition(async () => {
        setOptimisticCart({ type: "CLEAR" });
        storeClearCart();
      });
    },
    [setOptimisticCart, storeClearCart]
  );

  return {
    items: optimisticItems,
    subtotal: optimisticSubtotal,
    totalCount: optimisticTotalCount,
    isPending,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
