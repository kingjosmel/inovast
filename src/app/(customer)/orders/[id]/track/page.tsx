"use client";

import { useEffect, useState, use, useMemo, useCallback } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import {
  Bike,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  PackageCheck,
  Phone,
  Play,
  RefreshCw,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useSocketStore } from "@/store/useSocketStore";
import { toast } from "sonner";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

interface OrderItem {
  menuItemId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  optionsSelected?: string[];
}

interface OrderData {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
  createdAt: string;
  deliveryAddress: {
    addressLine: string;
    city: string;
    area: string;
    landmark?: string;
    phone?: string;
    deliveryInstructions?: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  branchId?: {
    _id: string;
    name: string;
    address: string;
    city: string;
    area: string;
    phone: string;
    location?: {
      coordinates: [number, number]; // [lng, lat]
    };
  };
  riderId?: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  items: OrderItem[];
}

const STEP_STAGES: Array<{
  key: "PLACED" | "CONFIRMED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED";
  label: string;
  description: string;
  icon: typeof ShoppingBag;
}> = [
  { key: "PLACED", label: "Placed", description: "Order received", icon: ShoppingBag },
  { key: "CONFIRMED", label: "Confirmed", description: "Restaurant accepted", icon: CheckCircle2 },
  { key: "PREPARING", label: "Preparing", description: "Chef is cooking", icon: UtensilsCrossed },
  { key: "READY", label: "Ready", description: "Packed for pickup", icon: PackageCheck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", description: "Rider on the way", icon: Bike },
  { key: "DELIVERED", label: "Delivered", description: "Arrived at destination", icon: Home },
];

function getStepIndex(status: OrderStatus): number {
  if (status === "PICKED_UP") return 4;
  switch (status) {
    case "PLACED":
      return 0;
    case "CONFIRMED":
      return 1;
    case "PREPARING":
      return 2;
    case "READY":
      return 3;
    case "OUT_FOR_DELIVERY":
      return 4;
    case "DELIVERED":
      return 5;
    case "CANCELLED":
      return -1;
    default:
      return 0;
  }
}

export default function OrderTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderIdOrNumber = resolvedParams.id;

  const { socket, setSocket, setIsConnected } = useSocketStore();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("PLACED");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Rider position state for live map marker
  const [riderPosition, setRiderPosition] = useState<{ lat: number; lng: number }>({
    lat: 6.4698,
    lng: 3.5852,
  });

  // Branch & Customer coordinates
  const branchPosition = useMemo<{ lat: number; lng: number }>(() => {
    if (order?.branchId?.location?.coordinates) {
      const [lng, lat] = order.branchId.location.coordinates;
      return { lat, lng };
    }
    return { lat: 6.4600, lng: 3.5800 };
  }, [order]);

  const customerPosition = useMemo<{ lat: number; lng: number }>(() => {
    if (order?.deliveryAddress?.coordinates) {
      const [lng, lat] = order.deliveryAddress.coordinates;
      return { lat, lng };
    }
    return { lat: 6.4750, lng: 3.5950 };
  }, [order]);

  // Load Google Maps JavaScript API
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: "foodgo-google-map-script",
    googleMapsApiKey: mapsApiKey,
  });

  // Fetch Order Data
  const fetchOrder = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch(`/api/orders/${orderIdOrNumber}`);
      if (!res.ok) {
        throw new Error("Unable to retrieve order details");
      }
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
        const st = data.order.status || "PLACED";
        setCurrentStatus(st);

        // Position rider near branch initially
        if (data.order.branchId?.location?.coordinates) {
          const [lng, lat] = data.order.branchId.location.coordinates;
          setRiderPosition({ lat, lng });
        }
      }
    } catch (err) {
      console.error("Order fetch error:", err);
      setFetchError("Unable to load order details. Please check order number.");
    } finally {
      setIsLoading(false);
    }
  }, [orderIdOrNumber]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${orderIdOrNumber}`);
        if (!res.ok) throw new Error("Unable to retrieve order details");
        const data = await res.json();
        if (!ignore && data.order) {
          setOrder(data.order);
          setCurrentStatus(data.order.status || "PLACED");
          if (data.order.branchId?.location?.coordinates) {
            const [lng, lat] = data.order.branchId.location.coordinates;
            setRiderPosition({ lat, lng });
          }
        }
      } catch {
        if (!ignore) {
          setFetchError("Unable to load order details. Please check order number.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [orderIdOrNumber]);

  // Socket.io Room Join & Real-Time Event Listeners
  useEffect(() => {
    if (!orderIdOrNumber) return;

    let socketInstance: Socket | null = socket;

    if (!socketInstance) {
      const socketServerUrl =
        process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      try {
        socketInstance = io(socketServerUrl, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 5,
          timeout: 8000,
        });

        setSocket(socketInstance);
      } catch (err) {
        console.warn("Socket initialization notice:", err);
      }
    }

    if (socketInstance) {
      const roomName = `order_${order?._id || orderIdOrNumber}`;

      socketInstance.on("connect", () => {
        setIsConnected(true);
        socketInstance?.emit("join_room", { room: roomName });
        socketInstance?.emit("join", roomName);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      // Join room immediately if already connected
      if (socketInstance.connected) {
        socketInstance.emit("join_room", { room: roomName });
        socketInstance.emit("join", roomName);
      }

      // Listen for order status changes
      socketInstance.on("order_status_changed", (payload: { orderId?: string; status: OrderStatus }) => {
        if (payload?.status) {
          setCurrentStatus(payload.status);
          toast.info(`Order status updated: ${payload.status.replace(/_/g, " ")}`);
        }
      });

      // Listen for rider moved events
      socketInstance.on("rider_moved", (payload: { lat: number; lng: number; orderId?: string }) => {
        if (payload?.lat && payload?.lng) {
          setRiderPosition({ lat: payload.lat, lng: payload.lng });
        }
      });
    }

    return () => {
      if (socketInstance) {
        socketInstance.off("order_status_changed");
        socketInstance.off("rider_moved");
      }
    };
  }, [orderIdOrNumber, order?._id, socket, setSocket, setIsConnected]);

  // Interactive Real-Time Movement Simulator (for demo / testing)
  const runLiveSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    toast.info("Starting live dispatch & rider movement simulation...");

    let stepCount = 0;
    const totalSteps = 20;

    const startLat = branchPosition.lat;
    const startLng = branchPosition.lng;
    const destLat = customerPosition.lat;
    const destLng = customerPosition.lng;

    const interval = setInterval(() => {
      stepCount++;

      // Progressively advance status
      if (stepCount === 2) {
        setCurrentStatus("CONFIRMED");
        toast.info("Status: Restaurant Confirmed Order");
      } else if (stepCount === 5) {
        setCurrentStatus("PREPARING");
        toast.info("Status: Chef Preparing Order");
      } else if (stepCount === 9) {
        setCurrentStatus("READY");
        toast.info("Status: Order Packed & Ready for Pickup");
      } else if (stepCount === 12) {
        setCurrentStatus("OUT_FOR_DELIVERY");
        toast.success("Status: Rider Picked Up & Out for Delivery!");
      }

      // Move rider smoothly along route
      if (stepCount >= 10) {
        const progress = (stepCount - 10) / (totalSteps - 10);
        const currentLat = startLat + (destLat - startLat) * progress;
        const currentLng = startLng + (destLng - startLng) * progress;
        setRiderPosition({ lat: currentLat, lng: currentLng });
      }

      if (stepCount >= totalSteps) {
        clearInterval(interval);
        setCurrentStatus("DELIVERED");
        setRiderPosition({ lat: destLat, lng: destLng });
        setIsSimulating(false);
        toast.success("Order Delivered Successfully! Enjoy your meal.");
      }
    }, 1200);
  };

  const currentStepIndex = getStepIndex(currentStatus);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="text-sm font-bold text-slate-700">Connecting to live tracking...</p>
      </div>
    );
  }

  if (fetchError && !order) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center">
        <h2 className="text-lg font-black text-rose-900">Order Not Found</h2>
        <p className="text-xs text-rose-700 mt-1">{fetchError}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={fetchOrder}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
          <Link
            href="/"
            className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-orange-600"
          >
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/" className="hover:text-slate-900 transition">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-900 font-semibold">Live Tracking</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Order #{order?.orderNumber || orderIdOrNumber}
            </h1>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-extrabold tracking-wide uppercase ${
                currentStatus === "DELIVERED"
                  ? "bg-emerald-100 text-emerald-800"
                  : currentStatus === "CANCELLED"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-orange-100 text-orange-800 animate-pulse"
              }`}
            >
              {currentStatus.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Live Simulator Button for Interactive Testing */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runLiveSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-100 active:scale-95 disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Simulating Dispatch...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-orange-700" />
                <span>Simulate Live Route</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={fetchOrder}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            title="Refresh Order Status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Visual Progress Bar / Status Stepper */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                {currentStatus === "DELIVERED"
                  ? "Order Delivered!"
                  : currentStatus === "OUT_FOR_DELIVERY"
                  ? "Rider is Approaching (~8-12 mins)"
                  : "Estimated Arrival: 25 - 35 mins"}
              </h2>
              <p className="text-xs text-slate-500">
                Real-time updates via Socket.io connection
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Socket Connected</span>
          </div>
        </div>

        {/* Stepper Steps Desktop & Mobile */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6 relative">
          {STEP_STAGES.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className={`flex flex-col items-center text-center p-3 rounded-2xl transition duration-300 ${
                  isCurrent
                    ? "bg-orange-50/80 border-2 border-orange-500 shadow-sm"
                    : isCompleted
                    ? "bg-slate-50 border border-slate-200"
                    : "opacity-40 border border-transparent"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isCurrent
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-4 ring-orange-100"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <p className="mt-2 text-xs font-extrabold text-slate-900">
                  {step.label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Google Maps View & Order Details */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Live Google Map */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative h-[440px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            {isMapLoaded && mapsApiKey ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={riderPosition}
                zoom={14}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  styles: [
                    {
                      featureType: "poi",
                      elementType: "labels",
                      stylers: [{ visibility: "off" }],
                    },
                  ],
                }}
              >
                {/* Branch / Restaurant Marker */}
                <Marker
                  position={branchPosition}
                  title={order?.branchId?.name || "Restaurant"}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
                  }}
                />

                {/* Customer Destination Marker */}
                <Marker
                  position={customerPosition}
                  title="Delivery Destination"
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  }}
                />

                {/* Live Rider Marker */}
                <Marker
                  position={riderPosition}
                  title="FoodGo Courier"
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/motorcycle.png",
                  }}
                />
              </GoogleMap>
            ) : (
              /* Fallback Interactive SVG Map Visualizer if Maps key is loading / mock */
              <div className="relative flex h-full w-full flex-col items-center justify-center bg-slate-900 p-6 text-white overflow-hidden">
                {/* Subtle grid background */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

                {/* Route Vector Graphic */}
                <div className="relative z-10 flex w-full max-w-md items-center justify-between px-8">
                  {/* Restaurant Node */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/40">
                      <Store className="h-6 w-6" />
                    </div>
                    <span className="mt-2 text-xs font-bold text-slate-200">
                      {order?.branchId?.name || "Restaurant"}
                    </span>
                    <span className="text-[10px] text-slate-400">Prep Kitchen</span>
                  </div>

                  {/* Dynamic Rider Node */}
                  <div className="flex flex-col items-center transition-all duration-700 animate-bounce">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/50 ring-4 ring-emerald-400/30">
                      <Bike className="h-7 w-7" />
                    </div>
                    <span className="mt-1.5 text-xs font-black text-emerald-400">
                      Courier On Route
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {riderPosition.lat.toFixed(4)}, {riderPosition.lng.toFixed(4)}
                    </span>
                  </div>

                  {/* Destination Node */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/40">
                      <Home className="h-6 w-6" />
                    </div>
                    <span className="mt-2 text-xs font-bold text-slate-200">
                      {order?.deliveryAddress?.area || "Your Doorstep"}
                    </span>
                    <span className="text-[10px] text-slate-400">Destination</span>
                  </div>
                </div>

                <div className="relative z-10 mt-8 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2 text-xs text-slate-300">
                  Live Dispatch GPS: <strong className="text-white">Lat {riderPosition.lat.toFixed(4)}, Lng {riderPosition.lng.toFixed(4)}</strong>
                </div>
              </div>
            )}

            {/* Map Overlay Card */}
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-lg border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {order?.deliveryAddress?.addressLine || "Delivery Location"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {order?.deliveryAddress?.area}, {order?.deliveryAddress?.city}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-orange-600">
                  {currentStatus === "DELIVERED" ? "Delivered" : "In Transit"}
                </span>
                <p className="text-[10px] text-slate-400">Live GPS telemetry</p>
              </div>
            </div>
          </div>

          {/* Courier Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 font-extrabold text-sm border border-slate-200">
                <Bike className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Your Dispatch Courier
                </p>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {order?.riderId?.name || "Tunde Ibrahim (FoodGo Express)"}
                </h4>
                <p className="text-xs text-slate-500">
                  Yamaha Crux • Plate: KJA-482-XA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${order?.riderId?.phone || "08012345678"}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                aria-label="Call Rider"
              >
                <Phone className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => toast.info("Opening messenger with your driver...")}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Message Rider"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Details & Receipt */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Order Summary
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {order?.items?.reduce((s, i) => s + i.quantity, 0) || 0} items
              </span>
            </div>

            {/* Restaurant Details */}
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700">
              <Store className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">
                  {order?.branchId?.name || "FoodGo Partner Kitchen"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {order?.branchId?.address || "Lagos, Nigeria"}
                </p>
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700">
              <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">
                  {order?.deliveryAddress?.addressLine}
                </p>
                <p className="text-[11px] text-slate-500">
                  {order?.deliveryAddress?.area}, {order?.deliveryAddress?.city}
                </p>
                {order?.deliveryAddress?.deliveryInstructions && (
                  <p className="mt-1 text-[11px] text-orange-700 italic">
                    Note: &ldquo;{order.deliveryAddress.deliveryInstructions}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {order?.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs text-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 font-bold text-slate-700">
                      {item.quantity}x
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.title}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₦{(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">
                  ₦{order?.subtotal?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-slate-900">
                  ₦{order?.deliveryFee?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee</span>
                <span className="font-bold text-slate-900">
                  ₦{order?.serviceFee?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-extrabold text-slate-900">Total Paid</span>
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    Paystack Payment • {order?.paymentStatus || "PAID"}
                  </p>
                </div>
                <span className="text-xl font-black text-slate-900">
                  ₦{order?.totalAmount?.toLocaleString() || "0"}
                </span>
              </div>
            </div>

            {/* Support & Action */}
            <div className="pt-2">
              <Link
                href="/"
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
