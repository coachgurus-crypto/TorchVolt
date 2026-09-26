export type HomepageMetric = {
  label: string;
  value: string;
};

export type HomepageStep = {
  title: string;
  body: string;
};

export type WizardScreenCopy = {
  title: string;
  lead: string;
};

export type PackageBlurb = {
  id: string;
  name: string;
  tagline: string;
};

export type HomepageCopy = {
  header: {
    blog: string;
    howItWorks: string;
    cta: string;
  };
  hero: {
    cities: string;
    headline: string;
    headlineAccent: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  how: {
    eyebrow: string;
    heading: string;
    steps: [HomepageStep, HomepageStep, HomepageStep];
  };
  size: {
    eyebrow: string;
    heading: string;
    body: string;
  };
  example: {
    eyebrow: string;
    title: string;
    subtitle: string;
    metrics: [HomepageMetric, HomepageMetric, HomepageMetric, HomepageMetric];
  };
  wizard: {
    who: WizardScreenCopy & {
      homeTitle: string;
      homeBody: string;
      shopTitle: string;
      shopBody: string;
    };
    city: WizardScreenCopy;
    grid: WizardScreenCopy & {
      titleShop: string;
    };
    loads: WizardScreenCopy & {
      emptyHint: string;
    };
    generator: WizardScreenCopy & {
      yesTitle: string;
      yesBody: string;
      noTitle: string;
      noBody: string;
    };
    result: WizardScreenCopy & {
      callCta: string;
      whatsappCta: string;
      saveCta: string;
      disclaimer: string;
    };
  };
  packages: [PackageBlurb, PackageBlurb, PackageBlurb, PackageBlurb];
  footer: {
    heading: string;
    body: string;
    quoteLink: string;
    blogLink: string;
    whatsappLabel: string;
    cities: string;
  };
};

export const DEFAULT_HOMEPAGE_COPY: HomepageCopy = {
  header: {
    blog: "Blog",
    howItWorks: "How it works",
    cta: "Get a free quote",
  },
  hero: {
    cities: "Ibadan · Lagos · Abuja",
    headline: "Solar that fits your home.",
    headlineAccent: "A clear quote next.",
    body: "Tell us what you need to keep running — fridge, fans, lights, AC — and we'll recommend a package, then send you a free quote.",
    primaryCta: "Get a free quote",
    secondaryCta: "How it works",
  },
  how: {
    eyebrow: "Simple steps",
    heading: "A few quick answers. Then your quote.",
    steps: [
      {
        title: "Pick what stays on",
        body: "Fridge, fans, lights, TV, pump, AC — whatever matters in your home or office.",
      },
      {
        title: "Tell us about power cuts",
        body: "All day, evenings only, or a shop that must stay open. That shapes the right package.",
      },
      {
        title: "Get a free quote",
        body: "We suggest a package that fits. A TorchVolt person follows up with clear pricing.",
      },
    ],
  },
  size: {
    eyebrow: "Free quote",
    heading: "What do you want to keep on?",
    body: "Pick the appliances for your home or office. We'll suggest a package that fits — then you can WhatsApp or call for your quote.",
  },
  example: {
    eyebrow: "Example home · not your quote yet",
    title: "A typical 3-bedroom evening",
    subtitle: "Fridge, fans, lights, decoder — and room for one AC when you need it.",
    metrics: [
      { label: "Keeps running", value: "Fridge & lights" },
      { label: "Comfort", value: "Fans + 1 AC" },
      { label: "Backup feel", value: "Through the night" },
      { label: "Suggested", value: "Family package" },
    ],
  },
  wizard: {
    who: {
      title: "Is this for a home or an office?",
      lead: "We'll only ask what matters for that place.",
      homeTitle: "A home",
      homeBody: "Flat, duplex or compound. Fridge, fans, lights, maybe AC and a pump.",
      shopTitle: "A shop or office",
      shopBody: "POS, lights, fans and fridge through business hours.",
    },
    city: {
      title: "Where should we install?",
      lead: "City helps us send the right team for your quote and installation.",
    },
    grid: {
      title: "How often does NEPA go out?",
      titleShop: "How often does power go out at the shop?",
      lead: "More outages usually means more battery backup in your package.",
    },
    loads: {
      title: "What must stay on when NEPA fails?",
      lead: "Tap each one, pick the size or HP if asked, then set how many and how long they run.",
      emptyHint: "Tap each appliance you want on solar. Then pick the size or HP where it asks.",
    },
    generator: {
      title: "Do you use a generator today?",
      lead: "If yes, roughly how many hours a day? That helps us plan your backup.",
      yesTitle: "Yes — diesel or petrol",
      yesBody: "We'll plan battery backup so you can run the generator less.",
      noTitle: "No generator",
      noBody: "Your solar package needs to cover outages on its own.",
    },
    result: {
      title: "Here's a package that fits",
      lead: "Call or WhatsApp for your free quote with today's prices.",
      callCta: "Call for your free quote",
      whatsappCta: "Get my quote on WhatsApp",
      saveCta: "Save my details",
      disclaimer:
        "This is a planning guide, not a final price. A TorchVolt person confirms the quote after looking at your place.",
    },
  },
  packages: [
    {
      id: "tv-3.5",
      name: "Compound Starter",
      tagline: "Lights, fans, fridge and decoder through the night.",
    },
    {
      id: "tv-5.0",
      name: "Family Hybrid 5kW",
      tagline: "The Lagos 3-bed default: 1.5HP AC + pump + fridge.",
    },
    {
      id: "tv-8.0",
      name: "Whole-Home 8kW",
      tagline: "Two ACs, borehole pump and all-day backup.",
    },
    {
      id: "tv-10",
      name: "Estate / Duplex 10kW",
      tagline: "Bigger homes — longer backup and a larger roof setup.",
    },
  ],
  footer: {
    heading: "Ready for solar at home or work? Talk to TorchVolt.",
    body: "We help Nigerian homes and offices get the right solar package — then a clear quote.",
    quoteLink: "Get a free quote",
    blogLink: "Blog",
    whatsappLabel: "WhatsApp",
    cities: "Ibadan · Lagos · Abuja",
  },
};

function asString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return value;
}

