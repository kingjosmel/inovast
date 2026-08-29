import { MOCK_MERCHANTS, MerchantFeedItem } from "@/app/api/merchants/route";
import { CustomerFeed } from "@/components/customer/CustomerFeed";
import { connectToDatabase } from "@/lib/db";
import Merchant from "@/models/Merchant";
import Branch from "@/models/Branch";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FoodGo - Discover & Order Food Nearby",
  description: "Order from top restaurants, fast food, and local bukas with rapid delivery.",
};

async function getMerchants(): Promise<MerchantFeedItem[]> {
  try {
    await connectToDatabase();
    const dbMerchants = await Merchant.find({ isActive: true }).lean();
    if (dbMerchants && dbMerchants.length > 0) {
      const branches = await Branch.find({}).lean();
      const branchMap = new Map(branches.map((b) => [String(b.merchantId), b]));

      const items: MerchantFeedItem[] = dbMerchants.map((m) => {
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
          ratingCount: 160,
          deliveryTime: "25-35 min",
          deliveryFee: branch?.baseDeliveryFee || 700,
          categories: ["Fast Food", "Local", "Chicken"],
          city: branch?.city || "Lagos",
          area: branch?.area || "Ikeja",
          isOpen: branch?.isOpen ?? true,
        };
      });

      return [...items, ...MOCK_MERCHANTS.filter(m => !items.some(d => d.slug === m.slug))];
    }
  } catch {
    // Database fallback
  }

  return MOCK_MERCHANTS;
}

export default async function CustomerHomePage() {
  const merchants = await getMerchants();

  return (
    <div className="space-y-8">
      {/* Hero Promotion Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fastest Food Delivery</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            Craving something delicious? We deliver in minutes.
          </h1>

          <p className="text-xs font-medium text-orange-100 sm:text-sm">
            Discover the best rated restaurants, party jollof, shawarma, and fresh groceries delivered directly to your doorstep.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-white/90">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Under 30 Min Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              <span>Live Order Tracking</span>
            </div>
          </div>
        </div>

        {/* Decorative ambient gradients */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-orange-400/40 blur-3xl" />
      </div>

      {/* Discovery Feed with Category Filtering & Grid */}
      <CustomerFeed initialMerchants={merchants} />
    </div>
  );
}
