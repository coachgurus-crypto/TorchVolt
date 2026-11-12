CREATE TABLE shop_orders (
  reference TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  items TEXT NOT NULL CHECK (json_valid(items)),
  amount INTEGER NOT NULL CHECK (amount > 0),
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'paid_review')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT
);

CREATE INDEX shop_orders_paid ON shop_orders (paid_at DESC) WHERE paid_at IS NOT NULL;

-- A verified live payment and its stock adjustment commit together.
CREATE TRIGGER shop_orders_deduct_stock
AFTER UPDATE OF status ON shop_orders
WHEN OLD.status = 'pending' AND NEW.status = 'paid' AND NEW.mode = 'live'
BEGIN
  UPDATE shop_products
  SET stock = stock - (
    SELECT json_extract(value, '$.quantity') FROM json_each(NEW.items)
    WHERE json_extract(value, '$.id') = shop_products.id
  ), revision = revision + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id IN (SELECT json_extract(value, '$.id') FROM json_each(NEW.items));
END;
