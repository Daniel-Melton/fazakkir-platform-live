import { buildMetadata } from "@/lib/seo";
import PricingCalculator from "@/components/PricingCalculator";

export const metadata = buildMetadata("pricing");

export default function PricingPage() {
  return <PricingCalculator />;
}
