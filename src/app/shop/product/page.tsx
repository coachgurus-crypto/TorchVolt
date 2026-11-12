import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductDetail } from "./product-detail";

export const metadata: Metadata = { title: "Solar equipment details", robots: { index: false, follow: true } };

export default function ProductPage() {
  return <Suspense fallback={<p className="shop-wrap shop-catalog" role="status">Loading product…</p>}><ProductDetail /></Suspense>;
}
