ALTER TABLE shop_orders ADD COLUMN delivery_details TEXT CHECK (delivery_details IS NULL OR json_valid(delivery_details));
ALTER TABLE shop_orders ADD COLUMN delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0);
