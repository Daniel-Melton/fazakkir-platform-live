import { buildMetadata } from "@/lib/seo";
import HomeClient from "@/components/HomeClient";

export const metadata = buildMetadata("home");

export default function Home() {
  return <HomeClient />;
}
