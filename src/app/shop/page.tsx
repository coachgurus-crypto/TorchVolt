import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopCatalog } from "./shop-catalog";

export const metadata: Metadata = {
  title: "Shop solar equipment",
  description: "Browse sample solar panels, inverters, batteries and accessories in the TorchVolt shop demo.",
  robots: { index: false, follow: true },
};

export default function ShopPage() {
  return <Suspense fallback={<div className="shop-wrap shop-catalog" role="status">Loading products…</div>}><ShopCatalog /></Suspense>;
}
