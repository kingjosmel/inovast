import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await requireRole(["CUSTOMER"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id)
      .select("name email phone role")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "Customer account not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Customer account lookup failed", error);
    return NextResponse.json({ error: "Unable to load customer account" }, { status: 500 });
  }
}