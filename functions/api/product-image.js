import { requireAdmin } from "../_lib/cms.js";

export const onRequestGet = async (context) => {
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id || id.length > 40) return new Response(null, { status: 404 });
  const row = await context.env.DB.prepare(
    "SELECT image_bytes, image_type, published FROM shop_products WHERE id=?",
  ).bind(id).first();
  if (!row?.image_bytes || (!row.published && !requireAdmin(context))) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return new Response(new Uint8Array(row.image_bytes), {
    headers: {
      "Content-Type": row.image_type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
};
