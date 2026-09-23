-- Lightweight WordPress-style CMS (single site, D1/SQLite)
-- posts live at /blog/{category.path}/{slug}
-- pages live at /{parent.permalink}/{slug}  e.g. /about/team

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('post', 'page')),
  parent_id TEXT REFERENCES contents(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  permalink TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TEXT,
  scheduled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contents_type_status ON contents(type, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_parent ON contents(parent_id);
CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category_id);

CREATE TABLE IF NOT EXISTS permalink_redirects (
  id TEXT PRIMARY KEY,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Lift existing blog posts into the unified contents table.
INSERT OR IGNORE INTO contents (
  id, type, parent_id, category_id, title, slug, permalink,
  excerpt, content, status, published_at, scheduled_at, created_at, updated_at
)
SELECT
  id,
  'post',
  NULL,
  NULL,
  title,
  slug,
  'blog/' || slug,
  excerpt,
  content,
  CASE WHEN status = 'published' THEN 'published' ELSE 'draft' END,
  published_at,
  NULL,
  created_at,
  updated_at
FROM posts;
