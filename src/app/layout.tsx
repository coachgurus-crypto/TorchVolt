import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

export const metadata: Metadata = {
  title: {
    default: "Best Solar Installation Company in Ibadan | TorchVolt",
    template: "%s · TorchVolt",
  },
  description:
    "TorchVolt is a trusted solar installation company in Ibadan — also serving Lagos and Abuja. Size your system and get a free quote.",
  metadataBase: new URL("https://torchvolt.ng"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-navy">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
