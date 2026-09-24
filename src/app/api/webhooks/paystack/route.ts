import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import Order from "@/models/Order";

interface PaystackWebhookPayload {
  event?: string;
  data?: {
    reference?: string;
    amount?: number;
    currency?: string;
    metadata?: {
      orderId?: string;
    };
  };
}

function signaturesMatch(signature: string, body: string, secret: string): boolean {
  const expected = createHmac("sha512", secret).update(body).digest("hex");
  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.headers.get("x-paystack-signature");

  if (!secret || !signature) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const rawBody = await request.text();

  if (!signaturesMatch(signature, rawBody, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as PaystackWebhookPayload;

    if (payload.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const orderId = payload.data?.metadata?.orderId;
    const reference = payload.data?.reference;

    if (!orderId || !reference) {
      return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    }

    await connectToDatabase();
    const existingOrder = await Order.findOne({
      _id: orderId,
      paystackReference: reference,
    }).lean();

    if (!existingOrder) {
      return NextResponse.json({ error: "Payment does not match an order" }, { status: 400 });
    }

    if (payload.data?.currency && payload.data.currency !== "NGN") {
      return NextResponse.json({ error: "Unsupported payment currency" }, { status: 400 });
    }

    if (typeof payload.data?.amount === "number" && payload.data.amount !== Math.round(existingOrder.totalAmount * 100)) {
      return NextResponse.json({ error: "Payment amount does not match order" }, { status: 400 });
    }

    const order = await Order.findOneAndUpdate(
      { _id: existingOrder._id, paymentStatus: { $ne: "PAID" } },
      { paymentStatus: "PAID" },
      { new: true },
    ).lean();

    if (!order) {
      return NextResponse.json({ received: true });
    }

    await AuditLog.create({
      actorId: order.customerId,
      action: "PAYMENT_SUCCEEDED",
      targetModel: "Order",
      targetId: order._id,
      metadata: { reference, event: payload.event },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}