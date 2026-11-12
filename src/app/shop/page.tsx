import type { Metadata } from "next";
import { ShopCatalog } from "./shop-catalog";

export const metadata: Metadata = {
  title: "Shop solar equipment",
  description: "Browse sample solar panels, inverters, batteries and accessories in the TorchVolt shop demo.",
  robots: { index: false, follow: true },
};

export default function ShopPage() { return <ShopCatalog />; }
