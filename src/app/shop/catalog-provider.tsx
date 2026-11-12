"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { products as demoProducts, type Product } from "./catalog";

type Catalog = { products: Product[]; mode: "loading" | "live" | "demo" | "error" };
const initial: Catalog = { products: [], mode: "loading" };
const Context = createContext<Catalog>(initial);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(initial);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/products", { signal: controller.signal, cache: "no-store" });
        if (response.status === 404 && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
          setCatalog({ products: demoProducts, mode: "demo" });
          return;
        }
        if (!response.ok) throw Error("Could not load products.");
        const data: { products: Product[] } = await response.json();
        if (!Array.isArray(data.products)) throw Error("Invalid catalog.");
        setCatalog({ products: data.products, mode: "live" });
      } catch {
        if (!controller.signal.aborted) setCatalog({ products: [], mode: "error" });
      }
    }
    void load();
    window.addEventListener("focus", load);
    return () => { controller.abort(); window.removeEventListener("focus", load); };
  }, []);
  return <Context.Provider value={catalog}>{children}</Context.Provider>;
}

export const useCatalog = () => useContext(Context);
