-- Customer solar sizing submissions (admin dashboard)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  city TEXT NOT NULL,
  site_kind TEXT NOT NULL,
  grid_profile_id TEXT NOT NULL,
  uses_generator INTEGER,
  gen_hours_per_day REAL,
  quantities_json TEXT NOT NULL,
  hours_json TEXT NOT NULL,
  running_watts INTEGER NOT NULL,
  surge_watts INTEGER NOT NULL,
  daily_kwh REAL NOT NULL,
  needed_battery_kwh REAL NOT NULL,
  package_id TEXT NOT NULL,
  package_summary TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
