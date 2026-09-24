import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import mongoose from "mongoose";

export async function PATCH(request: Request) {
  try {
    const session = await requireRole(["MERCHANT_ADMIN", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { menuItemId, inStock } = body;

    if (!menuItemId || typeof inStock !== "boolean") {
      return NextResponse.json(
        { error: "menuItemId and inStock (boolean) are required" },
        { status: 400 },
      );
    }

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 });
    }

    if (session.user.role !== "SUPER_ADMIN" && !session.user.activeBranchId) {
      return NextResponse.json({ error: "No active branch assigned" }, { status: 403 });
    }

    await connectToDatabase();
    const updatedItem = await MenuItem.findOneAndUpdate(
      {
        _id: menuItemId,
        ...(session.user.role === "SUPER_ADMIN" ? {} : { branchId: session.user.activeBranchId }),
      },
      { inStock },
      { new: true },
    ).lean();

    if (!updatedItem) {
      return NextResponse.json({ error: "Menu item not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      menuItemId: String(updatedItem._id),
      inStock: updatedItem.inStock,
      title: updatedItem.title,
    });
  } catch (error) {
    console.error("Failed to update menu stock status", error);
    return NextResponse.json({ error: "Failed to update item stock" }, { status: 500 });
  }
}
