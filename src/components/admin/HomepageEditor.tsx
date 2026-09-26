"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  DEFAULT_HOMEPAGE_COPY,
  fetchHomepageCopy,
  mergeHomepageCopy,
  saveHomepageCopy,
  type HomepageCopy,
} from "@/lib/homepageCopy";

export function HomepageEditor({
  pin,
  onAuthError,
}: {
  pin: string;
  onAuthError: () => void;
}) {
  const [copy, setCopy] = useState<HomepageCopy>(DEFAULT_HOMEPAGE_COPY);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchHomepageCopy()
      .then((next) => {
        if (cancelled) return;
        setCopy(next);
        setDirty(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((updater: (prev: HomepageCopy) => HomepageCopy) => {
    setCopy((prev) => updater(prev));
    setDirty(true);
    setSaveState("idle");
  }, []);

  async function onSave() {
    setSaveState("saving");
    setError(null);
    try {
      const saved = await saveHomepageCopy(pin, copy);
      setCopy(saved);
      setDirty(false);
      setSaveState("saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save";
      if (message.toLowerCase().includes("unauthorized")) {
        onAuthError();
        return;
      }
      setError(message);
      setSaveState("error");
    }
  }

  function onReset() {
    setCopy(mergeHomepageCopy(DEFAULT_HOMEPAGE_COPY));
    setDirty(true);
    setSaveState("idle");
    setError(null);
  }

  if (loading) {
    return (
      <p className="text-[13px] text-zinc-500">Loading homepage copy…</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e]/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-[13px] font-medium text-zinc-100">Homepage</p>
          <p className="text-[12px] text-zinc-500">
            Click any text on the preview to edit. Save publishes live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {error ? <p className="text-[12px] text-red-400">{error}</p> : null}
          {saveState === "saved" && !dirty ? (
            <p className="text-[12px] text-emerald-400">Saved</p>
          ) : null}
          {dirty ? (
            <p className="text-[12px] text-amber-400">Unsaved changes</p>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            className="h-9 rounded-md border border-white/10 px-3 text-[12px] font-medium text-zinc-300 transition hover:bg-white/5"
          >
            Reset to defaults
          </button>
          <button
            type="button"
            disabled={saveState === "saving" || !dirty}
            onClick={() => void onSave()}
            className="h-9 rounded-md bg-zinc-100 px-3 text-[12px] font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-50 text-navy shadow-2xl">
        {/* Hero */}
        <section className="hero-mesh relative text-white">
          <div className="hero-grid pointer-events-none absolute inset-0 overflow-hidden opacity-70" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div>
              <Editable
                value={copy.hero.cities}
                onChange={(cities) =>
                  patch((p) => ({ ...p, hero: { ...p.hero, cities } }))
                }
                className="text-sm font-medium text-slate-300"
              />
              <h1 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl lg:leading-[1.08]">
                <Editable
                  value={copy.hero.headline}
                  onChange={(headline) =>
                    patch((p) => ({ ...p, hero: { ...p.hero, headline } }))
                  }
                  as="span"
                  className="inline"
                />{" "}
                <Editable
                  value={copy.hero.headlineAccent}
                  onChange={(headlineAccent) =>
                    patch((p) => ({ ...p, hero: { ...p.hero, headlineAccent } }))
                  }
                  as="span"
                  className="font-display text-gold"
                />
              </h1>
              <Editable
                value={copy.hero.body}
                onChange={(body) =>
                  patch((p) => ({ ...p, hero: { ...p.hero, body } }))
                }
                multiline
                className="mt-5 max-w-lg text-base leading-7 text-slate-300"
              />
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-navy">
                  <Editable
                    value={copy.hero.primaryCta}
                    onChange={(primaryCta) =>
                      patch((p) => ({ ...p, hero: { ...p.hero, primaryCta } }))
                    }
                    as="span"
                  />
                </span>
                <span className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white">
                  <Editable
                    value={copy.hero.secondaryCta}
                    onChange={(secondaryCta) =>
                      patch((p) => ({ ...p, hero: { ...p.hero, secondaryCta } }))
                    }
                    as="span"
                  />
                </span>
              </div>
            </div>
            <ExamplePreview
              copy={copy}
              onChange={(example) => patch((p) => ({ ...p, example }))}
            />
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <Editable
              value={copy.how.eyebrow}
              onChange={(eyebrow) =>
                patch((p) => ({ ...p, how: { ...p.how, eyebrow } }))
              }
              className="text-xs font-semibold uppercase tracking-[0.2em] text-solar"
            />
            <Editable
              value={copy.how.heading}
              onChange={(heading) =>
                patch((p) => ({ ...p, how: { ...p.how, heading } }))
              }
              as="h2"
              className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl"
            />
            <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
              {copy.how.steps.map((step, index) => (
                <li key={index}>
                  <span className="font-mono text-sm font-semibold text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Editable
                    value={step.title}
                    onChange={(title) =>
                      patch((p) => {
                        const steps = [...p.how.steps] as HomepageCopy["how"]["steps"];
                        steps[index] = { ...steps[index], title };
                        return { ...p, how: { ...p.how, steps } };
                      })
                    }
                    as="h3"
                    className="mt-3 text-lg font-semibold"
                  />
                  <Editable
                    value={step.body}
                    onChange={(body) =>
                      patch((p) => {
                        const steps = [...p.how.steps] as HomepageCopy["how"]["steps"];
                        steps[index] = { ...steps[index], body };
                        return { ...p, how: { ...p.how, steps } };
                      })
                    }
                    multiline
                    className="mt-2 text-sm leading-6 text-slate-600"
                  />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Size intro */}
        <section className="bg-gradient-to-b from-slate-100 to-slate-50 py-12">
          <div className="mx-auto max-w-3xl px-4">
            <Editable
              value={copy.size.eyebrow}
              onChange={(eyebrow) =>
                patch((p) => ({ ...p, size: { ...p.size, eyebrow } }))
              }
              className="text-xs font-semibold uppercase tracking-[0.2em] text-solar"
            />
            <Editable
              value={copy.size.heading}
              onChange={(heading) =>
                patch((p) => ({ ...p, size: { ...p.size, heading } }))
              }
              as="h2"
              className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
            />
            <Editable
              value={copy.size.body}
              onChange={(body) =>
                patch((p) => ({ ...p, size: { ...p.size, body } }))
              }
              multiline
              className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base"
            />
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center text-sm text-slate-500">
              Quote wizard stays on the live site — only this intro text is editable here.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ExamplePreview({
  copy,
  onChange,
}: {
  copy: HomepageCopy;
  onChange: (example: HomepageCopy["example"]) => void;
}) {
  const example = copy.example;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <Editable
        value={example.eyebrow}
        onChange={(eyebrow) => onChange({ ...example, eyebrow })}
        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/90"
      />
      <Editable
        value={example.title}
        onChange={(title) => onChange({ ...example, title })}
        className="mt-2 text-lg font-semibold text-white"
      />
      <Editable
        value={example.subtitle}
        onChange={(subtitle) => onChange({ ...example, subtitle })}
        multiline
        className="mt-1 text-sm text-slate-400"
      />
      <dl className="mt-5 grid grid-cols-2 gap-3">
        {example.metrics.map((metric, index) => (
          <div
            key={index}
            className="rounded-2xl bg-black/25 px-3 py-3 ring-1 ring-white/10"
          >
            <Editable
              value={metric.label}
              onChange={(label) => {
                const metrics = [
                  ...example.metrics,
                ] as HomepageCopy["example"]["metrics"];
                metrics[index] = { ...metrics[index], label };
                onChange({ ...example, metrics });
              }}
              as="dt"
              className="text-[11px] uppercase tracking-wide text-slate-400"
            />
            <Editable
              value={metric.value}
              onChange={(value) => {
                const metrics = [
                  ...example.metrics,
                ] as HomepageCopy["example"]["metrics"];
                metrics[index] = { ...metrics[index], value };
                onChange({ ...example, metrics });
              }}
              as="dd"
              className="mt-1 text-lg font-semibold text-white"
            />
          </div>
        ))}
      </dl>
    </div>
  );
}

function Editable({
  value,
  onChange,
  className = "",
  as: Tag = "p",
  multiline = false,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  as?: ElementType;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent !== value) el.textContent = value;
  }, [value]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline || undefined}
      className={`cursor-text rounded-sm outline-none ring-gold/60 transition hover:ring-1 focus:ring-2 ${className}`}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = (e.currentTarget.textContent ?? "").replace(/\u00a0/g, " ");
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {value}
    </Tag>
  ) as ReactNode;
}
