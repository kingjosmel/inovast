"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Power, Check, AlertCircle, Loader2 } from "lucide-react";

interface BranchAvailabilityToggleProps {
  initialIsOpen: boolean;
  branchId?: string;
  branchName?: string;
  onStatusChange?: (isOpen: boolean) => void;
}

export function BranchAvailabilityToggle({
  initialIsOpen,
  branchId,
  branchName,
  onStatusChange,
}: BranchAvailabilityToggleProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleAvailability = async () => {
    const previousState = isOpen;
    const nextState = !isOpen;

    // Optimistic UI update
    setIsOpen(nextState);
    if (onStatusChange) onStatusChange(nextState);

    setIsUpdating(true);

    try {
      const res = await fetch("/api/merchant/branch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          isOpen: nextState,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update branch status");
      }

      if (nextState) {
        toast.success(`${branchName || "Store"} is now ONLINE and accepting orders!`, {
          icon: <Check className="h-4 w-4 text-emerald-600" />,
        });
      } else {
        toast.info(`${branchName || "Store"} is now PAUSED (Closed for orders)`, {
          icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
        });
      }
    } catch {
      // Rollback
      setIsOpen(previousState);
      if (onStatusChange) onStatusChange(previousState);
      toast.error("Network error: Could not update store availability status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isOpen ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          <Power className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">Branch Availability</h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isOpen
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              {isOpen ? "Open for Orders" : "Closed"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isOpen
              ? "Your kitchen is active on FoodGo. Customers can place instant pickup and delivery orders."
              : "Store is paused. New customer orders are blocked until you turn availability back on."}
          </p>
        </div>
      </div>

      <button
        id="branch-toggle-btn"
        type="button"
        onClick={toggleAvailability}
        disabled={isUpdating}
        className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          isOpen ? "bg-emerald-600" : "bg-slate-300"
        } ${isUpdating ? "opacity-70 cursor-not-allowed" : ""}`}
        aria-label="Toggle store availability"
      >
        <span
          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
            isOpen ? "translate-x-8" : "translate-x-0"
          }`}
        >
          {isUpdating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
          ) : (
            <span
              className={`h-2 w-2 rounded-full ${
                isOpen ? "bg-emerald-600" : "bg-slate-400"
              }`}
            />
          )}
        </span>
      </button>
    </div>
  );
}
