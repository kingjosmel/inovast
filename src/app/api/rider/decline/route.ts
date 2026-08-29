import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function POST(request: Request) {
  try {
    const session = await requireRole(["RIDER", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { orderId } = body;

    // Log or track decline in rider dispatch log if needed
    return NextResponse.json({
      success: true,
      orderId,
      message: "Dispatch offer declined",
    });
  } catch (error) {
    console.error("Decline dispatch failed", error);
    return NextResponse.json({ error: "Failed to decline offer" }, { status: 500 });
  }
}
