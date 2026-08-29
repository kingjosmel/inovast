import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Merchant from "@/models/Merchant";
import Branch from "@/models/Branch";
import MenuItem, { ICustomizationGroup } from "@/models/MenuItem";
import { MOCK_MERCHANTS } from "../route";

export interface SerializedMenuItem {
  _id: string;
  branchId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  customizationGroups: ICustomizationGroup[];
}

export const MOCK_MENU_ITEMS: Record<string, SerializedMenuItem[]> = {
  "mega-chicken-ikeja": [
    {
      _id: "mi-101",
      branchId: "65b002222222222222222201",
      title: "Crispy Fried Chicken (2 Pcs) & Chips",
      description: "Golden seasoned deep-fried chicken quarters served with freshly cut salted french fries and signature dip.",
      price: 4800,
      category: "Chicken & Combos",
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      customizationGroups: [
        {
          groupName: "Choose Your Spice Level",
          required: true,
          options: [
            { name: "Mild Herb & Garlic", extraPrice: 0 },
            { name: "Spicy Pepper Sauce", extraPrice: 200 },
            { name: "Extra Hot Suya Pepper", extraPrice: 350 },
          ],
        },
        {
          groupName: "Add Extra Side / Drink",
          required: false,
          options: [
            { name: "Extra Coleslaw", extraPrice: 800 },
            { name: "Fried Sweet Plantain (Dodo)", extraPrice: 1200 },
            { name: "Chilled Chapman (50cl)", extraPrice: 1500 },
            { name: "Bottled Water (75cl)", extraPrice: 500 },
          ],
        },
      ],
    },
    {
      _id: "mi-102",
      branchId: "65b002222222222222222201",
      title: "Smoky Jollof Rice Special with Grilled Chicken",
      description: "Firewood party-style smoky jollof rice paired with tender spiced grilled chicken lap and fried plantain.",
      price: 5200,
      category: "Rice & Specials",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      customizationGroups: [
        {
          groupName: "Select Protein Cut",
          required: true,
          options: [
            { name: "Grilled Chicken Lap", extraPrice: 0 },
            { name: "Crispy Fried Turkey", extraPrice: 1200 },
            { name: "Peppered Beef Chunk", extraPrice: 900 },
            { name: "Grilled Catfish Slice", extraPrice: 1600 },
          ],
        },
        {
          groupName: "Extra Add-ons",
          required: false,
          options: [
            { name: "Boiled Egg (1 pc)", extraPrice: 400 },
            { name: "Extra Pepper Sauce Dip", extraPrice: 500 },
            { name: "Moimoi (Steamed Bean Cake)", extraPrice: 1000 },
          ],
        },
      ],
    },
    {
      _id: "mi-103",
      branchId: "65b002222222222222222201",
      title: "Double Beef Cheese Burger Deluxe",
      description: "Two prime seasoned beef patties layered with cheddar cheese, caramelized onions, crisp lettuce, and special burger sauce in a brioche bun.",
      price: 4500,
      category: "Burgers & Grill",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      customizationGroups: [
        {
          groupName: "Choose Bun & Patty Style",
          required: true,
          options: [
            { name: "Toasted Brioche Bun", extraPrice: 0 },
            { name: "Sesame Seed Bun", extraPrice: 0 },
            { name: "Add Extra Cheddar Slice", extraPrice: 600 },
          ],
        },
        {
          groupName: "Sauces & Condiments",
          required: false,
          options: [
            { name: "Smoky BBQ Sauce", extraPrice: 250 },
            { name: "Creamy Garlic Mayo", extraPrice: 250 },
            { name: "Hot Jalapeño Relish", extraPrice: 400 },
          ],
        },
      ],
    },
    {
      _id: "mi-104",
      branchId: "65b002222222222222222201",
      title: "Special Fried Rice & Peppered Gizzard",
      description: "Stir-fried long grain rice with mixed vegetables, sweet corn, liver bits, and a skewer of spicy peppered gizzard.",
      price: 4900,
      category: "Rice & Specials",
      imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      customizationGroups: [
        {
          groupName: "Choose Extra Protein",
          required: false,
          options: [
            { name: "Fried Fish (Hake)", extraPrice: 1100 },
            { name: "Peppered Chicken Wing (2pcs)", extraPrice: 1400 },
          ],
        },
      ],
    },
    {
      _id: "mi-105",
      branchId: "65b002222222222222222201",
      title: "Freshly Squeezed Citrus Lemonade",
      description: "Chilled zesty lemonade crafted with fresh lime, lemon, mint leaves, and light raw cane syrup.",
      price: 1800,
      category: "Beverages & Drinks",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      customizationGroups: [
        {
          groupName: "Ice Preference",
          required: true,
          options: [
            { name: "Regular Crushed Ice", extraPrice: 0 },
            { name: "Less Ice", extraPrice: 0 },
            { name: "No Ice", extraPrice: 0 },
          ],
        },
      ],
    },
  ],
  "mama-cass-lekki": [
    {
      _id: "mi-201",
      branchId: "65b002222222222222222202",
      title: "Pounded Yam with Rich Egusi Soup & Assorted Meat",
      description: "Fluffy pounded yam served with thick melon seed soup, bitterleaf, spinach, shaki, kpomo, and goat meat chunk.",
      price: 5800,
      category: "Swallows & Soups",
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      customizationGroups: [
        {
          groupName: "Choose Your Swallow",
          required: true,
          options: [
            { name: "Pounded Yam", extraPrice: 0 },
            { name: "Yellow Eba (Garri)", extraPrice: 0 },
            { name: "Wheat Meal", extraPrice: 0 },
            { name: "Amala Dudu (Yam Flour)", extraPrice: 0 },
          ],
        },
        {
          groupName: "Choose Your Primary Meat/Fish",
          required: true,
          options: [
            { name: "Assorted Meat Trio", extraPrice: 0 },
            { name: "Slow-Braised Goat Meat", extraPrice: 1000 },
            { name: "Fresh Catfish (Point & Kill)", extraPrice: 2000 },
            { name: "Dried Stockfish / Panla", extraPrice: 1200 },
          ],
        },
      ],
    },
    {
      _id: "mi-202",
      branchId: "65b002222222222222222202",
      title: "Ofada Rice & Spicy Ayamase (Designer Stew)",
      description: "Authentic unpolished Ofada rice wrapped in banana leaf, served with fiery green bleached-palm-oil pepper sauce packed with boiled egg, diced offals, and locust beans.",
      price: 6200,
      category: "Rice & Specials",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      customizationGroups: [
        {
          groupName: "Heat Level",
          required: true,
          options: [
            { name: "Traditional Fire (Very Spicy)", extraPrice: 0 },
            { name: "Medium Pepper", extraPrice: 0 },
          ],
        },
      ],
    },
  ],
};

