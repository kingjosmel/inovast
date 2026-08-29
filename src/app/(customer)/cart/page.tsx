"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CartSummary } from "@/components/customer/CartSummary";

export default function CartPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-900 font-semibold">Your Cart</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Review Your Order
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Check your selected meal items and calculated delivery fees before checkout.
          </p>
        </div>
      </div>

      {/* Cart & Fee Summary */}
      <CartSummary showCheckoutButton={true} />
    </div>
  );
}
