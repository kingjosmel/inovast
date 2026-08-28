"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  menuItemId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: CartItem) => {
        const existing = get().items.find((cartItem) => cartItem.menuItemId === item.menuItemId);

        if (existing) {
          set({
            items: get().items.map((cartItem) =>
              cartItem.menuItemId === item.menuItemId
                ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                : cartItem,
            ),
          });
          return;
        }

        set({ items: [...get().items, item] });
      },
      removeItem: (menuItemId: string) =>
        set({ items: get().items.filter((item) => item.menuItemId !== menuItemId) }),
      updateQuantity: (menuItemId: string, quantity: number) =>
        set({
          items: get().items
            .map((item) =>
              item.menuItemId === menuItemId ? { ...item, quantity: Math.max(0, quantity) } : item,
            )
            .filter((item) => item.quantity > 0),
        }),
      clearCart: () => set({ items: [] }),
      subtotal: 0,
    }),
    {
      name: "foodgo-cart-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.subtotal = state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        }
      },
    },
  ),
);

useCartStore.subscribe((state) => {
  state.subtotal = state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
});
