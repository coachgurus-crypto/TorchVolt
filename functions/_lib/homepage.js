/**
 * Homepage copy helpers shared by /api/homepage.
 * Keep DEFAULT shape aligned with src/lib/homepageCopy.ts.
 */

export const DEFAULT_HOMEPAGE_COPY = {
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

function deepMerge(base, patch) {
  if (Array.isArray(base)) {
    return base.map((item, i) =>
      deepMerge(item, Array.isArray(patch) ? patch[i] : undefined),
    );
  }
  if (base && typeof base === "object") {
    const out = { ...base };
    const p = patch && typeof patch === "object" ? patch : {};
    for (const key of Object.keys(base)) {
      if (typeof base[key] === "string") {
        out[key] = typeof p[key] === "string" ? p[key] : base[key];
      } else {
        out[key] = deepMerge(base[key], p[key]);
      }
    }
    return out;
  }
  return base;
}

export function mergeHomepageCopy(raw) {
  return deepMerge(DEFAULT_HOMEPAGE_COPY, raw && typeof raw === "object" ? raw : {});
}
