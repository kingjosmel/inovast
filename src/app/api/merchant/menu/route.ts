import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import Branch from "@/models/Branch";
import MenuItem from "@/models/MenuItem";
import { MOCK_MENU_ITEMS } from "@/app/api/merchants/[slug]/route";

export async function GET() {
  try {
    const session = await requireRole(["MERCHANT_ADMIN", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let branchId = session.user.activeBranchId;

    try {
      await connectToDatabase();

      if (!branchId) {
        const branch = await Branch.findOne({}).lean();
        if (branch) {
          branchId = String(branch._id);
        }
      }

      if (branchId) {
        const items = await MenuItem.find({ branchId }).lean();
        if (items && items.length > 0) {
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
            branchId,
            items: formatted,
          });
        }
      }
    } catch (dbErr) {
      console.warn("DB menu items fetch fallback", dbErr);
    }

    // Default fallback menu items from Mega Chicken
    const fallbackItems = MOCK_MENU_ITEMS["mega-chicken-ikeja"] || [];
    return NextResponse.json({
      success: true,
      branchId: branchId || "65b002222222222222222201",
      items: fallbackItems,
    });
  } catch (error) {
    console.error("Merchant menu API error", error);
    return NextResponse.json({ error: "Failed to load menu items" }, { status: 500 });
  }
}
