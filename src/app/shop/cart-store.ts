"use client";

import { useMemo, useSyncExternalStore } from "react";
import { maxQuantity, type Cart, type Product } from "./catalog";
import { useCatalog } from "./catalog-provider";

const key = "torchvolt.shop.demo.v1";
const change = "torchvolt:shop-cart";
let fallback = "{}";

function snapshot() {
  try { return localStorage.getItem(key) ?? "{}"; }
  catch { return fallback; }
}

function subscribe(notify: () => void) {
  window.addEventListener(change, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(change, notify);
    window.removeEventListener("storage", notify);
  };
}

function decode(raw: string): Cart {
  try {
    const stored = JSON.parse(raw);
    const clean: Cart = Object.create(null);
    for (const [id, quantity] of Object.entries(stored ?? {}) as [string, number][]) {
      if (Number.isInteger(quantity) && quantity > 0) clean[id] = Math.min(quantity, maxQuantity);
    }
    return clean;
  } catch { return {}; }
}

function writeCart(cart: Cart) {
  fallback = JSON.stringify(cart);
  try { localStorage.setItem(key, fallback); } catch { /* Use in-memory storage when blocked. */ }
  window.dispatchEvent(new Event(change));
}

export function removePurchasedItems(reference: string) {
  const storageKey = "torchvolt.payment." + reference;
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return;
    const items: { id: string; quantity: number }[] = JSON.parse(stored);
    const cart = decode(snapshot());
    for (const { id, quantity } of items) {
      const remaining = (cart[id] ?? 0) - quantity;
      if (remaining > 0) cart[id] = remaining;
      else delete cart[id];
    }
    sessionStorage.removeItem(storageKey);
    writeCart(cart);
  } catch { /* The payment record is independent of cart storage. */ }
}

export function changeQuantity(product: Product, delta: number) {
  const { id } = product;
  const cart = decode(snapshot());
  const limit = Math.min(maxQuantity, product.stock);
  const quantity = Math.min(limit, cart[id] ?? 0) + delta;
  const next = Math.min(limit, quantity);
  if (next <= 0) delete cart[id];
  else cart[id] = next;
  writeCart(cart);
  return next;
}

export function useCart() {
  const { products } = useCatalog();
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  return useMemo(() => {
    const stored = decode(raw);
    const cart: Cart = Object.create(null);
    const lines = products.flatMap((product) => {
      const quantity = Math.min(stored[product.id] ?? 0, product.stock);
      if (quantity) cart[product.id] = quantity;
      return quantity ? [{ product, quantity }] : [];
    });
    return {
      cart, lines,
      count: lines.reduce((sum, { quantity }) => sum + quantity, 0),
      subtotal: lines.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0),
    };
  }, [raw, products]);
}
