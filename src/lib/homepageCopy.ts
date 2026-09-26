export type HomepageMetric = {
  label: string;
  value: string;
};

export type HomepageStep = {
  title: string;
  body: string;
};

export type HomepageCopy = {
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
};

export const DEFAULT_HOMEPAGE_COPY: HomepageCopy = {
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

/** Deep-merge saved JSON onto defaults; always returns a complete HomepageCopy. */
export function mergeHomepageCopy(raw: unknown): HomepageCopy {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const hero = src.hero && typeof src.hero === "object" ? (src.hero as Record<string, unknown>) : {};
  const how = src.how && typeof src.how === "object" ? (src.how as Record<string, unknown>) : {};
  const size = src.size && typeof src.size === "object" ? (src.size as Record<string, unknown>) : {};
  const example =
    src.example && typeof src.example === "object"
      ? (src.example as Record<string, unknown>)
      : {};

  const howSteps = Array.isArray(how.steps) ? how.steps : [];
  const exampleMetrics = Array.isArray(example.metrics) ? example.metrics : [];

  return {
    hero: {
      cities: asString(hero.cities, DEFAULT_HOMEPAGE_COPY.hero.cities),
      headline: asString(hero.headline, DEFAULT_HOMEPAGE_COPY.hero.headline),
      headlineAccent: asString(
        hero.headlineAccent,
        DEFAULT_HOMEPAGE_COPY.hero.headlineAccent,
      ),
      body: asString(hero.body, DEFAULT_HOMEPAGE_COPY.hero.body),
      primaryCta: asString(hero.primaryCta, DEFAULT_HOMEPAGE_COPY.hero.primaryCta),
      secondaryCta: asString(
        hero.secondaryCta,
        DEFAULT_HOMEPAGE_COPY.hero.secondaryCta,
      ),
    },
    how: {
      eyebrow: asString(how.eyebrow, DEFAULT_HOMEPAGE_COPY.how.eyebrow),
      heading: asString(how.heading, DEFAULT_HOMEPAGE_COPY.how.heading),
      steps: [
        mergeStep(DEFAULT_HOMEPAGE_COPY.how.steps[0], howSteps[0]),
        mergeStep(DEFAULT_HOMEPAGE_COPY.how.steps[1], howSteps[1]),
        mergeStep(DEFAULT_HOMEPAGE_COPY.how.steps[2], howSteps[2]),
      ],
    },
    size: {
      eyebrow: asString(size.eyebrow, DEFAULT_HOMEPAGE_COPY.size.eyebrow),
      heading: asString(size.heading, DEFAULT_HOMEPAGE_COPY.size.heading),
      body: asString(size.body, DEFAULT_HOMEPAGE_COPY.size.body),
    },
    example: {
      eyebrow: asString(example.eyebrow, DEFAULT_HOMEPAGE_COPY.example.eyebrow),
      title: asString(example.title, DEFAULT_HOMEPAGE_COPY.example.title),
      subtitle: asString(example.subtitle, DEFAULT_HOMEPAGE_COPY.example.subtitle),
      metrics: [
        mergeMetric(DEFAULT_HOMEPAGE_COPY.example.metrics[0], exampleMetrics[0]),
        mergeMetric(DEFAULT_HOMEPAGE_COPY.example.metrics[1], exampleMetrics[1]),
        mergeMetric(DEFAULT_HOMEPAGE_COPY.example.metrics[2], exampleMetrics[2]),
        mergeMetric(DEFAULT_HOMEPAGE_COPY.example.metrics[3], exampleMetrics[3]),
      ],
    },
  };
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
