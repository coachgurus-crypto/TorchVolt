"use client";

import { useCallback, useEffect, useState } from "react";
import { ContentCms } from "@/components/admin/ContentCms";
import { CustomersPanel } from "@/components/admin/CustomersPanel";
import { HomepageEditor } from "@/components/admin/HomepageEditor";
import { fetchLeads } from "@/lib/leads";

const PIN_KEY = "torchvolt.admin.pin";

type Tab = "homepage" | "customers" | "blog" | "pages";

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
    <div className="admin-studio flex min-h-screen">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0c0c0e] px-3 py-4">
        <p className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          TorchVolt
        </p>
        <nav className="mt-6 flex flex-col gap-0.5">
          {(
            [
              ["homepage", "Homepage"],
              ["blog", "Posts"],
              ["pages", "Pages"],
              ["customers", "Customers"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-2 py-1.5 text-left text-[13px] font-medium tracking-tight transition ${
                tab === id
                  ? "bg-white/[0.07] text-zinc-50"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              {label}
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
            className="text-[12px] text-zinc-600 transition hover:text-zinc-300"
          >
            Lock
          </button>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        {tab === "customers" ? (
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
