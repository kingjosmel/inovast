"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  ShoppingBag,
  CreditCard,
  ChefHat,
  PackageCheck,
  Bike,
  CheckCircle2,
  Sparkles,
  Filter,
} from "lucide-react";
import { useSocketStore } from "@/store/useSocketStore";

export interface ActivityEvent {
  id: string;
  type: "PLACED" | "PAID" | "PREPARING" | "READY" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED" | string;
  orderNumber: string;
  customerName: string;
  merchantName: string;
  amount: number;
  timestamp: string;
}

const defaultRecentEvents: ActivityEvent[] = [
  { id: "e1", type: "PLACED", orderNumber: "ORD-9442", customerName: "Adeola Davies", merchantName: "The Place Lekki", amount: 14500, timestamp: new Date(Date.now() - 1000 * 45).toISOString() },
  { id: "e2", type: "PAID", orderNumber: "ORD-9441", customerName: "Femi Kuti", merchantName: "Mega Chicken VI", amount: 22800, timestamp: new Date(Date.now() - 1000 * 120).toISOString() },
  { id: "e3", type: "PICKED_UP", orderNumber: "ORD-9439", customerName: "Ngozi Eze", merchantName: "Domino's Ikoyi", amount: 18200, timestamp: new Date(Date.now() - 1000 * 240).toISOString() },
  { id: "e4", type: "DELIVERED", orderNumber: "ORD-9435", customerName: "Babatunde Raji", merchantName: "Kilimanjaro Yaba", amount: 9600, timestamp: new Date(Date.now() - 1000 * 360).toISOString() },
  { id: "e5", type: "PLACED", orderNumber: "ORD-9433", customerName: "Chioma Johnson", merchantName: "Sweet Sensation", amount: 12500, timestamp: new Date(Date.now() - 1000 * 480).toISOString() },
];

interface LiveActivityFeedProps {
  initialEvents?: ActivityEvent[];
}

export function LiveActivityFeed({ initialEvents = [] }: LiveActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>(() =>
    initialEvents.length > 0 ? initialEvents : defaultRecentEvents
  );
  const [filterType, setFilterType] = useState<string>("ALL");
  const socket = useSocketStore((state) => state.socket);

  // Socket.io listener for live platform events
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: { orderId?: string; orderNumber?: string; totalAmount?: number; customerName?: string; merchantName?: string }) => {
      const newEvent: ActivityEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: "PLACED",
        orderNumber: data.orderNumber || "ORD-LIVE",
        customerName: data.customerName || "Mobile Customer",
        merchantName: data.merchantName || "Local Kitchen",
        amount: data.totalAmount || 12500,
        timestamp: new Date().toISOString(),
      };
      setEvents((prev) => [newEvent, ...prev.slice(0, 24)]);
    };

    const handleStatusUpdate = (data: { orderId?: string; orderNumber?: string; status?: string; totalAmount?: number }) => {
      const newEvent: ActivityEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: data.status || "CONFIRMED",
        orderNumber: data.orderNumber || "ORD-UPDATE",
        customerName: "Customer Order",
        merchantName: "Branch Kitchen",
        amount: data.totalAmount || 9500,
        timestamp: new Date().toISOString(),
      };
      setEvents((prev) => [newEvent, ...prev.slice(0, 24)]);
    };

    socket.on("order_created", handleNewOrder);
    socket.on("order_status_updated", handleStatusUpdate);

    return () => {
      socket.off("order_created", handleNewOrder);
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, [socket]);

  // Quick simulation trigger for testing live streaming
  const handleSimulateEvent = useCallback(() => {
    const merchants = ["The Place Lekki", "Mega Chicken VI", "Domino's Ikoyi", "Sweet Sensation", "Kilimanjaro Yaba"];
    const customers = ["Funke Akindele", "Kunle Afolayan", "Banky W.", "Simi Ogunleye", "Wizkid Balogun", "Tiwa Savage"];
    const statuses = ["PLACED", "PAID", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];
    const randStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    const randCustomer = customers[Math.floor(Math.random() * customers.length)];
    const randAmount = Math.floor(Math.random() * 25000) + 4500;
    const randOrderNum = `ORD-${Math.floor(Math.random() * 900) + 9100}`;

    const simEvent: ActivityEvent = {
      id: `ev-sim-${Date.now()}`,
      type: randStatus,
      orderNumber: randOrderNum,
      customerName: randCustomer,
      merchantName: randMerchant,
      amount: randAmount,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => [simEvent, ...prev.slice(0, 24)]);
  }, []);

  const getStatusBadge = (type: string) => {
    switch (type) {
      case "PLACED":
        return {
          icon: ShoppingBag,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          label: "Order Placed",
        };
      case "PAID":
        return {
          icon: CreditCard,
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          label: "Payment Confirmed",
        };
      case "PREPARING":
      case "READY":
        return {
          icon: ChefHat,
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          label: "Kitchen Prep",
        };
      case "PICKED_UP":
        return {
          icon: PackageCheck,
          color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          label: "Picked Up by Rider",
        };
      case "OUT_FOR_DELIVERY":
        return {
          icon: Bike,
          color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          label: "Out for Delivery",
        };
      case "DELIVERED":
        return {
          icon: CheckCircle2,
          color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
          label: "Delivered",
        };
      default:
        return {
          icon: Activity,
          color: "bg-slate-700 text-slate-300 border-slate-600",
          label: type,
        };
    }
  };

  const filteredEvents =
    filterType === "ALL"
      ? events
      : events.filter((e) => e.type.toUpperCase() === filterType.toUpperCase());

  return (
    <div className="flex flex-col h-[460px] sm:h-[520px] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Activity Feed</h3>
            <p className="text-[11px] text-slate-500">Real-time order lifecycle events</p>
          </div>
        </div>

        <button
          type="button"
          id="simulate-activity-event-btn"
          onClick={handleSimulateEvent}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Simulate Event</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2 overflow-x-auto text-xs">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1">
          <Filter className="h-3 w-3" />
        </span>
        {["ALL", "PLACED", "PAID", "PICKED_UP", "DELIVERED"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilterType(f)}
            className={`rounded-md px-2 py-1 font-medium transition ${
              filterType === f
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f === "ALL" ? "All Events" : f}
          </button>
        ))}
      </div>

      {/* Event Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-8">
            <Activity className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium">No activity events matching filter</p>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const badge = getStatusBadge(ev.type);
            const Icon = badge.icon;
            const timeAgo = new Date(ev.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={ev.id}
                className="group flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-50/80"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${badge.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {ev.orderNumber}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      ₦{ev.amount.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    <span className="font-medium text-slate-900">{ev.customerName}</span> ordered from{" "}
                    <span className="font-medium text-slate-900">{ev.merchantName}</span>
                  </p>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span className="font-medium text-emerald-600">{badge.label}</span>
                    <span className="font-mono text-[10px]">{timeAgo}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
