import { json } from "./cms.js";

export const validReference = (reference) => typeof reference === "string" && /^tv-[a-f0-9]{32}$/.test(reference);
export const paymentMode = (key) => /^sk_(test|live)_[a-zA-Z0-9]+$/.exec(key ?? "")?.[1];

export function checkoutResponse(data, status) {
  const response = json(data, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function paystack(key, path, body) {
  const response = await fetch(`https://api.paystack.co/transaction/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || result.status !== true || !result.data) throw Error("Paystack request failed.");
  return result.data;
}

export function findOrder(db, reference) {
  return db.prepare("SELECT reference, amount, mode, status, CASE WHEN delivery_details IS NULL THEN 'pickup' ELSE 'delivery' END AS fulfillment FROM shop_orders WHERE reference = ?").bind(reference).first();
}

export async function recordPayment(db, order, payment) {
  if (payment.status !== "success" || payment.reference !== order.reference ||
      payment.amount !== order.amount || payment.currency !== "NGN" || payment.domain !== order.mode) return false;

  // A concurrent payment or inventory edit can leave a paid order short of stock.
  // Record it for manual review without partially deducting stock.
  await db.prepare(`
    UPDATE shop_orders
    SET paid_at = CURRENT_TIMESTAMP, status = CASE WHEN mode = 'live' AND EXISTS (
      SELECT 1 FROM json_each(shop_orders.items) AS item
      LEFT JOIN shop_products AS product ON product.id = json_extract(item.value, '$.id')
      WHERE product.id IS NULL OR product.stock < json_extract(item.value, '$.quantity')
    ) THEN 'paid_review' ELSE 'paid' END
    WHERE reference = ? AND status = 'pending'
  `).bind(order.reference).run();
  return true;
}
