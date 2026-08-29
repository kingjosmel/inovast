"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import {
  Building,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Receipt,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useLocationStore } from "@/store/useLocationStore";
import { toast } from "sonner";

// Extend Window interface for Paystack Inline JS
declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number; // in kobo
        ref: string;
        currency?: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string; status?: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

const nigerianPhoneRegex = /^([+]?234|0)[789][01]\d{8}$/;

const checkoutFormSchema = z.object({
  addressLine: z
    .string()
    .trim()
    .min(5, "Please provide a complete street address (min 5 chars)"),
  area: z.string().trim().min(2, "Area or neighborhood is required"),
  city: z.string().trim().min(2, "City is required"),
  landmark: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .regex(
      nigerianPhoneRegex,
      "Please enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678)",
    ),
  deliveryNotes: z.string().trim().optional(),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "USSD"]),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart } = useCartStore();
  const { selectedBranchId, selectedCity, selectedArea } = useLocationStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subtotal
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [items]);

  // Delivery fee & Service fee
  const deliveryFee = items.length > 0 ? 650 : 0;
  const serviceFee = items.length > 0 ? Math.max(200, Math.min(500, Math.round(subtotal * 0.05))) : 0;
  const grandTotal = subtotal + deliveryFee + serviceFee;

  // React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      addressLine: "",
      area: selectedArea || "Victoria Island",
      city: selectedCity || "Lagos",
      landmark: "",
      phone: "",
      deliveryNotes: "",
      paymentMethod: "CARD",
    },
  });

  // Sync location store defaults into form
  useEffect(() => {
    if (selectedArea) setValue("area", selectedArea);
    if (selectedCity) setValue("city", selectedCity);
  }, [selectedArea, selectedCity, setValue]);

  // Handle Paystack Popup invocation
  const triggerPaystackInline = (
    orderId: string,
    orderNumber: string,
    reference: string,
    amountInNaira: number,
    publicKey: string,
    customerEmail: string,
  ) => {
    if (typeof window !== "undefined" && window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: publicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_demo",
        email: customerEmail || session?.user?.email || "customer@foodgo.ng",
        amount: Math.round(amountInNaira * 100), // in kobo
        ref: reference,
        currency: "NGN",
        metadata: {
          orderId,
          orderNumber,
          custom_fields: [
            {
              display_name: "Order Number",
              variable_name: "order_number",
              value: orderNumber,
            },
          ],
        },
        callback: async (response) => {
          toast.success("Payment verified! Redirecting to live tracking...");
          try {
            // Confirm payment on server
            await fetch(`/api/orders/${orderId}/pay`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: response.reference || reference }),
            });
          } catch (e) {
            console.error("Payment confirmation failed", e);
          }

          // Clear local cart
          clearCart();
          // Navigate to live tracking page
          router.push(`/orders/${orderId}/track`);
        },
        onClose: () => {
          setIsSubmitting(false);
          toast.error("Payment was cancelled or closed. You can retry anytime.", {
            description: "Your order has been saved. Click 'Pay Now with Paystack' to resume.",
            action: {
              label: "Retry Pay",
              onClick: () =>
                triggerPaystackInline(
                  orderId,
                  orderNumber,
                  reference,
                  amountInNaira,
                  publicKey,
                  customerEmail,
                ),
            },
          });
        },
      });

      handler.openIframe();
    } else {
      // Fallback if Paystack JS failed to load
      toast.info("Opening secure checkout portal...");
      setTimeout(async () => {
        try {
          await fetch(`/api/orders/${orderId}/pay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          });
        } catch {}
        clearCart();
        router.push(`/orders/${orderId}/track`);
      }, 1500);
    }
  };

  // Form submission handler
  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      router.push("/");
      return;
    }

    setIsSubmitting(true);

    try {
      const branchId = selectedBranchId || "65f000000000000000000001";

      const formattedItems = items.map((item) => {
        const cleanId = item.menuItemId?.includes("-")
          ? item.menuItemId.split("-")[0]
          : item.menuItemId || "65f000000000000000000001";

        return {
          menuItemId: cleanId,
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          selectedOptions: [],
        };
      });

      const payload = {
        branchId,
        deliveryAddress: {
          addressLine: data.addressLine,
          city: data.city,
          area: data.area,
          landmark: data.landmark || "",
          phone: data.phone,
          deliveryInstructions: data.deliveryNotes || "",
          notes: data.deliveryNotes || "",
        },
        items: formattedItems,
        paymentMethod: data.paymentMethod,
      };

      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initialize order");
      }

      const { orderId, orderNumber, reference, amount, paystackPublicKey, email } = result;

      toast.success("Order created! Opening Paystack payment portal...");

      // Trigger Paystack Inline Popup
      triggerPaystackInline(
        orderId,
        orderNumber,
        reference,
        amount || grandTotal,
        paystackPublicKey,
        email || session?.user?.email || "customer@foodgo.ng",
      );
    } catch (error) {
      console.error("Checkout submission failed", error);
      const msg = error instanceof Error ? error.message : "Checkout failed. Please try again.";
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg text-center py-16">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-4 shadow-sm">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add some delicious food to your cart before proceeding to checkout.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition"
        >
          <span>Browse Restaurants</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Paystack Inline Dynamic Script */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
      />

      <div className="space-y-6">
        {/* Navigation Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/cart" className="hover:text-slate-900 transition">
            Cart
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 font-semibold">Checkout</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Delivery & Payment Checkout
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Provide your delivery address and complete payment via Paystack inline gateway.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Delivery Details Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Delivery Details Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 font-black text-xs">
                    1
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Delivery Address & Contact
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Street Address Line */}
                  <div>
                    <label htmlFor="addressLine" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Street Address / House Number *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="addressLine"
                        type="text"
                        placeholder="e.g. 14 Admiralty Way, Block B, Flat 3"
                        {...register("addressLine")}
                        className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                          errors.addressLine
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                            : "border-slate-200 focus:border-orange-500 focus:ring-orange-200"
                        }`}
                      />
                    </div>
                    {errors.addressLine && (
                      <p className="mt-1 text-xs font-semibold text-rose-600">
                        {errors.addressLine.message}
                      </p>
                    )}
                  </div>

                  {/* Area & City Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="area" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Area / Neighborhood *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          id="area"
                          type="text"
                          placeholder="e.g. Lekki Phase 1, Ikeja, Yaba"
                          {...register("area")}
                          className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                            errors.area
                              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                              : "border-slate-200 focus:border-orange-500 focus:ring-orange-200"
                          }`}
                        />
                      </div>
                      {errors.area && (
                        <p className="mt-1 text-xs font-semibold text-rose-600">
                          {errors.area.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-xs font-bold text-slate-700 mb-1.5">
                        City *
                      </label>
                      <input
                        id="city"
                        type="text"
                        placeholder="e.g. Lagos, Abuja"
                        {...register("city")}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                          errors.city
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                            : "border-slate-200 focus:border-orange-500 focus:ring-orange-200"
                        }`}
                      />
                      {errors.city && (
                        <p className="mt-1 text-xs font-semibold text-rose-600">
                          {errors.city.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Landmark & Phone Number Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="landmark" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Closest Landmark (Optional)
                      </label>
                      <input
                        id="landmark"
                        type="text"
                        placeholder="e.g. Opposite Filmhouse Cinema"
                        {...register("landmark")}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Recipient Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          id="phone"
                          type="tel"
                          placeholder="e.g. 08012345678"
                          {...register("phone")}
                          className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                            errors.phone
                              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                              : "border-slate-200 focus:border-orange-500 focus:ring-orange-200"
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-xs font-semibold text-rose-600">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Instructions */}
                  <div>
                    <label htmlFor="deliveryNotes" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Delivery Instructions & Rider Notes
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <textarea
                        id="deliveryNotes"
                        rows={2}
                        placeholder="e.g. Please leave at front desk, ring the buzzer, extra spicy sauce please"
                        {...register("deliveryNotes")}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 font-black text-xs">
                    2
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <h2 className="text-base font-extrabold text-slate-900">
                      Payment Gateway
                    </h2>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <Lock className="h-3 w-3" />
                      256-Bit Encrypted
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-orange-500 bg-orange-50/50 p-4 transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-orange-500 bg-orange-500 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Paystack</p>
                        <p className="text-[10px] text-slate-500">Cards, Transfer, USSD</p>
                      </div>
                    </div>
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </label>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Upon clicking submit, the official Paystack inline popup modal will appear securely on your screen to complete transaction authorization.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                id="submit-order-checkout-button"
                disabled={isSubmitting || items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-base font-extrabold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Pay ₦{grandTotal.toLocaleString()} with Paystack</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Order Review */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-orange-500" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Order Summary ({items.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                </div>
                <Link
                  href="/cart"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
                >
                  Edit Cart
                </Link>
              </div>

              {/* Item List */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {items.map((item) => (
                  <div
                    key={item.id || item.menuItemId}
                    className="flex items-center justify-between text-xs text-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 font-bold text-slate-700 shrink-0">
                        {item.quantity}x
                      </span>
                      <span className="truncate font-semibold text-slate-900">
                        {item.title}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₦{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee (Standard)</span>
                  <span className="font-bold text-slate-900">₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service & Processing Fee</span>
                  <span className="font-bold text-slate-900">₦{serviceFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900">Total Due</span>
                    <p className="text-[10px] text-slate-400">Instant Paystack Settlement</p>
                  </div>
                  <span className="text-xl font-black text-slate-900">
                    ₦{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Security Shield Badge */}
              <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  Your payments are processed securely by <strong>Paystack</strong>. No sensitive card credentials are saved on FoodGo servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
