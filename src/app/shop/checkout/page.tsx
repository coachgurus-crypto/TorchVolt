import type { Metadata } from "next";
import { Suspense } from "react";
import { Checkout } from "./checkout";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: true } };

export default function CheckoutPage() {
  return <Suspense fallback={<p className="shop-wrap shop-checkout" role="status">Loading checkout…</p>}><Checkout /></Suspense>;
}
