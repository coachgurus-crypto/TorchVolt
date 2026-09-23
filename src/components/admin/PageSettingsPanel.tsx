"use client";

import { X } from "lucide-react";
import type { CmsCategory, CmsContent, ContentStatus, ContentType } from "@/lib/content";

export type PageSettings = {
  slug: string;
  excerpt: string;
  seoTitle: string;
  metaDescription: string;
  featuredImage: string;
  tags: string[];
  parentId: string | null;
  categoryId: string | null;
  scheduledAt: string;
  status: ContentStatus;
};

export function PageSettingsPanel({
  open,
  onClose,
  type,
  permalink,
  settings,
  onChange,
  categories,
  parentPages,
  currentId,
}: {
  open: boolean;
  onClose: () => void;
  type: ContentType;
  permalink: string;
  settings: PageSettings;
  onChange: (patch: Partial<PageSettings>) => void;
  categories: CmsCategory[];
  parentPages: CmsContent[];
  currentId?: string;
}) {
  const isPage = type === "page";
  const tagText = settings.tags.join(", ");

  return (
    <>
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className={`studio-backdrop fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] ${
          open ? "is-open" : ""
        }`}
      />
      <aside
        className={`studio-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-[380px] flex-col border-l border-white/[0.06] bg-[#111113] ${
          open ? "is-open" : ""
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-white/[0.06] px-4">
          <p className="text-[13px] font-medium tracking-tight text-zinc-100">
            Page settings
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-4 py-5">
          <Section label="Permalink">
            <p className="mb-2 font-mono text-[11px] text-zinc-500">{permalink}</p>
            <Field
              label="Slug"
              value={settings.slug}
              onChange={(slug) => onChange({ slug })}
              mono
            />
            {isPage ? (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                  Parent
                </span>
                <select
                  value={settings.parentId ?? ""}
                  onChange={(e) => onChange({ parentId: e.target.value || null })}
                  className="studio-field h-9 w-full rounded-md border border-white/[0.08] bg-[#18181b] px-2.5 text-[13px] text-zinc-100"
                >
                  <option value="">None — top level</option>
                  {parentPages
                    .filter((p) => p.id !== currentId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        /{p.permalink}
                      </option>
                    ))}
                </select>
              </label>
            ) : (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                  Category
                </span>
                <select
                  value={settings.categoryId ?? ""}
                  onChange={(e) => onChange({ categoryId: e.target.value || null })}
                  className="studio-field h-9 w-full rounded-md border border-white/[0.08] bg-[#18181b] px-2.5 text-[13px] text-zinc-100"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      /blog/{c.path}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </Section>

          <Section label="SEO">
            <Field
              label="SEO title"
              value={settings.seoTitle}
              onChange={(seoTitle) => onChange({ seoTitle })}
              hint={`${settings.seoTitle.length}/70`}
            />
            <label className="mt-3 block">
              <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                Meta description
                <span className="normal-case tracking-normal text-zinc-600">
                  {settings.metaDescription.length}/180
                </span>
              </span>
              <textarea
                value={settings.metaDescription}
                onChange={(e) => onChange({ metaDescription: e.target.value })}
                rows={3}
                className="studio-field w-full resize-none rounded-md border border-white/[0.08] bg-[#18181b] px-2.5 py-2 text-[13px] leading-5 text-zinc-100 placeholder:text-zinc-600"
              />
            </label>
            <Field
              label="Excerpt"
              value={settings.excerpt}
              onChange={(excerpt) => onChange({ excerpt })}
            />
          </Section>

          <Section label="Featured image">
            {settings.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.featuredImage}
                alt=""
                className="mb-3 h-28 w-full rounded-md object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="mb-3 flex h-28 items-center justify-center rounded-md border border-dashed border-white/10 text-[12px] text-zinc-600">
                Paste a URL
              </div>
            )}
            <Field
              label="Image URL"
              value={settings.featuredImage}
              onChange={(featuredImage) => onChange({ featuredImage })}
              mono
            />
          </Section>

          <Section label="Tags">
            <Field
              label="Comma separated"
              value={tagText}
              onChange={(value) =>
                onChange({
                  tags: value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </Section>

          <Section label="Publish">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                Schedule
              </span>
              <input
                type="datetime-local"
                value={settings.scheduledAt}
                onChange={(e) => onChange({ scheduledAt: e.target.value })}
                className="studio-field h-9 w-full rounded-md border border-white/[0.08] bg-[#18181b] px-2.5 text-[13px] text-zinc-100"
              />
            </label>
          </Section>
        </div>
      </aside>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  mono,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
        {hint ? (
          <span className="normal-case tracking-normal text-zinc-600">{hint}</span>
        ) : null}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`studio-field h-9 w-full rounded-md border border-white/[0.08] bg-[#18181b] px-2.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}
