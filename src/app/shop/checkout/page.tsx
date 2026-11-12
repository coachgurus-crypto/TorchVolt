import type { Metadata } from "next";
import { Checkout } from "./checkout";

export const metadata: Metadata = { title: "Demo checkout", robots: { index: false, follow: true } };

export default function CheckoutPage() { return <Checkout />; }
