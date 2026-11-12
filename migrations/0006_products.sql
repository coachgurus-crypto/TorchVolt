CREATE TABLE IF NOT EXISTS shop_products (
  id TEXT PRIMARY KEY NOT NULL,
  sku TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  spec TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  image TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS shop_products_public ON shop_products (published, updated_at);
