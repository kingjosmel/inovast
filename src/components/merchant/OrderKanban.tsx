"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  Bell,
  ChefHat,
  CheckCircle2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSocketStore } from "@/store/useSocketStore";
import { OrderKanbanCard } from "./OrderKanbanCard";
import { playKitchenChime } from "./SoundEffect";
import type { KanbanOrder } from "@/app/api/merchant/orders/route";
import type { OrderStatus } from "@/models/Order";

interface OrderKanbanProps {
  initialOrders: KanbanOrder[];
  branchId: string;
  branchName?: string;
}

export function OrderKanban({
  initialOrders,
  branchId,
  branchName,
}: OrderKanbanProps) {
  const [orders, setOrders] = useState<KanbanOrder[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const { setSocket, setIsConnected } = useSocketStore();

  // Fetch / Refresh latest orders
  const refreshOrders = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/merchant/orders");
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      }
    } catch {
      toast.error("Failed to sync latest orders");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Socket.io Real-Time connection & room subscription
  useEffect(() => {
    const socketServerUrl =
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const socket = io(socketServerUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    socketRef.current = socket;
    setSocket(socket);

    socket.on("connect", () => {
      setSocketConnected(true);
      setIsConnected(true);

      // Join merchant branch room
      const room = `merchant_${branchId}`;
      socket.emit("join_merchant", { branchId });
      socket.emit("join_room", { room });
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      setIsConnected(false);
    });

    // Listen for new incoming orders
    socket.on("new_order", (newOrder: KanbanOrder) => {
      if (soundEnabled) {
        playKitchenChime();
      }

      toast.success(`New Order Received! ${newOrder.orderNumber || ""}`, {
        description: `${newOrder.customerName || "Customer"} - ₦${(newOrder.totalAmount || 0).toLocaleString()}`,
        icon: <Bell className="h-4 w-4 text-emerald-600 animate-bounce" />,
        duration: 6000,
      });

      // Prepend to orders list
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
    });

    // Listen for status changes from other terminals/riders
    socket.on(
      "order_status_changed",
      (payload: { orderId: string; status: OrderStatus }) => {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === payload.orderId ? { ...o, status: payload.status } : o,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [branchId, soundEnabled, setIsConnected, setSocket]);

  // Handle Optimistic Status Transition
  const handleStatusChange = async (
    orderId: string,
    nextStatus: OrderStatus,
  ) => {
    // Save previous state for rollback
    const previousOrders = [...orders];

    // 1. Optimistically update local state
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? {
              ...o,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );

    try {
      // 2. Trigger API PATCH request
      const res = await fetch("/api/orders/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: nextStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status on server");
      }

      if (nextStatus === "CONFIRMED" || nextStatus === "PREPARING") {
        toast.success("Order accepted! Moved to Kitchen Preparation");
      } else if (nextStatus === "READY") {
        toast.success("Order marked Ready for Courier Pick-Up!");
      }
    } catch {
      // 3. Rollback state if network fails
      setOrders(previousOrders);
      toast.error("Failed to update order status. Rolled back.");
    }
  };

  // Test Simulation: Inject a test new order
  const handleSimulateNewOrder = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const mockNew: KanbanOrder = {
      _id: `ord-sim-${Date.now()}`,
      orderNumber: `#FG-${randomNum}`,
      customerName: "Blessing Nnamdi",
      customerPhone: "+234 812 345 6789",
      branchId,
      items: [
        {
          title: "Smoky Jollof Rice Special with Grilled Chicken",
          quantity: 1,
          unitPrice: 5200,
          optionsSelected: ["Grilled Chicken Lap", "Fried Sweet Plantain (Dodo)"],
        },
        {
          title: "Chilled Zobo Berry Cooler (50cl)",
          quantity: 2,
          unitPrice: 1500,
          optionsSelected: ["Less Ice"],
        },
      ],
      subtotal: 8200,
      deliveryFee: 700,
      totalAmount: 8900,
      status: "PLACED",
      paymentStatus: "PAID",
      deliveryInstructions: "Extra pepper sauce please!",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (soundEnabled) {
      playKitchenChime();
    }

    toast.success(`Simulated New Order ${mockNew.orderNumber} Received!`, {
      icon: <Bell className="h-4 w-4 text-emerald-600 animate-bounce" />,
    });

    setOrders((prev) => [mockNew, ...prev]);
  };

  // Filtered orders by search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.items.some((it) => it.title.toLowerCase().includes(q)),
    );
  }, [orders, searchQuery]);

  // Split into Kanban Columns
  const incomingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "PLACED"),
    [filteredOrders],
  );

  const preparingOrders = useMemo(
    () =>
      filteredOrders.filter(
        (o) => o.status === "CONFIRMED" || o.status === "PREPARING",
      ),
    [filteredOrders],
  );

  const readyOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "READY"),
    [filteredOrders],
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Kitchen Display System (KDS)
            </h2>
            <p className="text-xs text-slate-500">
              Active branch: {branchName || "Main Kitchen"} • Real-time order dispatch
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Socket Status Pill */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              socketConnected
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {socketConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                <span>Live Socket</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                <span>Local Sync</span>
              </>
            )}
          </div>

          {/* Audio Chime Mute/Unmute */}
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) {
                playKitchenChime();
                toast.info("Kitchen audio chime enabled");
              } else {
                toast.info("Kitchen audio chime muted");
              }
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              soundEnabled
                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
            title="Toggle kitchen chime sound"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-emerald-600" />
                <span>Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-rose-600" />
                <span>Muted</span>
              </>
            )}
          </button>

          {/* Test Chime button */}
          <button
            type="button"
            onClick={() => {
              playKitchenChime();
              toast.info("Testing kitchen audio chime alert", {
                icon: <Bell className="h-4 w-4 text-emerald-600" />,
              });
            }}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Test Sound</span>
          </button>

          {/* Simulate New Order button */}
          <button
            type="button"
            onClick={handleSimulateNewOrder}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 cursor-pointer active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Simulate Order</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={refreshOrders}
            disabled={isRefreshing}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="kanban-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order #, customer, or dish name..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
        />
      </div>

      {/* Kanban Grid (3 Columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. INCOMING COLUMN */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                1. Incoming Orders
              </h3>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
              {incomingOrders.length}
            </span>
          </div>

          <div className="mt-4 flex-1 space-y-3 min-h-[360px]">
            {incomingOrders.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 text-center p-4">
                <Package className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No incoming orders</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  New orders will automatically appear here with sound alert
                </p>
              </div>
            ) : (
              incomingOrders.map((order) => (
                <OrderKanbanCard
                  key={order._id}
                  order={order}
                  columnType="INCOMING"
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>

        {/* 2. PREPARING COLUMN */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-blue-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-blue-200/60">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                2. In Kitchen (Preparing)
              </h3>
            </div>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
              {preparingOrders.length}
            </span>
          </div>

          <div className="mt-4 flex-1 space-y-3 min-h-[360px]">
            {preparingOrders.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white/50 text-center p-4">
                <ChefHat className="h-8 w-8 text-blue-200 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Kitchen is idle</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Accept incoming orders to move them to kitchen preparation
                </p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <OrderKanbanCard
                  key={order._id}
                  order={order}
                  columnType="PREPARING"
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>

        {/* 3. READY COLUMN */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                3. Ready For Pick-Up
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              {readyOrders.length}
            </span>
          </div>

          <div className="mt-4 flex-1 space-y-3 min-h-[360px]">
            {readyOrders.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-white/50 text-center p-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-200 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No packaged orders waiting</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Prepared dishes await courier dispatch handover here
                </p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderKanbanCard
                  key={order._id}
                  order={order}
                  columnType="READY"
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
