"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { OrderKanban } from "@/components/merchant/OrderKanban";
import { Loader2, ChefHat } from "lucide-react";
import type { KanbanOrder } from "@/app/api/merchant/orders/route";

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<KanbanOrder[]>([]);
  const [branchId, setBranchId] = useState<string>("65b002222222222222222201");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        const res = await fetch("/api/merchant/orders");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            if (data.orders) setOrders(data.orders);
            if (data.branchId) setBranchId(data.branchId);
          }
        }
      } catch (err) {
        console.error("Failed to load initial merchant orders", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadOrders();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <RoleGuard allowedRoles={["MERCHANT_ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <ChefHat className="h-7 w-7 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Connecting Kitchen Display System...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Synchronizing active orders and real-time dispatch events
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Loading orders...</span>
            </div>
          </div>
        ) : (
          <OrderKanban
            initialOrders={orders}
            branchId={branchId}
            branchName="Kitchen Display"
          />
        )}
      </div>
    </RoleGuard>
  );
}
