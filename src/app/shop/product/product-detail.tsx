"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "../cart-store";
import { useCatalog } from "../catalog-provider";
import { maxQuantity, money, productHref, type Product } from "../catalog";
import { ProductPhoto, useOpenCart } from "../shop-shell";

export function ProductDetail() {
  const id = useSearchParams().get("id");
  const { products, mode } = useCatalog();
  if (mode === "loading") return <p className="shop-wrap shop-catalog" role="status">Loading product…</p>;
  const product = products.find((item) => item.id === id);
  if (!product) return (
    <div className="shop-wrap shop-catalog">
      <div className="shop-empty">
        <h1>{mode === "error" ? "Could not load this product" : "Product unavailable"}</h1>
        <p>{mode === "error" ? "Refresh the page to try again." : "This product is no longer listed or the link is incorrect."}</p>
        <Link className="shop-btn shop-gold" href="/shop">Back to shop</Link>
      </div>
    </div>
  );
  return <ProductView key={product.id} product={product} related={products.filter((item) => item.id !== product.id).slice(0, 3)} demo={mode === "demo"} />;
}

function ProductView({ product, related, demo }: { product: Product; related: Product[]; demo: boolean }) {
  const [requested, setRequested] = useState(1);
  const { cart } = useCart();
  const openCart = useOpenCart();
  const limit = Math.max(0, Math.min(maxQuantity, product.stock) - (cart[product.id] ?? 0));
  const quantity = Math.min(requested, Math.max(1, limit));
  const colon = product.spec.indexOf(":");
  const specLabel = colon > 0 ? product.spec.slice(0, colon).trim() : "Specification";
  const specValue = colon > 0 ? product.spec.slice(colon + 1).trim() : product.spec;

  return (
    <>
      <div className="shop-product-crumb">
        <nav className="shop-wrap" aria-label="Breadcrumb">
          <Link className="shop-link" href="/shop">Shop</Link><span aria-hidden="true">/</span>
          <Link className="shop-link" href={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>
      </div>
      <div className="shop-wrap shop-product">
        <section className="shop-product-hero" aria-labelledby="product-title">
          <ProductPhoto className="shop-product-photo" product={product} />
          <div className="shop-product-purchase">
            <span className="shop-rule" />
            <p className="shop-product-category">{product.category}</p>
            <h1 id="product-title">{product.name}</h1>
            <div className="shop-product-price">
              <strong>{money(product.price)}</strong>
              <span className={`shop-stock ${product.stock ? "" : "shop-stock-empty"}`}>{demo ? "Sample listing" : product.stock ? `${product.stock} in stock` : "Out of stock"}</span>
            </div>
            {product.spec && <p className="shop-muted">{product.spec}</p>}
            <div className="shop-product-actions">
              <div className="shop-stepper" role="group" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setRequested(quantity - 1)}><Minus size={18} aria-hidden="true" /></button>
                <span aria-live="polite">{limit ? quantity : 0}</span>
                <button type="button" aria-label="Increase quantity" disabled={quantity >= limit} onClick={() => setRequested(quantity + 1)}><Plus size={18} aria-hidden="true" /></button>
              </div>
              <button className="shop-btn shop-gold" type="button" disabled={!limit} onClick={() => { openCart(product, quantity); setRequested(1); }}>
                <ShoppingBag size={18} aria-hidden="true" />{!product.stock ? "Out of stock" : !limit ? "Cart limit reached" : "Add to cart"}
              </button>
            </div>
            <p className="shop-muted">Demo checkout · no orders or payments{demo ? " · sample prices" : ""}</p>
          </div>
        </section>
        <section className="shop-product-details" aria-labelledby="product-details">
          <div>
            <span className="shop-rule" />
            <h2 id="product-details">Product details</h2>
            <dl>
              {specValue && <><dt>{specLabel}</dt><dd>{specValue}</dd></>}
              <dt>Category</dt><dd>{product.category}</dd>
            </dl>
          </div>
          <aside className="shop-product-help">
            <h3>Not sure what fits?</h3>
            <p>Start with what you want to power.</p>
            <Link className="shop-link" href="/size">Use the solar calculator <ArrowRight size={16} aria-hidden="true" /></Link>
          </aside>
        </section>
        {related.length > 0 && <section className="shop-product-related" aria-labelledby="product-related">
          <div className="shop-product-related-heading">
            <div><span className="shop-rule" /><h2 id="product-related">More solar equipment</h2></div>
            <Link className="shop-link" href="/shop">View all products</Link>
          </div>
          <div className="shop-grid">
            {related.map((item) => <article className="shop-card" key={item.id}>
              <Link className="shop-card-photo-link" href={productHref(item)} aria-label={`View ${item.name}`}><ProductPhoto product={item} /></Link>
              <div className="shop-card-body">
                <h3>{item.name}</h3><p>{item.spec}</p><strong>{money(item.price)}</strong>
                <Link className="shop-btn shop-ghost" href={productHref(item)} aria-label={`View product: ${item.name}`}>View product <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            </article>)}
          </div>
        </section>}
      </div>
    </>
  );
}
