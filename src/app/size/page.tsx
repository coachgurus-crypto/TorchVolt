import type { Metadata } from "next";
import { SizerWizard } from "@/components/sizer/SizerWizard";

export const metadata: Metadata = {
  title: "Estimate your power need",
};

export default function SizePage() {
  return <SizerWizard />;
}
