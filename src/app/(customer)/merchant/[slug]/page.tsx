import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Merchant from "@/models/Merchant";
import Branch from "@/models/Branch";
import MenuItem from "@/models/MenuItem";
import { MOCK_MERCHANTS, MerchantFeedItem } from "@/app/api/merchants/route";
import {
  MOCK_MENU_ITEMS,
  SerializedMenuItem,
} from "@/app/api/merchants/[slug]/route";
import { MerchantMenuClient } from "@/components/customer/MerchantMenuClient";

interface MerchantPageProps {
  params: Promise<{ slug: string }>;
}

async function getMerchantAndMenu(slug: string): Promise<{
  merchant: MerchantFeedItem & { address?: string; phone?: string };
  menuItems: SerializedMenuItem[];
} | null> {
  try {
    await connectToDatabase();
    const dbMerchant = await Merchant.findOne({ slug }).lean();
    if (dbMerchant) {
      const branch = await Branch.findOne({ merchantId: dbMerchant._id }).lean();
      const menuItems = await MenuItem.find({
        ...(branch ? { branchId: branch._id } : {}),
      }).lean();

      const serializedItems: SerializedMenuItem[] = menuItems.map((item) => ({
        _id: String(item._id),
        branchId: String(item.branchId),
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        inStock: item.inStock,
        customizationGroups: item.customizationGroups || [],
      }));

      return {
        merchant: {
          id: String(dbMerchant._id),
          merchantId: String(dbMerchant._id),
          branchId: branch ? String(branch._id) : undefined,
          name: dbMerchant.name,
          slug: dbMerchant.slug,
          logoUrl:
            dbMerchant.logoUrl ||
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
          coverImageUrl:
            dbMerchant.coverImageUrl ||
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
          rating: 4.8,
          ratingCount: 180,
          deliveryTime: "25-35 min",
          deliveryFee: branch?.baseDeliveryFee || 700,
          categories: ["Fast Food", "Local"],
          city: branch?.city || "Lagos",
          area: branch?.area || "Ikeja",
          address: branch?.address || "Victoria Island, Lagos",
          phone: branch?.phone || "+234 801 234 5678",
          isOpen: branch?.isOpen ?? true,
        },
        menuItems:
          serializedItems.length > 0
            ? serializedItems
            : MOCK_MENU_ITEMS[slug] || MOCK_MENU_ITEMS["mega-chicken-ikeja"],
      };
    }
  } catch {
    // Database offline fallback
  }

  // Fallback to mock data
  const mockMerchant = MOCK_MERCHANTS.find((m) => m.slug === slug);
  if (!mockMerchant) {
    // Return first mock merchant if slug is unknown
    const fallback = MOCK_MERCHANTS[0];
    return {
      merchant: {
        ...fallback,
        address: "Plot 12, Admiralty Way, Lekki Phase 1, Lagos",
        phone: "+234 802 345 6789",
      },
      menuItems: MOCK_MENU_ITEMS[fallback.slug] || [],
    };
  }

  return {
    merchant: {
      ...mockMerchant,
      address: "15 Isaac John Street, GRA, Ikeja, Lagos",
      phone: "+234 803 456 7890",
    },
    menuItems:
      MOCK_MENU_ITEMS[mockMerchant.slug] ||
      MOCK_MENU_ITEMS["mega-chicken-ikeja"] ||
      [],
  };
}

export async function generateMetadata({ params }: MerchantPageProps) {
  const { slug } = await params;
  const data = await getMerchantAndMenu(slug);
  if (!data) return { title: "Merchant Not Found | FoodGo" };

  return {
    title: `${data.merchant.name} - Order Online | FoodGo`,
    description: `Order from ${data.merchant.name} on FoodGo. Fast delivery in ${data.merchant.area}, ${data.merchant.city}.`,
  };
}

export default async function MerchantPage({ params }: MerchantPageProps) {
  const { slug } = await params;
  const data = await getMerchantAndMenu(slug);

  if (!data) {
    notFound();
  }

  return (
    <MerchantMenuClient
      merchant={data.merchant}
      menuItems={data.menuItems}
    />
  );
}
