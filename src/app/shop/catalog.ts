import type { ShopProduct } from "@/lib/products";

export const products: ShopProduct[] = [
  { id: "panel", name: "550 W Solar Panel", category: "Solar panels", spec: "Power output: 550 W", price: 285000, stock: 99, image: "/images/shop-panel.webp" },
  { id: "inverter", name: "3.5 kVA Hybrid Inverter", category: "Inverters", spec: "Rated power: 3.5 kVA", price: 780000, stock: 99, image: "/images/shop-inverter.webp" },
  { id: "battery", name: "5 kWh Lithium Battery", category: "Batteries", spec: "Capacity: 5 kWh", price: 1250000, stock: 99, image: "/images/shop-battery.webp" },
  { id: "mounting", name: "Mounting Kit", category: "Accessories", spec: "For rooftop solar installation", price: 95000, stock: 99, image: "/images/shop-mounting.webp" },
];

export type Product = ShopProduct;
export type Cart = Partial<Record<Product["id"], number>>;
export const maxQuantity = 99;
export const money = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
