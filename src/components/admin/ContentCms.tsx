"use client";

import { ArrowLeft, Plus, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageSettingsPanel } from "@/components/admin/PageSettingsPanel";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  contentToEditorHtml,
  normalizeEditorHtml,
} from "@/lib/richText";
import {
  createCategory,
  createContent,
  deleteCategory,
  deleteContent,
  fetchAdminContent,
  fetchCategories,
  previewPermalink,
  slugifyTitle,
  updateContent,
  type CmsCategory,
  type CmsContent,
  type ContentStatus,
  type ContentType,
} from "@/lib/content";
import { formatDate } from "@/lib/format";

type Editing = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  status: ContentStatus;
  scheduledAt: string;
  parentId: string | null;
  categoryId: string | null;
  seoTitle: string;
  metaDescription: string;
  featuredImage: string;
  tags: string[];
  html: string;
};

function emptyDraft(): Editing {
  return {
    title: "",
    slug: "",
    excerpt: "",
    status: "draft",
    scheduledAt: "",
    parentId: null,
    categoryId: null,
    seoTitle: "",
    metaDescription: "",
    featuredImage: "",
    tags: [],
    html: "",
  };
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ContentCms({
  pin,
  type,
  onAuthError,
}: {
  pin: string;
  type: ContentType;
  onAuthError: () => void;
}) {
  const isPage = type === "page";
  const [items, setItems] = useState<CmsContent[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catParent, setCatParent] = useState("");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [rows, cats] = await Promise.all([
        fetchAdminContent(pin, type),
        isPage ? Promise.resolve([]) : fetchCategories(),
      ]);
      setItems(rows);
      setCategories(cats);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load";
      setError(message);
      if (message.toLowerCase().includes("unauthorized")) onAuthError();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, type]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      }
      if (e.key === "Escape") setSettingsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const parentPages = useMemo(
    () => items.filter((item) => item.type === "page"),
    [items],
  );

  const permalinkPreview = editing
    ? previewPermalink({
        type,
        slug: editing.slug || editing.title,
        categoryPath: categories.find((c) => c.id === editing.categoryId)?.path,
        parentPermalink: parentPages.find((p) => p.id === editing.parentId)
          ?.permalink,
      })
    : "";

  async function save(status?: ContentStatus) {
    if (!editing) return;
    const nextStatus = status ?? editing.status;
    const payload = {
      type,
      title: editing.title.trim(),
      slug: (editing.slug || slugifyTitle(editing.title)).trim(),
      excerpt: editing.excerpt.trim(),
      content: normalizeEditorHtml(editing.html),
      status: nextStatus,
      parentId: isPage ? editing.parentId : null,
      categoryId: isPage ? null : editing.categoryId,
      scheduledAt:
        nextStatus === "scheduled" && editing.scheduledAt
          ? new Date(editing.scheduledAt).toISOString()
          : null,
      seoTitle: editing.seoTitle,
      metaDescription: editing.metaDescription,
      featuredImage: editing.featuredImage,
      tags: editing.tags,
    };
    if (!payload.title) {
      setError("Title is required");
      return;
    }
    if (nextStatus === "scheduled" && !editing.scheduledAt) {
      setSettingsOpen(true);
      setError("Pick a publish time to schedule");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing.id) await updateContent(pin, editing.id, payload);
      else await createContent(pin, payload);
      setEditing(null);
      setSettingsOpen(false);
      setSlugTouched(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="-m-6 flex h-[calc(100dvh)] flex-col">
        <header className="relative z-30 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#09090b] px-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setSettingsOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="truncate font-mono text-[11px] text-zinc-500">
              {permalinkPreview}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Settings
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save("draft")}
              className="h-7 rounded-md px-2.5 text-[12px] font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 disabled:opacity-40"
            >
              Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save("published")}
              className="h-7 rounded-md bg-zinc-100 px-2.5 text-[12px] font-medium text-zinc-950 transition hover:bg-white disabled:opacity-40"
            >
              {saving ? "Saving" : "Publish"}
            </button>
          </div>
        </header>

        {error ? (
          <p className="shrink-0 px-4 py-3 text-[13px] text-red-400">{error}</p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] px-6 pb-16 pt-10">
            <input
              value={editing.title}
              onChange={(e) => {
                const title = e.target.value;
                setEditing((prev) =>
                  prev
                    ? {
                        ...prev,
                        title,
                        slug: slugTouched ? prev.slug : slugifyTitle(title),
                      }
                    : prev,
                );
              }}
              onPaste={(e) => {
                const plain = e.clipboardData.getData("text/plain") || "";
                if (plain.includes("\n") || plain.length > 160) {
                  e.preventDefault();
                  const lines = plain
                    .replace(/\r\n/g, "\n")
                    .split("\n")
                    .map((l) => l.replace(/^#+\s+/, "").trim())
                    .filter(Boolean);
                  const title = lines[0]?.slice(0, 160) || "";
                  setEditing((prev) =>
                    prev
                      ? {
                          ...prev,
                          title: title || prev.title,
                          slug:
                            slugTouched || !title
                              ? prev.slug
                              : slugifyTitle(title),
                        }
                      : prev,
                  );
                } else if (/^#{1,6}\s+/.test(plain)) {
                  e.preventDefault();
                  const title = plain.replace(/^#{1,6}\s+/, "").trim();
                  setEditing((prev) =>
                    prev
                      ? {
                          ...prev,
                          title,
                          slug: slugTouched ? prev.slug : slugifyTitle(title),
                        }
                      : prev,
                  );
                }
              }}
              placeholder="Untitled"
              className="mb-6 w-full border-0 bg-transparent text-[42px] font-semibold leading-[1.1] tracking-[-0.045em] text-zinc-50 outline-none placeholder:text-zinc-700"
            />
            <RichTextEditor
              value={editing.html}
              onChange={(html) =>
                setEditing((prev) => (prev ? { ...prev, html } : prev))
              }
            />
          </div>
        </div>

        <PageSettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          type={type}
          permalink={permalinkPreview}
          settings={{
            slug: editing.slug,
            excerpt: editing.excerpt,
            seoTitle: editing.seoTitle,
            metaDescription: editing.metaDescription,
            featuredImage: editing.featuredImage,
            tags: editing.tags,
            parentId: editing.parentId,
            categoryId: editing.categoryId,
            scheduledAt: editing.scheduledAt,
            status: editing.status,
          }}
          onChange={(patch) => {
            if (patch.slug !== undefined) setSlugTouched(true);
            setEditing((prev) =>
              prev
                ? {
                    ...prev,
                    ...patch,
                    slug:
                      patch.slug !== undefined
                        ? slugifyTitle(patch.slug)
                        : prev.slug,
                  }
                : prev,
            );
          }}
          categories={categories}
          parentPages={parentPages}
          currentId={editing.id}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[13px] text-zinc-500">
          {loading
            ? "Loading"
            : `${items.length} ${isPage ? "page" : "post"}${items.length === 1 ? "" : "s"}`}
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(emptyDraft());
            setSlugTouched(false);
            setSettingsOpen(false);
            setError(null);
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-100 px-3 text-[13px] font-medium text-zinc-950 transition hover:bg-white"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {error ? <p className="mb-4 text-[13px] text-red-400">{error}</p> : null}

      {!isPage ? (
        <div className="mb-6 rounded-lg border border-white/[0.06] bg-[#111113] p-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="New category"
              className="studio-field h-8 min-w-[10rem] flex-1 rounded-md border border-white/[0.08] bg-[#18181b] px-2.5 text-[13px] text-zinc-100 placeholder:text-zinc-600"
            />
            <select
              value={catParent}
              onChange={(e) => setCatParent(e.target.value)}
              className="h-8 rounded-md border border-white/[0.08] bg-[#18181b] px-2 text-[12px] text-zinc-300"
            >
              <option value="">Top level</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.path}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const name = catName.trim();
                if (!name) return;
                void createCategory(pin, {
                  name,
                  slug: slugifyTitle(name),
                  parentId: catParent || null,
                })
                  .then(() => {
                    setCatName("");
                    setCatParent("");
                    return reload();
                  })
                  .catch((err: Error) => setError(err.message));
              }}
              className="h-8 rounded-md px-2.5 text-[12px] font-medium text-zinc-300 hover:bg-white/5"
            >
              Add
            </button>
          </div>
        </div>
      ) : null}

      <ul className="divide-y divide-white/[0.04] overflow-hidden rounded-lg border border-white/[0.06] bg-[#111113]">
        {!loading && items.length === 0 ? (
          <li className="px-4 py-10 text-center text-[13px] text-zinc-500">
            Nothing yet.
          </li>
        ) : null}
        {items.map((item) => (
          <li key={item.id} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setEditing({
                  id: item.id,
                  title: item.title,
                  slug: item.slug,
                  excerpt: item.excerpt,
                  status: item.status,
                  scheduledAt: toDatetimeLocal(item.scheduledAt),
                  parentId: item.parentId,
                  categoryId: item.categoryId,
                  seoTitle: item.seoTitle ?? "",
                  metaDescription: item.metaDescription ?? "",
                  featuredImage: item.featuredImage ?? "",
                  tags: item.tags ?? [],
                  html: contentToEditorHtml(item.content),
                });
                setSlugTouched(true);
                setSettingsOpen(false);
                setError(null);
              }}
              className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/[0.03]"
            >
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium tracking-tight text-zinc-100">
                  {item.title || "Untitled"}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-500">
                  /{item.permalink}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-[11px] text-zinc-500">
                <StatusDot status={item.status} />
                {formatDate(item.updatedAt)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(`Delete “${item.title}”?`)) return;
                void deleteContent(pin, item.id)
                  .then(reload)
                  .catch((err: Error) => setError(err.message));
              }}
              className="mr-2 h-7 rounded-md px-2 text-[11px] text-zinc-600 hover:text-red-400"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusDot({ status }: { status: ContentStatus }) {
  const color =
    status === "published"
      ? "bg-emerald-400"
      : status === "scheduled"
        ? "bg-sky-400"
        : "bg-zinc-500";
  return (
    <span className="inline-flex items-center gap-1.5 capitalize">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {status}
    </span>
  );
}
