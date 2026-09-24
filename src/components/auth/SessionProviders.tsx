"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/useCartStore";

interface SessionProvidersProps {
  children: ReactNode;
}

export function SessionProviders({ children }: SessionProvidersProps) {
  return (
    <SessionProvider>
      <CartAccountSync />
      {children}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}

function CartAccountSync() {
  const { data: session, status } = useSession();
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (status === "loading") return;

    const accountKey = session?.user?.id ? `user:${session.user.id}` : "guest";
    const previousAccountKey = window.localStorage.getItem("foodgo-cart-account");

    if (previousAccountKey !== accountKey) {
      clearCart();
    }

    window.localStorage.setItem("foodgo-cart-account", accountKey);
  }, [clearCart, session?.user?.id, status]);

  return null;
}
