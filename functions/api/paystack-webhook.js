import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import { checkoutResponse as respond, findOrder, recordPayment, validReference } from "../_lib/paystack.js";

function matches(expected, signature) {
  return /^[a-f0-9]{128}$/.test(signature ?? "") && timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

function authentic(request, env, body) {
  if (env.PAYSTACK_WEBHOOK_SECRET) {
    const fields = request.headers.get("paystack-signature")?.split(",").map((part) => part.trim()) ?? [];
    const timestamps = fields.filter((part) => part.startsWith("t="));
    const timestamp = timestamps[0]?.slice(2);
    if (timestamps.length !== 1 || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
    const expected = createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET).update(timestamp + ".").update(body).digest();
    return fields.some((part) => part.startsWith("v1=whk_") && matches(expected, part.split(":")[1]));
  }
  if (!env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(body).digest();
  return matches(expected, request.headers.get("x-paystack-signature"));
}

export async function onRequestPost({ request, env }) {
  const body = Buffer.from(await request.arrayBuffer());
  if (!authentic(request, env, body)) return respond({ error: "Invalid signature." }, 401);
  try {
    const event = JSON.parse(body.toString("utf8"));
    if (event.event === "charge.success" && validReference(event.data?.reference)) {
      const order = await findOrder(env.DB, event.data.reference);
      if (order?.status === "pending" && !await recordPayment(env.DB, order, event.data)) {
        return respond({ error: "Payment details do not match the order." }, 409);
      }
    }
    return respond({ received: true });
  } catch {
    return respond({ error: "Could not record payment." }, 503);
  }
}
