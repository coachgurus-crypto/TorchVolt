import { json, requireAdmin } from "../_lib/cms.js";

const categories = new Set(["Solar panels", "Inverters", "Batteries", "Accessories"]);
const publicFields = "id, name, category, spec, price, stock, image";
const adminFields = publicFields + ", sku, published, revision, updated_at";
const respond = (data, status) => {
  const response = json(data, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
};

function imageAllowed(image) {
  if (!image || /^\/images\/[a-z0-9_-]+\.(webp|png|jpe?g|avif)$/i.test(image)) return true;
  try {
    const url = new URL(image);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

function fields(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const sku = typeof body?.sku === "string" ? body.sku.trim().toUpperCase() : "";
  const spec = typeof body?.spec === "string" ? body.spec.trim() : "";
  const image = typeof body?.image === "string" ? body.image.trim() : "";
  const { category, price, stock, published } = body ?? {};
  if (!name || name.length > 120) throw Error("Enter a product name of up to 120 characters.");
  if (!/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(sku)) throw Error("Enter a SKU using letters, numbers, hyphens or underscores.");
  if (!categories.has(category)) throw Error("Choose a product category.");
  if (!Number.isInteger(price) || price < 1 || price > 1_000_000_000) throw Error("Enter a positive price in whole naira.");
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) throw Error("Stock must be a whole number from 0 to 1,000,000.");
  if (spec.length > 200) throw Error("Keep the specification under 200 characters.");
  if (image.length > 500 || !imageAllowed(image)) throw Error("Use an HTTPS image URL or a file under /images/.");
  if (typeof published !== "boolean") throw Error("Choose a publication status.");
  return [sku, name, category, spec, price, stock, image, Number(published), new Date().toISOString()];
}

export const onRequestGet = async (context) => {
  const admin = new URL(context.request.url).searchParams.get("admin") === "1";
  if (admin && !requireAdmin(context)) return respond({ error: "Unauthorized" }, 401);
  try {
    const result = await context.env.DB.prepare(admin
      ? `SELECT ${adminFields} FROM shop_products ORDER BY updated_at DESC, id`
      : `SELECT ${publicFields} FROM shop_products WHERE published = 1 ORDER BY updated_at DESC, id`).all();
    return respond({ products: result.results ?? [] });
  } catch { return respond({ error: "The product catalog is unavailable." }, 503); }
};

async function write(context, update) {
  if (!requireAdmin(context)) return respond({ error: "Unauthorized" }, 401);
  let body, values;
  try { body = await context.request.json(); values = fields(body); }
  catch (error) { return respond({ error: error instanceof SyntaxError ? "Invalid JSON" : error.message }, 400); }

  const id = update ? new URL(context.request.url).searchParams.get("id") : crypto.randomUUID();
  if (!id || (update && (!Number.isInteger(body.revision) || body.revision < 1))) {
    return respond({ error: "A product and its current revision are required." }, 400);
  }
  try {
    if (update) {
      const result = await context.env.DB.prepare(
        "UPDATE shop_products SET sku=?, name=?, category=?, spec=?, price=?, stock=?, image=?, published=?, updated_at=?, revision=revision+1 WHERE id=? AND revision=?",
      ).bind(...values, id, body.revision).run();
      if (!result.meta.changes) return respond({ error: "This product changed or no longer exists. Reload the list before saving." }, 409);
    } else {
      await context.env.DB.prepare(
        "INSERT INTO shop_products (sku, name, category, spec, price, stock, image, published, updated_at, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(...values, id).run();
    }
    const product = await context.env.DB.prepare(`SELECT ${adminFields} FROM shop_products WHERE id=?`).bind(id).first();
    return respond({ product }, update ? 200 : 201);
  } catch (error) {
    if (/UNIQUE constraint failed.*shop_products\.sku/i.test(String(error))) return respond({ error: "That SKU is already in use." }, 409);
    return respond({ error: "Could not save the product. Check that the inventory migration has been applied." }, 503);
  }
}

export const onRequestPost = (context) => write(context, false);
export const onRequestPut = (context) => write(context, true);
