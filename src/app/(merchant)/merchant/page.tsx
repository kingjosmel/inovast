import { redirect } from "next/navigation";

export default function MerchantIndexRedirect() {
  redirect("/merchant/dashboard");
}