function mergeStep(base: HomepageStep, patch: unknown): HomepageStep {
  const p = patch && typeof patch === "object" ? (patch as Record<string, unknown>) : {};
  return {
    title: asString(p.title, base.title),
    body: asString(p.body, base.body),
  };
}

function mergeMetric(base: HomepageMetric, patch: unknown): HomepageMetric {
  const p = patch && typeof patch === "object" ? (patch as Record<string, unknown>) : {};
  return {
    label: asString(p.label, base.label),
    value: asString(p.value, base.value),
  };
}

function mergeBlurb(base: PackageBlurb, patch: unknown): PackageBlurb {
  const p = patch && typeof patch === "object" ? (patch as Record<string, unknown>) : {};
  return {
    id: asString(p.id, base.id),
    name: asString(p.name, base.name),
    tagline: asString(p.tagline, base.tagline),
  };
}

function mergeWizardScreen<T extends WizardScreenCopy>(
  base: T,
  patch: unknown,
  extra: (p: Record<string, unknown>) => Omit<T, keyof WizardScreenCopy>,
): T {
  const p = patch && typeof patch === "object" ? (patch as Record<string, unknown>) : {};
  return {
    title: asString(p.title, base.title),
    lead: asString(p.lead, base.lead),
    ...extra(p),
  } as T;
}

