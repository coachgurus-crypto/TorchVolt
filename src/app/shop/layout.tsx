import type { ReactNode } from "react";
import { ShopShell } from "./shop-shell";
import { CatalogProvider } from "./catalog-provider";
import "./shop.css";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <CatalogProvider><ShopShell>{children}</ShopShell></CatalogProvider>;
}
