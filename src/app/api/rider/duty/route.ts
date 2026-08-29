import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { removeRiderLocation } from "@/lib/redis";

export async function PATCH(request: Request) {
  try {
    const session = await requireRole(["RIDER", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { isOnline } = body;

    if (typeof isOnline !== "boolean") {
      return NextResponse.json({ error: "isOnline (boolean) is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      await User.findByIdAndUpdate(session.user.id, { isOnline });
      
      if (!isOnline) {
        // Remove from active riders geo set in Redis
        await removeRiderLocation(session.user.id);
      }
    } catch (dbErr) {
      console.warn("DB rider duty update fallback", dbErr);
    }

    return NextResponse.json({
      success: true,
      isOnline,
      riderId: session.user.id,
    });
  } catch (error) {
    console.error("Failed to update rider duty status", error);
    return NextResponse.json({ error: "Failed to update duty status" }, { status: 500 });
  }
}
