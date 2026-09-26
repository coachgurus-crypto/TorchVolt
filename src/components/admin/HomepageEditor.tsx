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
    return <p className="text-[13px] text-zinc-500">Loading homepage copy…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e]/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-[13px] font-medium text-zinc-100">Homepage</p>
          <p className="text-[12px] text-zinc-500">
            Click any text to edit — header, footer, wizard prompts, and packages included.
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
        {/* Header */}
        <header className="border-b border-slate-200/70 bg-white">
          <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4">
            <span className="text-lg font-semibold tracking-tight">TorchVolt</span>
            <nav className="flex items-center gap-2 sm:gap-3">
              <Editable
                value={copy.header.blog}
                onChange={(blog) =>
                  patch((p) => ({ ...p, header: { ...p.header, blog } }))
                }
                as="span"
                className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 sm:inline-flex"
              />
              <Editable
                value={copy.header.howItWorks}
                onChange={(howItWorks) =>
                  patch((p) => ({ ...p, header: { ...p.header, howItWorks } }))
                }
                as="span"
                className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 md:inline-flex"
              />
              <span className="inline-flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white">
                <Editable
                  value={copy.header.cta}
                  onChange={(cta) =>
                    patch((p) => ({ ...p, header: { ...p.header, cta } }))
                  }
                  as="span"
                />
              </span>
            </nav>
          </div>
        </header>

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
          </div>
        </section>

        {/* Wizard copy */}
        <section className="border-t border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-3xl space-y-8 px-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
              Quote wizard screens
            </p>
            <WizardBlock
              label="Home or office"
              title={copy.wizard.who.title}
              lead={copy.wizard.who.lead}
              onTitle={(title) =>
                patch((p) => ({
                  ...p,
                  wizard: { ...p.wizard, who: { ...p.wizard.who, title } },
                }))
              }
              onLead={(lead) =>
                patch((p) => ({
                  ...p,
                  wizard: { ...p.wizard, who: { ...p.wizard.who, lead } },
                }))
              }
            >
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ChoicePreview
                  title={copy.wizard.who.homeTitle}
                  body={copy.wizard.who.homeBody}
                  onTitle={(homeTitle) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        who: { ...p.wizard.who, homeTitle },
                      },
                    }))
                  }
                  onBody={(homeBody) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        who: { ...p.wizard.who, homeBody },
                      },
                    }))
                  }
                />
                <ChoicePreview
                  title={copy.wizard.who.shopTitle}
                  body={copy.wizard.who.shopBody}
                  onTitle={(shopTitle) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        who: { ...p.wizard.who, shopTitle },
                      },
                    }))
                  }
                  onBody={(shopBody) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        who: { ...p.wizard.who, shopBody },
                      },
                    }))
                  }
                />
              </div>
            </WizardBlock>

            <WizardBlock
              label="City"
              title={copy.wizard.city.title}
              lead={copy.wizard.city.lead}
              onTitle={(title) =>
                patch((p) => ({
                  ...p,
                  wizard: { ...p.wizard, city: { ...p.wizard.city, title } },
                }))
              }
              onLead={(lead) =>
                patch((p) => ({
                  ...p,
                  wizard: { ...p.wizard, city: { ...p.wizard.city, lead } },
                }))
              }
            />

            <WizardBlock
              label="Power cuts (home)"
              title={copy.wizard.grid.title}
              lead={copy.wizard.grid.lead}
              onTitle={(title) =>
                patch((p) => ({
                  ...p,
                  wizard: { ...p.wizard, grid: { ...p.wizard.grid, title } },
                }))
              }
              onLead={(lead) =>
                patch((p) => ({
                  ...p,
                  wizard: { ...p.wizard, grid: { ...p.wizard.grid, lead } },
                }))
              }
            >
              <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Shop title
                <Editable
                  value={copy.wizard.grid.titleShop}
                  onChange={(titleShop) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        grid: { ...p.wizard.grid, titleShop },
                      },
                    }))
                  }
                  className="mt-1 text-base font-semibold text-navy normal-case tracking-normal"
                />
              </label>
            </WizardBlock>

            <WizardBlock
              label="Appliances"
              title={copy.wizard.loads.title}
              lead={copy.wizard.loads.lead}
              onTitle={(title) =>
                patch((p) => ({
                  ...p,
                  wizard: { ...p.wizard, loads: { ...p.wizard.loads, title } },
                }))
              }
              onLead={(lead) =>
                patch((p) => ({
                  ...p,
                  wizard: { ...p.wizard, loads: { ...p.wizard.loads, lead } },
                }))
              }
            >
              <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Empty hint
                <Editable
                  value={copy.wizard.loads.emptyHint}
                  onChange={(emptyHint) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        loads: { ...p.wizard.loads, emptyHint },
                      },
                    }))
                  }
                  multiline
                  className="mt-1 text-sm text-slate-600 normal-case tracking-normal"
                />
              </label>
            </WizardBlock>

            <WizardBlock
              label="Generator"
              title={copy.wizard.generator.title}
              lead={copy.wizard.generator.lead}
              onTitle={(title) =>
                patch((p) => ({
                  ...p,
                  wizard: {
                    ...p.wizard,
                    generator: { ...p.wizard.generator, title },
                  },
                }))
              }
              onLead={(lead) =>
                patch((p) => ({
                  ...p,
                  wizard: {
                    ...p.wizard,
                    generator: { ...p.wizard.generator, lead },
                  },
                }))
              }
            >
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ChoicePreview
                  title={copy.wizard.generator.yesTitle}
                  body={copy.wizard.generator.yesBody}
                  onTitle={(yesTitle) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        generator: { ...p.wizard.generator, yesTitle },
                      },
                    }))
                  }
                  onBody={(yesBody) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        generator: { ...p.wizard.generator, yesBody },
                      },
                    }))
                  }
                />
                <ChoicePreview
                  title={copy.wizard.generator.noTitle}
                  body={copy.wizard.generator.noBody}
                  onTitle={(noTitle) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        generator: { ...p.wizard.generator, noTitle },
                      },
                    }))
                  }
                  onBody={(noBody) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        generator: { ...p.wizard.generator, noBody },
                      },
                    }))
                  }
                />
              </div>
            </WizardBlock>

            <WizardBlock
              label="Result"
              title={copy.wizard.result.title}
              lead={copy.wizard.result.lead}
              onTitle={(title) =>
                patch((p) => ({
                  ...p,
                  wizard: {
                    ...p.wizard,
                    result: { ...p.wizard.result, title },
                  },
                }))
              }
              onLead={(lead) =>
                patch((p) => ({
                  ...p,
                  wizard: {
                    ...p.wizard,
                    result: { ...p.wizard.result, lead },
                  },
                }))
              }
            >
              <div className="mt-4 space-y-3">
                <Editable
                  value={copy.wizard.result.disclaimer}
                  onChange={(disclaimer) =>
                    patch((p) => ({
                      ...p,
                      wizard: {
                        ...p.wizard,
                        result: { ...p.wizard.result, disclaimer },
                      },
                    }))
                  }
                  multiline
                  className="text-sm text-slate-600"
                />
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex h-11 items-center rounded-2xl bg-gold px-4 text-sm font-semibold text-navy">
                    <Editable
                      value={copy.wizard.result.callCta}
                      onChange={(callCta) =>
                        patch((p) => ({
                          ...p,
                          wizard: {
                            ...p.wizard,
                            result: { ...p.wizard.result, callCta },
                          },
                        }))
                      }
                      as="span"
                    />
                  </span>
                  <span className="inline-flex h-11 items-center rounded-2xl bg-[#25D366] px-4 text-sm font-semibold text-white">
                    <Editable
                      value={copy.wizard.result.whatsappCta}
                      onChange={(whatsappCta) =>
                        patch((p) => ({
                          ...p,
                          wizard: {
                            ...p.wizard,
                            result: { ...p.wizard.result, whatsappCta },
                          },
                        }))
                      }
                      as="span"
                    />
                  </span>
                  <span className="inline-flex h-11 items-center rounded-2xl bg-navy px-4 text-sm font-semibold text-white">
                    <Editable
                      value={copy.wizard.result.saveCta}
                      onChange={(saveCta) =>
                        patch((p) => ({
                          ...p,
                          wizard: {
                            ...p.wizard,
                            result: { ...p.wizard.result, saveCta },
                          },
                        }))
                      }
                      as="span"
                    />
                  </span>
                </div>
              </div>
            </WizardBlock>
          </div>
        </section>

        {/* Packages */}
        <section className="border-t border-slate-200 bg-slate-50 py-12">
          <div className="mx-auto max-w-3xl px-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
              Package names &amp; blurbs
            </p>
            <div className="mt-6 space-y-4">
              {copy.packages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <p className="text-[11px] font-mono text-slate-400">{pkg.id}</p>
                  <Editable
                    value={pkg.name}
                    onChange={(name) =>
                      patch((p) => {
                        const packages = [
                          ...p.packages,
                        ] as HomepageCopy["packages"];
                        packages[index] = { ...packages[index], name };
                        return { ...p, packages };
                      })
                    }
                    as="h3"
                    className="mt-1 text-lg font-semibold"
                  />
                  <Editable
                    value={pkg.tagline}
                    onChange={(tagline) =>
                      patch((p) => {
                        const packages = [
                          ...p.packages,
                        ] as HomepageCopy["packages"];
                        packages[index] = { ...packages[index], tagline };
                        return { ...p, packages };
                      })
                    }
                    multiline
                    className="mt-1 text-sm text-slate-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-navy text-slate-300">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <Editable
              value={copy.footer.heading}
              onChange={(heading) =>
                patch((p) => ({ ...p, footer: { ...p.footer, heading } }))
              }
              className="max-w-md text-2xl font-semibold tracking-tight text-white"
            />
            <Editable
              value={copy.footer.body}
              onChange={(body) =>
                patch((p) => ({ ...p, footer: { ...p.footer, body } }))
              }
              multiline
              className="mt-3 max-w-md text-sm leading-6"
            />
            <div className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <Editable
                value={copy.footer.quoteLink}
                onChange={(quoteLink) =>
                  patch((p) => ({ ...p, footer: { ...p.footer, quoteLink } }))
                }
                as="span"
                className="hover:text-white"
              />
              <Editable
                value={copy.footer.blogLink}
                onChange={(blogLink) =>
                  patch((p) => ({ ...p, footer: { ...p.footer, blogLink } }))
                }
                as="span"
              />
              <Editable
                value={copy.footer.whatsappLabel}
                onChange={(whatsappLabel) =>
                  patch((p) => ({
                    ...p,
                    footer: { ...p.footer, whatsappLabel },
                  }))
                }
                as="span"
              />
              <Editable
                value={copy.footer.cities}
                onChange={(cities) =>
                  patch((p) => ({ ...p, footer: { ...p.footer, cities } }))
                }
                as="span"
              />
            </div>
          </div>
        </footer>
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

function WizardBlock({
  label,
  title,
  lead,
  onTitle,
  onLead,
  children,
}: {
  label: string;
  title: string;
  lead: string;
  onTitle: (v: string) => void;
  onLead: (v: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <Editable
        value={title}
        onChange={onTitle}
        as="h3"
        className="mt-2 text-xl font-semibold tracking-tight"
      />
      <Editable
        value={lead}
        onChange={onLead}
        multiline
        className="mt-2 text-sm leading-6 text-slate-600"
      />
      {children}
    </div>
  );
}

function ChoicePreview({
  title,
  body,
  onTitle,
  onBody,
}: {
  title: string;
  body: string;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <Editable
        value={title}
        onChange={onTitle}
        className="font-semibold text-navy"
      />
      <Editable
        value={body}
        onChange={onBody}
        multiline
        className="mt-1 text-sm text-slate-600"
      />
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
