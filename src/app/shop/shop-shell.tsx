"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Minus, Package, Plus, ShoppingBag, X, Zap } from "lucide-react";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { changeQuantity, useCart } from "./cart-store";
import { maxQuantity, money, type Product } from "./catalog";

import { useCatalog } from "./catalog-provider";
import { BRAND } from "@/lib/constants";

const OpenCart = createContext<(product?: Product, quantity?: number) => void>(() => {});
export const useOpenCart = () => useContext(OpenCart);

export function ProductPhoto({ product, className }: { product: Product; className?: string }) {
  if (!product.image) return <div className={`shop-photo-empty ${className ?? ""}`}><Package aria-hidden="true" /><span className="sr-only">No product photo</span></div>;
  return <Image unoptimized className={className} src={product.image} width={768} height={768} alt={product.name} />;
}

export function ShopShell({ children }: { children: ReactNode }) {
  const { count, lines, subtotal } = useCart();
  const { mode } = useCatalog();
  const [notice, setNotice] = useState("");
  const drawer = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const open = (product?: Product, quantity = 1) => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (!dialog.open) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (product) {
      changeQuantity(product, quantity);
      setNotice(`${quantity > 1 ? `${quantity} × ` : ""}${product.name} added to your cart`);
    } else setNotice("");
    if (!dialog.open) dialog.showModal();
  };
  const close = () => drawer.current?.close();

  return (
    <OpenCart.Provider value={open}>
      <div className="shop">
        <a className="shop-skip" href="#shop-content">Skip to content</a>
        <header className="shop-header">
          <div className="shop-wrap shop-nav">
            <Link className="shop-logo" href="/"><Zap size={27} fill="currentColor" aria-hidden="true" />TorchVolt</Link>
            <nav aria-label="Shop navigation">
              <Link href="/">Home</Link><Link href="/services">Services</Link><Link href="/shop" className="shop-current">Shop</Link>
            </nav>
            <button className="shop-btn shop-ghost shop-cart-trigger" type="button" onClick={() => open()} aria-haspopup="dialog"><ShoppingBag size={19} aria-hidden="true" />Cart ({count})</button>
            <Link className="shop-btn shop-gold shop-header-checkout" href="/shop/checkout">Checkout<ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </header>
        <div id="shop-content">{children}</div>
        <footer className="shop-footer">
          <div className="shop-wrap">
            <Link href="/shop">TorchVolt Shop</Link>
            <span>{mode === "demo" ? "Demo catalog · sample prices" : "Demo checkout · no orders or payments"}</span>
            <Link href="/size">Solar calculator</Link>
            <address className="w-full not-italic">{BRAND.address}</address>
          </div>
        </footer>
        <dialog ref={drawer} className="shop-drawer" aria-labelledby="shop-cart-title" onClose={() => opener.current?.focus()} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div className="shop-drawer-inner">
            <header className="shop-drawer-heading">
              <h2 id="shop-cart-title">Your cart ({count})</h2>
              <button type="button" className="shop-icon" aria-label="Close cart" onClick={close} autoFocus><X size={22} /></button>
            </header>
            <div className="shop-drawer-items">
              {notice && count > 0 && <p className="shop-notice" role="status"><Check size={19} aria-hidden="true" />{notice}</p>}
              {count === 0 && <p className="shop-empty">Your cart is empty. Add a product to get started.</p>}
              {lines.map(({ product, quantity }) => (
                <article className="shop-cart-line" key={product.id}>
                  <ProductPhoto product={product} />
                  <div><h3>{product.name}</h3><p>{product.spec}</p>
                    <div className="shop-line-actions">
                      <div className="shop-stepper">
                        <button type="button" aria-label={`Decrease quantity of ${product.name}`} disabled={quantity === 1} onClick={() => changeQuantity(product, -1)}><Minus size={16} /></button>
                        <span aria-label="Quantity">{quantity}</span>
                        <button type="button" aria-label={`Increase quantity of ${product.name}`} disabled={quantity >= Math.min(maxQuantity, product.stock)} onClick={() => changeQuantity(product, 1)}><Plus size={16} /></button>
                      </div>
                      <button className="shop-link" type="button" onClick={() => { changeQuantity(product, -maxQuantity); setNotice(""); }}>Remove<span className="sr-only"> {product.name}</span></button>
                    </div>
                  </div>
                  <strong>{money(product.price * quantity)}</strong>
                </article>
              ))}
            </div>
            <div className="shop-drawer-summary">
              <p className="shop-total"><strong>Subtotal</strong><strong>{money(subtotal)}</strong></p>
              <p className="shop-muted">{mode === "demo" ? "Sample prices · demo cart" : "Demo cart · stock is not reserved"}</p>
              {count > 0 && <Link className="shop-btn shop-gold" href="/shop/checkout" onClick={close}>Continue to checkout<ArrowRight size={19} aria-hidden="true" /></Link>}
              <button type="button" className="shop-link" onClick={close}>Keep shopping</button>
            </div>
          </div>
        </dialog>
      </div>
    </OpenCart.Provider>
  );
}
