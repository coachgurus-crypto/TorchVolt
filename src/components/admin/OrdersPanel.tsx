"use client";

import { useEffect, useState } from "react";
import { money } from "@/app/shop/catalog";

type Order = {
  reference: string;
  email: string;
  amount: number;
  mode: "test" | "live";
  status: "paid" | "paid_review";
  paid_at: string;
  items: { id: string; name: string; sku: string; quantity: number; price: number }[];
};

export function OrdersPanel({ pin, onAuthError }: { pin: string; onAuthError: () => void }) {
  const [orders, setOrders] = useState<Order[]>();
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/checkout?admin=1", { headers: { "X-Admin-Pin": pin }, signal: controller.signal });
        if (response.status === 401) return onAuthError();
        if (!response.ok) throw Error("Could not load orders.");
        const data = await response.json();
        if (!controller.signal.aborted) setOrders(data.orders);
      } catch {
        if (!controller.signal.aborted) setError("Could not load orders. Try refreshing.");
      }
    })();
    return () => controller.abort();
  }, [pin, onAuthError, refresh]);

  return (
    <div className="mx-auto max-w-[1280px] space-y-4 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Orders</h1><p className="mt-1 text-sm text-slate-600">Latest 100 confirmed Paystack payments for pickup.</p></div>
        <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" onClick={() => { setError(""); setOrders(undefined); setRefresh((value) => value + 1); }}>Refresh</button>
      </div>
      {error ? <p role="alert" className="text-red-700">{error}</p> : !orders ? <p role="status">Loading orders…</p> : !orders.length ? <p>No confirmed payments yet.</p> : orders.map((order) => (
        <article key={order.reference} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">{money(order.amount / 100)}</h2>
            <p className={order.status === "paid_review" ? "font-semibold text-red-700" : "font-semibold text-green-800"}>
              {order.mode === "test" ? "Test payment" : order.status === "paid_review" ? "Paid · stock review required" : "Paid"}
            </p>
          </div>
          <p className="mt-1 break-all text-slate-600">{order.reference} · {order.paid_at} UTC</p>
          <a className="break-all underline" href={`mailto:${encodeURIComponent(order.email)}`}>{order.email}</a>
          <ul className="mt-3 space-y-1 border-t border-slate-200 pt-2">
            {order.items.map((item) => <li key={item.id}>{item.quantity} × {item.name} ({item.sku}) · {money(item.price * item.quantity)}</li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}
