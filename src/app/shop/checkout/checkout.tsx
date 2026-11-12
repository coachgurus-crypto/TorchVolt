"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { BRAND, telUrl } from "@/lib/constants";
import { removePurchasedItems, useCart } from "../cart-store";
import { money } from "../catalog";
import { useCatalog } from "../catalog-provider";
import { ProductPhoto, useOpenCart } from "../shop-shell";

type PaymentMode = "test" | "live" | "unavailable";
type PaymentStatus = "paid" | "paid_review" | "pending" | "failed" | "abandoned" | "reversed";

export function Checkout() {
  const reference = useSearchParams().get("reference");
  return (
    <section className="shop-wrap shop-checkout">
      <Link className="shop-back" href="/shop"><ArrowLeft size={17} aria-hidden="true" />Back to shop</Link>
      <h1>Checkout</h1>
      {reference ? <PaymentResult key={reference} reference={reference} /> : <CheckoutForm />}
    </section>
  );
}

function PaymentResult({ reference }: { reference: string }) {
  const [payment, setPayment] = useState<{ status: PaymentStatus; mode: PaymentMode; amount: number }>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/checkout?" + new URLSearchParams({ reference }), { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw Error(data.error);
        if (controller.signal.aborted) return;
        setPayment(data);
        if (data.mode === "live" && (data.status === "paid" || data.status === "paid_review")) {
          removePurchasedItems(reference);
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error && error.message ? error.message : "Could not check payment status.");
      }
    })();
    return () => controller.abort();
  }, [reference, attempt]);

  const retry = () => {
    setPayment(undefined);
    setError("");
    setAttempt((value) => value + 1);
  };
  const status = payment?.status;
  const paid = payment && (status === "paid" || status === "paid_review") ? payment : undefined;
  const failed = status === "failed" || status === "abandoned" || status === "reversed";
  return (
    <div className="shop-checkout-card shop-payment-result" aria-live="polite">
      <h2>{paid ? paid.mode === "test" ? "Test payment confirmed" : "Payment confirmed" : failed ? "Payment did not complete" : error ? "Unable to confirm payment" : status === "pending" ? "Payment is pending" : "Checking payment…"}</h2>
      {paid && <p>{money(paid.amount / 100)} · {paid.mode === "test" ? "No money was charged." : status === "paid_review" ? "Your order needs an inventory review. Contact TorchVolt before coming to collect it." : "Contact TorchVolt with your reference to arrange pickup."}</p>}
      {failed && <p>You can return to checkout to try again.</p>}
      {status === "pending" && <p>Check the status again before starting a new payment.</p>}
      {error && <p role="alert">{error}</p>}
      <p className="shop-payment-reference">Reference {reference}</p>
      {(status === "pending" || error) && <button type="button" className="shop-btn shop-gold" onClick={retry}>Check payment status</button>}
      {failed && <Link className="shop-btn shop-gold" href="/shop/checkout">Return to checkout</Link>}
      {(paid || error) && <a href={telUrl()} className="shop-link">Call TorchVolt at {BRAND.phoneDisplay}</a>}
    </div>
  );
}

function CheckoutForm() {
  const { count, lines, subtotal } = useCart();
  const { mode } = useCatalog();
  const openCart = useOpenCart();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/checkout", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => { if (!controller.signal.aborted) setPaymentMode(data.mode ?? "unavailable"); })
      .catch(() => { if (!controller.signal.aborted) setPaymentMode("unavailable"); });
    return () => controller.abort();
  }, []);

  const canPay = mode === "live" && (paymentMode === "test" || paymentMode === "live");

  async function startPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPay || busy || !lines.length) return;
    setBusy(true);
    setError("");
    try {
      const items = lines.map(({ product, quantity }) => ({ id: product.id, price: product.price, quantity }));
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, items }),
      });
      const data = await response.json();
      if (!response.ok || !data.authorizationUrl) throw Error(data.error || "Could not start payment.");
      try { sessionStorage.setItem("torchvolt.payment." + data.reference, JSON.stringify(items)); } catch { /* Payment can continue without cart cleanup. */ }
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not start payment.");
      setBusy(false);
    }
  }

  if (mode === "loading") return <p role="status">Loading your cart…</p>;
  if (mode === "error") return <div className="shop-empty"><h2>Cart is unavailable</h2><p>Refresh the page to try again.</p></div>;
  if (count === 0) return (
    <div className="shop-empty"><ShoppingBag size={25} aria-hidden="true" /><h2>Your cart is empty</h2><p>Add equipment before continuing to checkout.</p><Link className="shop-btn shop-gold" href="/shop">Browse products<ArrowRight size={17} aria-hidden="true" /></Link></div>
  );

  return (
    <>
      {mode === "demo" && <p className="shop-demo-note">Sample catalog. Online payment is unavailable.</p>}
      {mode !== "demo" && paymentMode === "test" && <p className="shop-demo-note">Paystack test mode. No money will be charged.</p>}
      <div className="shop-checkout-grid">
        <form id="paystack-checkout" className="shop-checkout-card" onSubmit={startPayment}>
          <h2>Pickup</h2>
          <p>{BRAND.address}, Ibadan</p>
          {canPay ? (
            <label className="shop-checkout-email">
              Email address
              <input type="email" autoComplete="email" maxLength={254} value={email} disabled={busy} required onChange={(event) => setEmail(event.target.value)} />
            </label>
          ) : <p role="status">{paymentMode === undefined && mode !== "demo" ? "Checking payment availability…" : "Online payment is currently unavailable."}</p>}
          {error && <p className="shop-payment-error" role="alert">{error}</p>}
        </form>
        <aside className="shop-checkout-card" aria-label="Order summary">
          <div className="shop-summary-heading"><h2>Order summary</h2><button type="button" className="shop-link" disabled={busy} onClick={() => openCart()}>Edit cart</button></div>
          <ul className="shop-checkout-lines">
            {lines.map(({ product, quantity }) => <li key={product.id}><ProductPhoto product={product} /><div><strong>{product.name}</strong><span>Qty {quantity}</span></div><strong>{money(product.price * quantity)}</strong></li>)}
          </ul>
          <p className="shop-total"><strong>Total</strong><strong>{money(subtotal)}</strong></p>
          <button className="shop-btn shop-gold" type="submit" form="paystack-checkout" disabled={!canPay || busy}>{busy ? "Opening Paystack…" : "Pay with Paystack"}<ArrowRight size={18} aria-hidden="true" /></button>
        </aside>
      </div>
    </>
  );
}
