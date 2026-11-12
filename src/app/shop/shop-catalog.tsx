"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-store";
import { maxQuantity, money, productHref } from "./catalog";
import { ProductPhoto, useOpenCart } from "./shop-shell";

import { useCatalog } from "./catalog-provider";
import { productCategories } from "@/lib/products";

const categories = ["All products", ...productCategories] as const;
type Category = (typeof categories)[number];

export function ShopCatalog() {
  const categoryParam = useSearchParams().get("category");
  const initialCategory = categories.find((name) => name === categoryParam) ?? "All products";
  return <CatalogView key={initialCategory} initialCategory={initialCategory} />;
}

function CatalogView({ initialCategory }: { initialCategory: Category }) {
  const { cart } = useCart();
  const { products, mode } = useCatalog();
  const openCart = useOpenCart();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [sort, setSort] = useState("featured");
  const search = query.trim().toLowerCase();
  const filtered = products.filter((product) =>
    (category === "All products" || product.category === category) &&
    `${product.name} ${product.category} ${product.spec}`.toLowerCase().includes(search),
  );
  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <section className="shop-intro">
        <div className="shop-wrap shop-intro-inner">
          <div><span className="shop-rule" /><h1>Shop solar equipment</h1><p>{mode === "demo" ? "Demo catalog · sample prices" : "Solar panels, inverters, batteries and accessories"}</p></div>
          <label className="shop-search"><Search size={20} aria-hidden="true" /><span className="sr-only">Search solar equipment</span><input type="search" placeholder="Search solar equipment…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <Link className="shop-help" href="/size">Need help sizing?</Link>
        </div>
      </section>
      <section className="shop-wrap shop-catalog" aria-label="Product catalog">
        <div className="shop-categories" aria-label="Filter by category" role="group">
          {categories.map((name) => <button type="button" key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}
        </div>
        <div className="shop-results">
          <p role="status">{filtered.length} {filtered.length === 1 ? "product" : "products"}</p>
          <label>Sort by: <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A to Z</option></select></label>
        </div>
        {mode === "loading" ? <p role="status">Loading products…</p> : mode === "error" ? <div className="shop-empty"><h2>Products are unavailable</h2><p>Refresh the page to try again.</p></div> : mode === "live" && !products.length ? <div className="shop-empty"><h2>No products listed yet</h2><p>Check back when new equipment is available.</p></div> : filtered.length ? <div className="shop-grid">
          {filtered.map((product) => {
            const quantity = cart[product.id] ?? 0;
            const limit = Math.min(maxQuantity, product.stock);
            return (
              <article className="shop-card" key={product.id}>
                <Link className="shop-card-photo-link" href={productHref(product)} aria-label={`View ${product.name}`}><ProductPhoto product={product} /></Link>
                <div className="shop-card-body">
                  <h2><Link href={productHref(product)}>{product.name}</Link></h2><p>{product.spec}</p><strong>{money(product.price)}</strong>
                  <button className={`shop-btn ${quantity ? "shop-added" : "shop-ghost"}`} type="button" disabled={quantity >= limit} onClick={() => openCart(product)} aria-label={product.stock ? `Add ${product.name} to cart` : `${product.name} is out of stock`}>
                    {quantity ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
                    {!product.stock ? "Out of stock" : quantity >= limit ? "Cart limit reached" : quantity ? `Added (${quantity}) · Add one more` : "Add to cart"}
                  </button>
                </div>
              </article>
            );
          })}
        </div> : (
          <div className="shop-empty"><h2>No products match</h2><p>Try a different search or category.</p><button type="button" className="shop-link" onClick={() => { setQuery(""); setCategory("All products"); }}>Clear filters</button></div>
        )}
      </section>
    </>
  );
}
