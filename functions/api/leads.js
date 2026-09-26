/**
 * @typedef {{
 *   DB: D1Database,
 *   DASHBOARD_PIN: string,
 * }} Env
 */

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Pin",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

function cleanPhone(value) {
  return String(value).replace(/[^\d+]/g, "").slice(0, 20);
}

/** @type {PagesFunction} */
export const onRequestOptions = async () => json(null, 204);

/** @type {PagesFunction<Env>} */
export const onRequestPost = async (context) => {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const customerName = String(body.customerName ?? "").trim().slice(0, 80);
  const customerPhone = cleanPhone(body.customerPhone ?? "");
  const city = String(body.city ?? "").trim().slice(0, 40);
  const siteKind = body.siteKind === "shop" ? "shop" : "home";
  const gridProfileId = String(body.gridProfileId ?? "").trim().slice(0, 40);
  const quantities = body.quantities ?? {};
  const hours = body.hours ?? {};
  const sizes = body.sizes ?? {};
  const packageId = String(body.packageId ?? "").trim().slice(0, 40);
  const packageSummary = String(body.packageSummary ?? "").trim().slice(0, 200);

  if (!customerName || customerPhone.length < 8) {
    return json({ error: "Name and phone are required" }, 400);
  }
  if (!city || !gridProfileId || !packageId) {
    return json({ error: "Incomplete sizing payload" }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await context.env.DB.prepare(
    `INSERT INTO leads (
      id, created_at, customer_name, customer_phone, city, site_kind,
      grid_profile_id, uses_generator, gen_hours_per_day, quantities_json,
      hours_json, running_watts, surge_watts, daily_kwh, needed_battery_kwh,
      package_id, package_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      createdAt,
      customerName,
      customerPhone,
      city,
      siteKind,
      gridProfileId,
      body.usesGenerator == null ? null : body.usesGenerator ? 1 : 0,
      body.genHoursPerDay ?? null,
      JSON.stringify({ quantities, sizes }),
      JSON.stringify(hours),
      Math.round(Number(body.runningWatts) || 0),
      Math.round(Number(body.surgeWatts) || 0),
      Number(body.dailyKwh) || 0,
      Number(body.neededBatteryKwh) || 0,
      packageId,
      packageSummary,
    )
    .run();

  return json({ ok: true, id });
};

/** @type {PagesFunction<Env>} */
export const onRequestGet = async (context) => {
  const pin = (context.request.headers.get("X-Admin-Pin") ?? "").trim();
  const expected = String(context.env.DASHBOARD_PIN ?? "").trim();

  if (!expected) {
    return json(
      { error: "Admin PIN is not configured on the server (DASHBOARD_PIN)." },
      503,
    );
  }
  if (!pin || pin !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { results } = await context.env.DB.prepare(
    `SELECT * FROM leads ORDER BY created_at DESC LIMIT 300`,
  ).all();

  return json({ leads: results ?? [] });
};