/** Deep-merge saved JSON onto defaults; always returns a complete HomepageCopy. */
export function mergeHomepageCopy(raw: unknown): HomepageCopy {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const header =
    src.header && typeof src.header === "object"
      ? (src.header as Record<string, unknown>)
      : {};
  const hero = src.hero && typeof src.hero === "object" ? (src.hero as Record<string, unknown>) : {};
  const how = src.how && typeof src.how === "object" ? (src.how as Record<string, unknown>) : {};
  const size = src.size && typeof src.size === "object" ? (src.size as Record<string, unknown>) : {};
  const example =
    src.example && typeof src.example === "object"
      ? (src.example as Record<string, unknown>)
      : {};
  const wizard =
    src.wizard && typeof src.wizard === "object"
      ? (src.wizard as Record<string, unknown>)
      : {};
  const footer =
    src.footer && typeof src.footer === "object"
      ? (src.footer as Record<string, unknown>)
      : {};

  const howSteps = Array.isArray(how.steps) ? how.steps : [];
  const exampleMetrics = Array.isArray(example.metrics) ? example.metrics : [];
  const packageBlurbs = Array.isArray(src.packages) ? src.packages : [];

  const d = DEFAULT_HOMEPAGE_COPY;

  return {
    header: {
      blog: asString(header.blog, d.header.blog),
      howItWorks: asString(header.howItWorks, d.header.howItWorks),
      cta: asString(header.cta, d.header.cta),
    },
    hero: {
      cities: asString(hero.cities, d.hero.cities),
      headline: asString(hero.headline, d.hero.headline),
      headlineAccent: asString(hero.headlineAccent, d.hero.headlineAccent),
      body: asString(hero.body, d.hero.body),
      primaryCta: asString(hero.primaryCta, d.hero.primaryCta),
      secondaryCta: asString(hero.secondaryCta, d.hero.secondaryCta),
    },
    how: {
      eyebrow: asString(how.eyebrow, d.how.eyebrow),
      heading: asString(how.heading, d.how.heading),
      steps: [
        mergeStep(d.how.steps[0], howSteps[0]),
        mergeStep(d.how.steps[1], howSteps[1]),
        mergeStep(d.how.steps[2], howSteps[2]),
      ],
    },
    size: {
      eyebrow: asString(size.eyebrow, d.size.eyebrow),
      heading: asString(size.heading, d.size.heading),
      body: asString(size.body, d.size.body),
    },
    example: {
      eyebrow: asString(example.eyebrow, d.example.eyebrow),
      title: asString(example.title, d.example.title),
      subtitle: asString(example.subtitle, d.example.subtitle),
      metrics: [
        mergeMetric(d.example.metrics[0], exampleMetrics[0]),
        mergeMetric(d.example.metrics[1], exampleMetrics[1]),
        mergeMetric(d.example.metrics[2], exampleMetrics[2]),
        mergeMetric(d.example.metrics[3], exampleMetrics[3]),
      ],
    },
    wizard: {
      who: mergeWizardScreen(d.wizard.who, wizard.who, (p) => ({
        homeTitle: asString(p.homeTitle, d.wizard.who.homeTitle),
        homeBody: asString(p.homeBody, d.wizard.who.homeBody),
        shopTitle: asString(p.shopTitle, d.wizard.who.shopTitle),
        shopBody: asString(p.shopBody, d.wizard.who.shopBody),
      })),
      city: mergeWizardScreen(d.wizard.city, wizard.city, () => ({})),
      grid: mergeWizardScreen(d.wizard.grid, wizard.grid, (p) => ({
        titleShop: asString(p.titleShop, d.wizard.grid.titleShop),
      })),
      loads: mergeWizardScreen(d.wizard.loads, wizard.loads, (p) => ({
        emptyHint: asString(p.emptyHint, d.wizard.loads.emptyHint),
      })),
      generator: mergeWizardScreen(d.wizard.generator, wizard.generator, (p) => ({
        yesTitle: asString(p.yesTitle, d.wizard.generator.yesTitle),
        yesBody: asString(p.yesBody, d.wizard.generator.yesBody),
        noTitle: asString(p.noTitle, d.wizard.generator.noTitle),
        noBody: asString(p.noBody, d.wizard.generator.noBody),
      })),
      result: mergeWizardScreen(d.wizard.result, wizard.result, (p) => ({
        callCta: asString(p.callCta, d.wizard.result.callCta),
        whatsappCta: asString(p.whatsappCta, d.wizard.result.whatsappCta),
        saveCta: asString(p.saveCta, d.wizard.result.saveCta),
        disclaimer: asString(p.disclaimer, d.wizard.result.disclaimer),
      })),
    },
    packages: [
      mergeBlurb(d.packages[0], packageBlurbs[0]),
      mergeBlurb(d.packages[1], packageBlurbs[1]),
      mergeBlurb(d.packages[2], packageBlurbs[2]),
      mergeBlurb(d.packages[3], packageBlurbs[3]),
    ],
    footer: {
      heading: asString(footer.heading, d.footer.heading),
      body: asString(footer.body, d.footer.body),
      quoteLink: asString(footer.quoteLink, d.footer.quoteLink),
      blogLink: asString(footer.blogLink, d.footer.blogLink),
      whatsappLabel: asString(footer.whatsappLabel, d.footer.whatsappLabel),
      cities: asString(footer.cities, d.footer.cities),
    },
  };
}

export function packageLabel(
  copy: HomepageCopy,
  packageId: string,
): { name: string; tagline: string } | null {
  return copy.packages.find((p) => p.id === packageId) ?? null;
}

export async function fetchHomepageCopy(): Promise<HomepageCopy> {
  try {
    const res = await fetch("/api/homepage");
    if (!res.ok) return DEFAULT_HOMEPAGE_COPY;
    const data = (await res.json()) as { copy?: unknown };
    return mergeHomepageCopy(data.copy);
  } catch {
    return DEFAULT_HOMEPAGE_COPY;
  }
}

export async function saveHomepageCopy(
  pin: string,
  copy: HomepageCopy,
): Promise<HomepageCopy> {
  const res = await fetch("/api/homepage", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Pin": pin,
    },
    body: JSON.stringify({ copy }),
  });
  const data = (await res.json()) as { copy?: unknown; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not save homepage copy");
  return mergeHomepageCopy(data.copy);
}
