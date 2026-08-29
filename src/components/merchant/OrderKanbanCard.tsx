"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  User,
  Phone,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Receipt,
  FileText,
} from "lucide-react";
import type { KanbanOrder } from "@/app/api/merchant/orders/route";
import type { OrderStatus } from "@/models/Order";

interface OrderKanbanCardProps {
  order: KanbanOrder;
  columnType: "INCOMING" | "PREPARING" | "READY";
  onStatusChange: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
}

export function OrderKanbanCard({
  order,
  columnType,
  onStatusChange,
}: OrderKanbanCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Live timer for elapsed preparation time
  useEffect(() => {
    const calculateElapsed = () => {
      const createdTime = new Date(order.createdAt).getTime();
      const diffMs = Date.now() - createdTime;
      const mins = Math.max(0, Math.floor(diffMs / (60 * 1000)));
      setElapsedMinutes(mins);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 15000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const handleAction = async (nextStatus: OrderStatus) => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      await onStatusChange(order._id, nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const isUrgent = elapsedMinutes >= 15;

  return (
    <div
      id={`kanban-card-${order._id}`}
      className={`group relative flex flex-col rounded-xl border bg-white p-4 transition-all duration-200 shadow-xs hover:shadow-md ${
        isUrgent && columnType !== "READY"
          ? "border-amber-300 ring-1 ring-amber-200"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Header: Order Number & Elapsed Time */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold text-slate-900">
            {order.orderNumber}
          </span>
          {isUrgent && columnType !== "READY" && (
            <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
              <AlertTriangle className="h-3 w-3" />
              Urgent
            </span>
          )}
        </div>

        {/* Elapsed Timer */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isUrgent && columnType !== "READY"
              ? "bg-rose-50 text-rose-700 animate-pulse"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{elapsedMinutes}m ago</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5 truncate font-medium text-slate-800">
          <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{order.customerName}</span>
        </div>
        {order.customerPhone && (
          <a
            href={`tel:${order.customerPhone}`}
            className="flex items-center gap-1 text-emerald-600 hover:underline shrink-0"
          >
            <Phone className="h-3 w-3" />
            <span>{order.customerPhone}</span>
          </a>
        )}
      </div>

      {/* Delivery Instructions (if any) */}
      {order.deliveryInstructions && (
        <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50/80 p-2 text-xs text-amber-900 border border-amber-200/60">
          <FileText className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
          <p className="line-clamp-2 italic">{order.deliveryInstructions}</p>
        </div>
      )}

      {/* Items List */}
      <div className="mt-3.5 space-y-2 border-t border-dashed border-slate-100 pt-3 flex-1">
        {order.items.map((item, idx) => (
          <div key={idx} className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-900">
            <div className="flex items-baseline justify-between font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-200 text-[11px] font-bold text-slate-800">
                  {item.quantity}x
                </span>
                <span className="text-slate-800">{item.title}</span>
              </div>
              <span className="text-slate-500 font-normal shrink-0 ml-2">
                ₦{(item.unitPrice * item.quantity).toLocaleString()}
              </span>
            </div>

            {/* Customization Add-ons */}
            {item.optionsSelected && item.optionsSelected.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1 pl-6">
                {item.optionsSelected.map((opt, optIdx) => (
                  <span
                    key={optIdx}
                    className="inline-flex items-center rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200"
                  >
                    + {opt}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Total & Transition Action Buttons */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Receipt className="h-3.5 w-3.5" /> Total Bill
          </span>
          <span className="font-bold text-sm text-slate-900">
            ₦{order.totalAmount.toLocaleString()}
          </span>
        </div>

        {/* Action button based on column */}
        {columnType === "INCOMING" && (
          <button
            id={`accept-btn-${order._id}`}
            type="button"
            disabled={isUpdating}
            onClick={() => handleAction("CONFIRMED")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <ChefHat className="h-4 w-4" />
                <span>Accept & Prepare</span>
              </>
            )}
          </button>
        )}

        {columnType === "PREPARING" && (
          <button
            id={`ready-btn-${order._id}`}
            type="button"
            disabled={isUpdating}
            onClick={() => handleAction("READY")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark Ready</span>
              </>
            )}
          </button>
        )}

        {columnType === "READY" && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ready • Awaiting Dispatch Pickup</span>
          </div>
        )}
      </div>
    </div>
  );
}
