import MerchantPage, {
  generateMetadata as generateMerchantMetadata,
} from "@/app/(customer)/merchant/[slug]/page";

interface MerchantPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MerchantPageProps) {
  return generateMerchantMetadata({ params });
}

export default async function RestaurantPage({
  params,
}: MerchantPageProps) {
  return MerchantPage({ params });
}