// Fallback generic items for other merchants
const DEFAULT_MENU_ITEMS: SerializedMenuItem[] = [
  {
    _id: "mi-default-1",
    branchId: "65b002222222222222222203",
    title: "Signature Chef Rice Bowl & Meat Skewer",
    description: "Savory seasoned rice served with char-grilled meat skewers, diced plantains, and signature pepper glaze.",
    price: 4200,
    category: "Main Dishes",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    inStock: true,
    customizationGroups: [
      {
        groupName: "Choose Your Protein",
        required: true,
        options: [
          { name: "Grilled Chicken Skewer", extraPrice: 0 },
          { name: "Spiced Suya Beef Strips", extraPrice: 800 },
          { name: "Grilled Jumbo Prawns", extraPrice: 1800 },
        ],
      },
      {
        groupName: "Choose Drink Option",
        required: false,
        options: [
          { name: "Cold Malt (33cl)", extraPrice: 700 },
          { name: "Soft Drink Can (33cl)", extraPrice: 600 },
        ],
      },
    ],
  },
  {
    _id: "mi-default-2",
    branchId: "65b002222222222222222203",
    title: "Crispy Beef Shawarma Roll (Jumbo)",
    description: "Flatbread stuffed with juicy shredded grilled beef, sausage, fresh cabbage, carrots, and sweet creamy tahini-mayo sauce.",
    price: 3500,
    category: "Quick Bites & Wraps",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    inStock: true,
    customizationGroups: [
      {
        groupName: "Sausage Add-on",
        required: true,
        options: [
          { name: "Single Sausage", extraPrice: 0 },
          { name: "Double Sausage", extraPrice: 500 },
          { name: "Triple Sausage & Extra Cheese", extraPrice: 1100 },
        ],
      },
      {
        groupName: "Spice Level",
        required: true,
        options: [
          { name: "Mild Creamy", extraPrice: 0 },
          { name: "Spicy Pepper Splash", extraPrice: 150 },
          { name: "Fire Hot Chili", extraPrice: 200 },
        ],
      },
    ],
  },
  {
    _id: "mi-default-3",
    branchId: "65b002222222222222222203",
    title: "Chilled Zobo Berry Cooler (50cl)",
    description: "Crafted hibiscus infusion with pineapple rind, ginger, cloves, and natural berry juice over ice.",
    price: 1500,
    category: "Beverages",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    inStock: true,
    customizationGroups: [
      {
        groupName: "Sweetness Level",
        required: true,
        options: [
          { name: "Standard Sweetness", extraPrice: 0 },
          { name: "Less Sweet", extraPrice: 0 },
          { name: "Unsweetened (Natural)", extraPrice: 0 },
        ],
      },
    ],
  },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    let merchant = MOCK_MERCHANTS.find((m) => m.slug === slug);

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

        return NextResponse.json({
          success: true,
          merchant: {
            id: String(dbMerchant._id),
            merchantId: String(dbMerchant._id),
            branchId: branch ? String(branch._id) : undefined,
            name: dbMerchant.name,
            slug: dbMerchant.slug,
            logoUrl: dbMerchant.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
            coverImageUrl: dbMerchant.coverImageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
            rating: 4.8,
            ratingCount: 180,
            deliveryTime: "25-35 min",
            deliveryFee: branch?.baseDeliveryFee || 700,
            categories: ["Fast Food", "Local"],
            city: branch?.city || "Lagos",
            area: branch?.area || "Ikeja",
            address: branch?.address || "Victoria Island, Lagos",
            phone: branch?.phone || "+2348012345678",
            isOpen: branch?.isOpen ?? true,
          },
          menuItems: serializedItems.length > 0 ? serializedItems : (MOCK_MENU_ITEMS[slug] || DEFAULT_MENU_ITEMS),
        });
      }
    } catch {
      // Fallback to mock
    }

    if (!merchant) {
      // Default to first mock merchant if slug is unknown
      merchant = MOCK_MERCHANTS[0];
    }

    const items = MOCK_MENU_ITEMS[merchant.slug] || DEFAULT_MENU_ITEMS;

    return NextResponse.json({
      success: true,
      merchant,
      menuItems: items,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
