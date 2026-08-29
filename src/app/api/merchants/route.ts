import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Merchant from "@/models/Merchant";
import Branch from "@/models/Branch";

export interface MerchantFeedItem {
  id: string;
  merchantId: string;
  branchId?: string;
  name: string;
  slug: string;
  logoUrl: string;
  coverImageUrl: string;
  rating: number;
  ratingCount: number;
  deliveryTime: string;
  deliveryFee: number;
  categories: string[];
  city: string;
  area: string;
  isOpen: boolean;
  featured?: boolean;
}

export const MOCK_MERCHANTS: MerchantFeedItem[] = [
  {
    id: "m-1",
    merchantId: "65b001111111111111111101",
    branchId: "65b002222222222222222201",
    name: "Mega Chicken & Grill",
    slug: "mega-chicken-ikeja",
    logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    ratingCount: 320,
    deliveryTime: "25-35 min",
    deliveryFee: 650,
    categories: ["Fast Food", "Chicken", "Burgers & Grill", "Local"],
    city: "Lagos",
    area: "Ikeja",
    isOpen: true,
    featured: true,
  },
  {
    id: "m-2",
    merchantId: "65b001111111111111111102",
    branchId: "65b002222222222222222202",
    name: "Mama Cass Buka",
    slug: "mama-cass-lekki",
    logoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    ratingCount: 412,
    deliveryTime: "30-40 min",
    deliveryFee: 800,
    categories: ["Local", "Rice & Pasta", "Soups & Stews"],
    city: "Lagos",
    area: "Lekki",
    isOpen: true,
    featured: true,
  },
  {
    id: "m-3",
    merchantId: "65b001111111111111111103",
    branchId: "65b002222222222222222203",
    name: "Kilimanjaro Bistro",
    slug: "kilimanjaro-victoria-island",
    logoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    rating: 4.7,
    ratingCount: 198,
    deliveryTime: "20-30 min",
    deliveryFee: 750,
    categories: ["Fast Food", "Rice & Pasta", "Shawarma"],
    city: "Lagos",
    area: "Victoria Island",
    isOpen: true,
  },
  {
    id: "m-4",
    merchantId: "65b001111111111111111104",
    branchId: "65b002222222222222222204",
    name: "Suya Central & Barbecue",
    slug: "suya-central-yaba",
    logoUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    rating: 4.6,
    ratingCount: 145,
    deliveryTime: "35-45 min",
    deliveryFee: 600,
    categories: ["Burgers & Grill", "Local", "Shawarma"],
    city: "Lagos",
    area: "Yaba",
    isOpen: false,
  },
  {
    id: "m-5",
    merchantId: "65b001111111111111111105",
    branchId: "65b002222222222222222205",
    name: "The Naija Pot",
    slug: "the-naija-pot-wuse",
    logoUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    ratingCount: 260,
    deliveryTime: "25-40 min",
    deliveryFee: 700,
    categories: ["Local", "Rice & Pasta"],
    city: "Abuja",
    area: "Wuse 2",
    isOpen: true,
  },
  {
    id: "m-6",
    merchantId: "65b001111111111111111106",
    branchId: "65b002222222222222222206",
    name: "Urban Pizza & Shawarma",
    slug: "urban-pizza-ikeja",
    logoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
    rating: 4.5,
    ratingCount: 88,
    deliveryTime: "30-50 min",
    deliveryFee: 500,
    categories: ["Fast Food", "Shawarma", "Drinks & Desserts"],
    city: "Lagos",
    area: "Ikeja",
    isOpen: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const area = searchParams.get("area");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let results = [...MOCK_MERCHANTS];

    try {
      await connectToDatabase();
      const merchants = await Merchant.find({ isActive: true }).lean();
      if (merchants && merchants.length > 0) {
        const branches = await Branch.find({}).lean();
        const branchMap = new Map(branches.map((b) => [String(b.merchantId), b]));
        
        const dbItems: MerchantFeedItem[] = merchants.map((m) => {
          const branch = branchMap.get(String(m._id));
          return {
            id: String(m._id),
            merchantId: String(m._id),
            branchId: branch ? String(branch._id) : undefined,
            name: m.name,
            slug: m.slug,
            logoUrl: m.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
            coverImageUrl: m.coverImageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
            rating: 4.8,
            ratingCount: 150,
            deliveryTime: "25-35 min",
            deliveryFee: branch?.baseDeliveryFee || 700,
            categories: ["Fast Food", "Local"],
            city: branch?.city || "Lagos",
            area: branch?.area || "Ikeja",
            isOpen: branch?.isOpen ?? true,
          };
        });
        results = [...dbItems, ...MOCK_MERCHANTS.filter(m => !dbItems.some(d => d.slug === m.slug))];
      }
    } catch {
      // Fallback to mock data if database is offline or unseeded
    }

    if (city) {
      results = results.filter((item) => item.city.toLowerCase() === city.toLowerCase());
    }
    if (area) {
      results = results.filter((item) => item.area.toLowerCase() === area.toLowerCase());
    }
    if (category && category !== "All") {
      results = results.filter((item) =>
        item.categories.some((c) => c.toLowerCase() === category.toLowerCase()),
      );
    }
    if (search) {
      const term = search.toLowerCase();
      results = results.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.categories.some((c) => c.toLowerCase().includes(term)),
      );
    }

    return NextResponse.json({
      success: true,
      merchants: results,
      total: results.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
