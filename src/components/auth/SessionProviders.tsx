"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster } from "sonner";

interface SessionProvidersProps {
  children: ReactNode;
}

export function SessionProviders({ children }: SessionProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}
