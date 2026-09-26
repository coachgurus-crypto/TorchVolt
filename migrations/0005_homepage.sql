-- Editable marketing homepage copy (single row)

CREATE TABLE IF NOT EXISTS homepage_copy (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);
