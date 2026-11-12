import { requireAdmin } from "../_lib/cms.js";
import { checkoutResponse as respond, findOrder, paymentMode, paystack, recordPayment, validReference } from "../_lib/paystack.js";

const ibadanDeliveryFee = 4000;

function deliveryDetails(input) {
  const clean = (value) => typeof value === "string" ? value.trim() : "";
  const name = clean(input?.name);
  const phone = clean(input?.phone).replace(/[\s()-]/g, "");
  const address = clean(input?.address);
  const area = clean(input?.area);
  if (!name || name.length > 120 || !/^(?:\+234|0)\d{10}$/.test(phone) ||
      !address || address.length > 250 || !area || area.length > 100) return null;
  return { name, phone, address, area, city: "Ibadan", state: "Oyo" };
}

export async function onRequestPost({ request, env }) {
  const mode = paymentMode(env.PAYSTACK_SECRET_KEY);
  if (!mode) return respond({ error: "Online payments are currently unavailable." }, 503);
  const url = new URL(request.url);
  if (request.headers.get("Origin") !== url.origin) return respond({ error: "Invalid checkout origin." }, 403);
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond({ error: "Enter a valid email address." }, 400);
  }
  const { items } = body;
  if (!Array.isArray(items) || items.length < 1 || items.length > 50 || items.some((item) =>
    typeof item?.id !== "string" || !item.id || item.id.length > 40 ||
    !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 ||
    !Number.isSafeInteger(item.price) || item.price < 1
  ) || new Set(items.map(({ id }) => id)).size !== items.length) {
    return respond({ error: "Review your cart before paying." }, 400);
  }
  let delivery = null;
  let deliveryFee = 0;
  if (body.fulfillment === "delivery") {
    if (ibadanDeliveryFee !== body.deliveryFee) {
      return respond({ error: "The delivery fee changed. Refresh checkout before paying." }, 409);
    }
    delivery = deliveryDetails(body.delivery);
    if (!delivery) return respond({ error: "Enter a recipient, Nigerian phone number and an Ibadan delivery address." }, 400);
    deliveryFee = ibadanDeliveryFee * 100;
  } else if (body.fulfillment !== undefined && body.fulfillment !== "pickup") {
    return respond({ error: "Choose pickup or home delivery." }, 400);
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT id, sku, name, price, stock FROM shop_products WHERE published = 1 AND id IN (SELECT value FROM json_each(?))",
    ).bind(JSON.stringify(items.map(({ id }) => id))).all();
    const catalog = new Map(results.map((product) => [product.id, product]));
    const lines = [];
    for (const { id, quantity, price } of items) {
      const product = catalog.get(id);
      if (!product || quantity > product.stock || price !== product.price) {
        return respond({ error: "Price or stock changed. Refresh the page and review your cart before paying." }, 409);
      }
      lines.push({ id, sku: product.sku, name: product.name, quantity, price: product.price });
    }
    const amount = lines.reduce((total, item) => total + item.price * item.quantity * 100, deliveryFee);
    const reference = `tv-${crypto.randomUUID().replaceAll("-", "")}`;
    await env.DB.prepare("INSERT INTO shop_orders (reference, email, items, amount, mode, delivery_details, delivery_fee) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(reference, email, JSON.stringify(lines), amount, mode, delivery ? JSON.stringify(delivery) : null, deliveryFee).run();
    const callback = new URL("/shop/checkout", url.origin);
    callback.searchParams.set("reference", reference);
    const transaction = await paystack(env.PAYSTACK_SECRET_KEY, "initialize", {
      email,
      amount,
      currency: "NGN",
      reference,
      callback_url: callback.href,
      metadata: { cancel_action: new URL("/shop/checkout", url.origin).href },
    });
    const paymentUrl = new URL(transaction.authorization_url);
    if (transaction.reference !== reference || paymentUrl.origin !== "https://checkout.paystack.com" ||
        paymentUrl.username || paymentUrl.password) throw Error("Invalid checkout URL.");
    return respond({ authorizationUrl: paymentUrl.href, accessCode: transaction.access_code, reference });
  } catch {
    return respond({ error: "Could not start payment. Try again shortly." }, 503);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const params = new URL(request.url).searchParams;
  try {
    if (params.get("admin") === "1") {
      if (!requireAdmin(context)) return respond({ error: "Unauthorized" }, 401);
      const { results } = await env.DB.prepare(
        "SELECT reference, email, items, amount, mode, status, paid_at, delivery_details, delivery_fee FROM shop_orders WHERE paid_at IS NOT NULL ORDER BY paid_at DESC LIMIT 100",
      ).all();
      return respond({ orders: results.map((order) => ({ ...order, items: JSON.parse(order.items), delivery_details: JSON.parse(order.delivery_details ?? "null") })) });
    }
    const reference = params.get("reference");
    if (!reference) return respond({ mode: paymentMode(env.PAYSTACK_SECRET_KEY) ?? "unavailable", deliveryFee: ibadanDeliveryFee });
    if (!validReference(reference)) return respond({ error: "Payment reference is invalid." }, 400);
    let order = await findOrder(env.DB, reference);
    if (!order) return respond({ error: "Payment reference was not found." }, 404);
    let paymentStatus = "pending";
    if (order.status === "pending" && order.mode === paymentMode(env.PAYSTACK_SECRET_KEY)) {
      const payment = await paystack(env.PAYSTACK_SECRET_KEY, `verify/${reference}`);
      if (payment.status === "success") {
        if (!await recordPayment(env.DB, order, payment)) {
          return respond({ error: "Payment details could not be confirmed. Contact TorchVolt with your reference." }, 409);
        }
        order = await findOrder(env.DB, reference);
      } else if (["failed", "abandoned", "reversed"].includes(payment.status)) {
        paymentStatus = payment.status;
      }
    }
    return respond({ status: order.status === "pending" ? paymentStatus : order.status, mode: order.mode, amount: order.amount, fulfillment: order.fulfillment });
  } catch {
    return respond({ error: "Could not check payment status. Try again shortly." }, 503);
  }
}
