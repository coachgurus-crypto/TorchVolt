import type { Metadata } from "next";
import { HomePageContent } from "@/components/home/HomePageContent";
import { BRAND } from "@/lib/constants";

const TITLE = "Best Solar Installation Company in Ibadan | TorchVolt";
const DESCRIPTION =
  "TorchVolt is a trusted solar installation company in Ibadan — also serving Lagos and Abuja. Size your home or office system and get a free, clear quote.";

export const metadata: Metadata = {
  title: {
    absolute: TITLE,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: "https://torchvolt.ng/",
  },
  openGraph: {
    type: "website",
    url: "https://torchvolt.ng/",
    siteName: BRAND.name,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  keywords: [
    "best solar installation company in Ibadan",
    "solar installation company in Ibadan",
    "solar installers Ibadan",
    "solar for home Ibadan",
    "TorchVolt",
  ],
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: "TorchVolt",
  description: DESCRIPTION,
  url: "https://torchvolt.ng/",
  telephone: `+${BRAND.phoneE164}`,
  areaServed: [
    { "@type": "City", name: "Ibadan" },
    { "@type": "City", name: "Lagos" },
    { "@type": "City", name: "Abuja" },
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ibadan",
    addressCountry: "NG",
  },
  sameAs: [`https://wa.me/${BRAND.whatsappE164}`],
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: "Solar installation",
      areaServed: "Ibadan",
      description:
        "Home and office solar sizing, installation, and free quotes in Ibadan, Lagos, and Abuja.",
    },
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HomePageContent />
    </>
  );
}
