"use client";

import Image from "next/image";
import { Package, Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { productCategories, type InventoryProduct, type ProductCategory } from "@/lib/products";
import { money } from "@/app/shop/catalog";

type Draft = {
  id?: string; revision?: number; sku: string; name: string; category: ProductCategory;
  spec: string; price: string; stock: string; image: string; published: boolean;
  photo?: File; preview?: string;
};

const blank = (): Draft => ({ sku: "", name: "", category: "Solar panels", spec: "", price: "", stock: "0", image: "", published: false });
const field = "studio-field w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
const button = "min-h-9 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50";

function InventoryPhoto({ image, pin }: { image: string; pin: string }) {
  const [preview, setPreview] = useState("");
  const uploaded = image.startsWith("/api/product-image?");
  useEffect(() => {
    if (!uploaded) return;
    const controller = new AbortController();
    let url = "";
    void fetch(image, { signal: controller.signal, headers: { "X-Admin-Pin": pin } })
      .then((response) => response.ok ? response.blob() : null)
      .then((blob) => {
        if (!blob || controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
      })
      .catch(() => {});
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [image, pin, uploaded]);
  const src = uploaded ? preview : image;
  return src ? <Image src={src} alt="" width={48} height={48} unoptimized className="size-full object-cover" />
    : <Package size={18} aria-hidden="true" />;
}

export function ProductsPanel({ pin, onAuthError }: { pin: string; onAuthError: () => void }) {
  const [rows, setRows] = useState<InventoryProduct[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/products?admin=1", { headers: { "X-Admin-Pin": pin }, signal, cache: "no-store" });
      if (response.status === 401) return onAuthError();
      if (!response.ok) throw Error("Could not load inventory. Check that the product migration has been applied.");
      const data: { products: InventoryProduct[] } = await response.json();
      setRows(data.products);
      setError("");
    } catch (error) {
      if (!signal?.aborted) setError(error instanceof Error ? error.message : "Could not load inventory.");
    }
  }, [pin, onAuthError]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  function edit(row: InventoryProduct) {
    setDraft({ ...row, price: String(row.price), stock: String(row.stock), published: row.published === 1 });
    setNotice("");
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { photo, preview: _preview, ...fields } = draft;
      const product = JSON.stringify({ ...fields, price: Number(draft.price), stock: Number(draft.stock) });
      const form = new FormData();
      if (photo) { form.set("photo", photo); form.set("product", product); }
      const response = await fetch(draft.id ? `/api/products?id=${encodeURIComponent(draft.id)}` : "/api/products", {
        method: draft.id ? "PUT" : "POST",
        headers: { "X-Admin-Pin": pin, ...(photo ? {} : { "Content-Type": "application/json" }) },
        body: photo ? form : product,
      });
      if (response.status === 401) return onAuthError();
      const data: { product?: InventoryProduct; error?: string } = await response.json();
      if (!response.ok || !data.product) throw Error(data.error || "Could not save the product.");
      const saved = data.product;
      setRows((previous) => [saved, ...(previous ?? []).filter((row) => row.id !== saved.id)]);
      setDraft(null);
      setNotice(`${saved.name} saved.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  }

  const all = rows ?? [];
  const visible = all.filter((row) => {
    const q = search.trim().toLowerCase();
    return `${row.name} ${row.sku} ${row.category}`.toLowerCase().includes(q) &&
      (filter === "all" || (filter === "published" && row.published) ||
        (filter === "draft" && !row.published) || (filter === "low" && row.stock > 0 && row.stock <= 5) ||
        (filter === "out" && row.stock === 0));
  });
  const editField = (key: keyof Draft, value: string | boolean) => setDraft((current) => current ? { ...current, [key]: value } : current);

  function choosePhoto(file: File | undefined, input: HTMLInputElement) {
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 512 * 1024) {
      input.value = "";
      setError("Choose a JPEG, PNG or WebP image up to 512 KB.");
      return;
    }
    setDraft((current) => current ? { ...current, photo: file, preview: undefined } : current);
    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result;
      if (typeof preview === "string") setDraft((current) => current?.photo === file ? { ...current, preview } : current);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 text-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-medium text-slate-600">Studio <span aria-hidden="true" className="mx-1 text-slate-400">/</span> <span className="font-semibold text-slate-900">Products</span></p><h1 className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight">Products &amp; inventory</h1><p className="mt-1 text-sm text-slate-600">Manage listings, prices and stock. Published products appear in the shop.</p></div>
        <button type="button" disabled={!rows || saving} onClick={() => { setDraft(blank()); setError(""); setNotice(""); }} className="min-h-11 rounded-lg bg-[#ffc400] px-4 py-2 text-sm font-bold text-slate-950 hover:bg-[#efb900] disabled:opacity-50">New product</button>
      </div>
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4">
        {([["Products", all.length], ["Published", all.filter((row) => row.published).length], ["Low stock", all.filter((row) => row.stock > 0 && row.stock <= 5).length], ["Out of stock", all.filter((row) => row.stock === 0).length]] as const).map(([label, value]) => <div className="border-slate-200 px-4 py-3 odd:border-r nth-[n+3]:border-t sm:border-t-0 sm:not-last:border-r" key={label}><dt className="text-sm text-slate-600">{label}</dt><dd className={`mt-1 text-2xl font-bold tabular-nums ${label === "Published" ? "text-green-800" : label === "Low stock" ? "text-amber-800" : label === "Out of stock" ? "text-red-700" : ""}`}>{rows ? value : "—"}</dd></div>)}
      </dl>
      {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
      {error && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-red-700"><p>{error}</p><button type="button" className={button} onClick={() => { setDraft(null); void load(); }}>Reload inventory</button></div>}
      {draft && (
        <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">{draft.id ? "Edit product" : "New product"}</h2>
          <fieldset disabled={saving} className="grid min-w-0 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">Product name<input className={field} value={draft.name} onChange={(e) => editField("name", e.target.value)} maxLength={120} required /></label>
            <label className="space-y-1 text-sm">SKU<input className={field} value={draft.sku} onChange={(e) => editField("sku", e.target.value)} maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9_\-]{0,39}" required /></label>
            <label className="space-y-1 text-sm">Category<select className={field} value={draft.category} onChange={(e) => editField("category", e.target.value)}>{productCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="space-y-1 text-sm">Specification<input className={field} value={draft.spec} onChange={(e) => editField("spec", e.target.value)} maxLength={200} /></label>
            <label className="space-y-1 text-sm">Price (₦)<input className={field} type="number" min={1} max={1000000000} step={1} value={draft.price} onChange={(e) => editField("price", e.target.value)} required /></label>
            <label className="space-y-1 text-sm">Stock quantity<input className={field} type="number" min={0} max={1000000} step={1} value={draft.stock} onChange={(e) => editField("stock", e.target.value)} required /></label>
            <div className="space-y-2 text-sm sm:col-span-2">
              <label className="block space-y-1">Upload product image
                <input key={draft.photo ? "selected" : "empty"} className={field} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0], event.currentTarget)} />
              </label>
              <p className="text-xs text-slate-600">JPEG, PNG or WebP, up to 512 KB. The photo is uploaded when you save the product.</p>
              {(draft.photo || draft.image) && <div className="flex items-center gap-3">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-500">
                  <InventoryPhoto key={draft.preview || draft.image} image={draft.preview || draft.image} pin={pin} />
                </div>
                <span className="min-w-0 break-all">{draft.photo?.name || "Current product image"}</span>
                <button type="button" className={button} onClick={() => setDraft((current) => current ? { ...current, photo: undefined, preview: undefined, image: current.photo ? current.image : "" } : current)}>{draft.photo ? "Clear selection" : "Remove image"}</button>
              </div>}
              <label className="block space-y-1">Or use an image URL
                <input className={field} value={draft.image.startsWith("/api/product-image?") ? "" : draft.image} disabled={!!draft.photo} onChange={(e) => editField("image", e.target.value)} maxLength={500} placeholder="https://… or /images/…" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={draft.published} onChange={(e) => editField("published", e.target.checked)} />Publish in the shop</label>
          </fieldset>
          <div className="mt-4 flex gap-2"><button type="submit" className={button} disabled={saving}>{saving ? "Saving…" : "Save product"}</button><button type="button" className={button} disabled={saving} onClick={() => setDraft(null)}>Cancel</button></div>
        </form>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-[440px]"><Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-500" aria-hidden="true" /><input className={`${field} min-h-11 pl-10`} type="search" aria-label="Search products" placeholder="Search name, SKU or category" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className={`${field} min-h-11 sm:max-w-[225px]`} aria-label="Filter products" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All products</option><option value="published">Published</option><option value="draft">Drafts</option><option value="low">Low stock (1–5)</option><option value="out">Out of stock</option>
        </select>
      </div>
      {rows ? visible.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[740px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600"><tr>{["Product", "Category", "Price", "Stock", "Status", "Action"].map((title) => <th scope="col" className="p-3" key={title}>{title}</th>)}</tr></thead>
            <tbody>{visible.map((row) => <tr className="border-t border-slate-200" key={row.id}>
              <th scope="row" className="p-3 font-semibold"><div className="flex items-center gap-3"><div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-500"><InventoryPhoto key={row.revision} image={row.image} pin={pin} /></div><div>{row.name}<span className="mt-0.5 block text-xs font-normal text-slate-600">SKU: {row.sku}</span></div></div></th>
              <td className="p-3 text-slate-600">{row.category}</td>
              <td className="whitespace-nowrap p-3 font-semibold tabular-nums">{money(row.price)}</td>
              <td className={`whitespace-nowrap p-3 font-semibold tabular-nums ${row.stock === 0 ? "text-red-700" : row.stock <= 5 ? "text-amber-800" : "text-green-800"}`}>{row.stock}{row.stock === 0 ? " · Out of stock" : row.stock <= 5 ? " · Low" : ""}</td>
              <td className="p-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${row.published ? "bg-green-100 text-green-900" : "bg-slate-100 text-slate-700"}`}>{row.published ? "Published" : "Draft"}</span></td>
              <td className="p-3"><button type="button" disabled={saving} className={button} onClick={() => edit(row)} aria-label={`Edit ${row.name}`}>Edit</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      ) : <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{all.length ? "No products match these filters." : "No products yet. Create a product to start your inventory."}</p> : !error && <p role="status" className="text-sm text-slate-600">Loading inventory…</p>}
    </div>
  );
}
