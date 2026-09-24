"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Package, ShoppingBag } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  itemCount: number;
  branch?: { name?: string; city?: string; area?: string };
  createdAt: string;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/orders")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load orders");
        setOrders(data.orders || []);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <RoleGuard allowedRoles={["CUSTOMER"]}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-orange-600">Your activity</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">My orders</h1>
          <p className="mt-2 text-sm text-slate-500">View your past orders and track active deliveries.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500 shadow-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-500" /> Loading your orders...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <ShoppingBag className="h-10 w-10 text-orange-400" />
            <h2 className="mt-4 font-bold text-slate-900">No orders yet</h2>
            <p className="mt-1 text-sm text-slate-500">Your completed and active orders will appear here.</p>
            <Link href="/" className="mt-5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Browse restaurants</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}/track`} className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-300 hover:shadow-md sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><Package className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">Order {order.orderNumber}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{order.branch?.name || "FoodGo store"} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="font-extrabold text-slate-900">₦{order.totalAmount.toLocaleString()}</p>
                      <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" : order.status === "CANCELLED" ? "bg-rose-100 text-rose-700" : "bg-orange-100 text-orange-700"}`}>{formatStatus(order.status)}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}