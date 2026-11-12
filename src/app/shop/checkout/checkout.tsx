"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "../cart-store";
import { money } from "../catalog";
import { ProductPhoto, useOpenCart } from "../shop-shell";

import { useCatalog } from "../catalog-provider";

export function Checkout() {
  const { count, lines, subtotal } = useCart();
  const { mode } = useCatalog();
  const openCart = useOpenCart();
  const [method, setMethod] = useState("pickup");
  const [complete, setComplete] = useState(false);

  return (
    <section className="shop-wrap shop-checkout">
      <Link className="shop-back" href="/shop"><ArrowLeft size={17} aria-hidden="true" />Back to shop</Link>
      <h1>Checkout</h1>
      <p className="shop-demo-note">Demo checkout. No order is placed, and no payment or personal details are collected.</p>
      {mode === "loading" ? <p role="status">Loading your cart…</p> : mode === "error" ? <div className="shop-empty"><h2>Cart is unavailable</h2><p>Refresh the page to try again.</p></div> : count === 0 ? (
        <div className="shop-empty"><ShoppingBag size={25} aria-hidden="true" /><h2>Your cart is empty</h2><p>Add equipment before continuing to checkout.</p><Link className="shop-btn shop-gold" href="/shop">Browse products<ArrowRight size={17} aria-hidden="true" /></Link></div>
      ) : (
        <div className="shop-checkout-grid">
          {complete ? (
            <div className="shop-checkout-card" role="status">
              <p className="shop-notice"><Check size={19} aria-hidden="true" />Demo checkout complete</p>
              <h2>Your review is complete</h2>
              <p>No order was placed, no payment was taken, and your demo cart is still available.</p>
              <Link href="/shop" className="shop-btn shop-gold">Keep shopping<ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          ) : (
            <form id="demo-checkout" className="shop-checkout-card" onSubmit={(event) => { event.preventDefault(); setComplete(true); }}>
              <fieldset>
                <legend>Delivery preference</legend>
                <p>Choose a preference to try the checkout flow. Nothing will be booked.</p>
                <label className="shop-choice"><input name="delivery" type="radio" checked={method === "pickup"} onChange={() => setMethod("pickup")} /><span><strong>Pickup</strong><small>Review a sample pickup order.</small></span></label>
                <label className="shop-choice"><input name="delivery" type="radio" checked={method === "delivery"} onChange={() => setMethod("delivery")} /><span><strong>Delivery</strong><small>Review a sample delivery order. Fees are not calculated in this demo.</small></span></label>
              </fieldset>
            </form>
          )}
          <aside className="shop-checkout-card" aria-label="Order summary">
            <div className="shop-summary-heading"><h2>Order summary</h2><button type="button" className="shop-link" onClick={() => { setComplete(false); openCart(); }}>Edit cart</button></div>
            <ul className="shop-checkout-lines">
              {lines.map(({ product, quantity }) => <li key={product.id}><ProductPhoto product={product} /><div><strong>{product.name}</strong><span>Qty {quantity}</span></div><strong>{money(product.price * quantity)}</strong></li>)}
            </ul>
            <p className="shop-total"><strong>Subtotal</strong><strong>{money(subtotal)}</strong></p>
            <p className="shop-muted">{mode === "demo" ? "Sample prices · excludes delivery" : "Excludes delivery · stock is not reserved"}</p>
            {!complete && <button className="shop-btn shop-gold" type="submit" form="demo-checkout">Complete demo checkout<ArrowRight size={18} aria-hidden="true" /></button>}
          </aside>
        </div>
      )}
    </section>
  );
}
