import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import MenuItem from "@/models/MenuItem";

const createMenuItemSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(500),
  price: z.number().finite().positive(),
  category: z.string().trim().min(1).max(80),
  imageUrl: z.string().trim().url().or(z.literal("")),
  inStock: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await requireRole(["MERCHANT_ADMIN", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const branchId = session.user.activeBranchId;
    if (!branchId && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No active branch assigned" }, { status: 403 });
    }

    await connectToDatabase();
    const items = branchId ? await MenuItem.find({ branchId }).lean() : [];
    const formatted = items.map((it) => ({
      _id: String(it._id),
      branchId: String(it.branchId),
      title: it.title,
      description: it.description,
      price: it.price,
      category: it.category,
      imageUrl: it.imageUrl,
      inStock: it.inStock,
      customizationGroups: it.customizationGroups || [],
    }));

    return NextResponse.json({
      success: true,
      branchId: branchId || null,
      items: formatted,
    });
  } catch (error) {
    console.error("Merchant menu API error", error);
    return NextResponse.json({ error: "Failed to load menu items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["MERCHANT_ADMIN", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!session.user.activeBranchId) {
      return NextResponse.json({ error: "No active branch assigned" }, { status: 403 });
    }

    const parsed = createMenuItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid menu item details" }, { status: 400 });
    }

    await connectToDatabase();
    const item = await MenuItem.create({
      ...parsed.data,
      branchId: session.user.activeBranchId,
      imageUrl:
        parsed.data.imageUrl ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    });

    return NextResponse.json(
      {
        success: true,
        item: {
          _id: String(item._id),
          branchId: String(item.branchId),
          title: item.title,
          description: item.description,
          price: item.price,
          category: item.category,
          imageUrl: item.imageUrl,
          inStock: item.inStock,
          customizationGroups: item.customizationGroups || [],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Merchant menu item creation failed", error);
    return NextResponse.json({ error: "Failed to add menu item" }, { status: 500 });
  }
}
