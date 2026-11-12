"use client";

import { File, House, LockKeyhole, Newspaper, Receipt, Tag, Users, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ContentCms } from "@/components/admin/ContentCms";
import { CustomersPanel } from "@/components/admin/CustomersPanel";
import { HomepageEditor } from "@/components/admin/HomepageEditor";
import { ProductsPanel } from "@/components/admin/ProductsPanel";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { fetchLeads } from "@/lib/leads";

const PIN_KEY = "torchvolt.admin.pin";

type Tab = "homepage" | "customers" | "blog" | "pages" | "products" | "orders";

export default function AdminDashboardPage() {
  const [pin, setPin] = useState("");
  const [draftPin, setDraftPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("homepage");

  useEffect(() => {
    const saved = sessionStorage.getItem(PIN_KEY);
    if (saved) setPin(saved);
  }, []);

  useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    setError(null);
    fetchLeads(pin)
      .then(() => {
        if (cancelled) return;
        sessionStorage.setItem(PIN_KEY, pin);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        sessionStorage.removeItem(PIN_KEY);
        setPin("");
        setDraftPin("");
      });
    return () => {
      cancelled = true;
    };
  }, [pin]);

  const onAuthError = useCallback(() => {
    sessionStorage.removeItem(PIN_KEY);
    setPin("");
    setDraftPin("");
    setError("Session expired. Enter the PIN again.");
  }, []);

  if (!pin) {
    return (
      <div className="admin-studio flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            Studio
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-zinc-50">
            TorchVolt
          </h1>
          <form
            className="mt-8 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setPin(draftPin.trim());
            }}
          >
            <input
              type="password"
              autoComplete="current-password"
              value={draftPin}
              onChange={(e) => setDraftPin(e.target.value)}
              placeholder="PIN"
              className="studio-field h-10 w-full rounded-md border border-white/10 bg-[#18181b] px-3 text-[14px] text-zinc-100 placeholder:text-zinc-600"
            />
            {error ? <p className="text-[13px] text-red-400">{error}</p> : null}
            <button
              type="submit"
              className="h-10 w-full rounded-md bg-zinc-100 text-[13px] font-medium text-zinc-950 transition hover:bg-white"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-studio flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-white/10 bg-[#0b1932] px-3 py-5 md:w-[220px] md:border-r md:border-b-0">
        <p className="flex items-center gap-2 px-2 text-lg font-extrabold tracking-wide text-white"><Zap size={27} fill="currentColor" className="text-[#ffc400]" aria-hidden="true" />TORCHVOLT</p>
        <nav className="my-3 flex flex-wrap gap-1 md:mt-7 md:flex-col">
          {(
            [
              ["homepage", "Homepage", House],
              ["blog", "Posts", Newspaper],
              ["pages", "Pages", File],
              ["products", "Products", Tag],
              ["orders", "Orders", Receipt],
              ["customers", "Customers", Users],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                tab === id
                  ? "bg-[#ffc400] text-[#0b1932]"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-2">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(PIN_KEY);
              setPin("");
              setDraftPin("");
            }}
            className="flex min-h-10 items-center gap-3 text-sm text-slate-300 transition hover:text-white"
          >
            <LockKeyhole size={18} aria-hidden="true" />Lock
          </button>
        </div>
      </aside>

      <section className={`min-w-0 flex-1 ${tab === "products" || tab === "orders" ? "bg-[#f4f5f7]" : ""}`}>
        {tab === "products" ? (
          <div className="p-4 md:p-6"><ProductsPanel pin={pin} onAuthError={onAuthError} /></div>
        ) : tab === "orders" ? (
          <div className="p-4 md:p-6"><OrdersPanel pin={pin} onAuthError={onAuthError} /></div>
        ) : tab === "customers" ? (
          <div className="p-6 [&_*]:border-white/10 [&_a]:text-zinc-100 [&_article]:bg-[#111113] [&_article]:text-zinc-200 [&_button]:text-zinc-200 [&_h1]:text-zinc-50 [&_h2]:text-zinc-50 [&_p]:text-zinc-400 [&_ul]:border-white/10 [&_ul]:bg-[#111113]">
            <CustomersPanel pin={pin} onAuthError={onAuthError} />
          </div>
        ) : tab === "homepage" ? (
          <div className="p-6">
            <HomepageEditor pin={pin} onAuthError={onAuthError} />
          </div>
        ) : (
          <div className="p-6">
            {tab === "pages" ? (
              <ContentCms pin={pin} type="page" onAuthError={onAuthError} />
            ) : (
              <ContentCms pin={pin} type="post" onAuthError={onAuthError} />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
