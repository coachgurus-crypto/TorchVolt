"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HomepageCopyProvider } from "@/lib/useHomepageCopy";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const studio = pathname === "/admin" || pathname.startsWith("/admin/");

  if (studio) {
    return <main className="min-h-full">{children}</main>;
  }

  return (
    <HomepageCopyProvider>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </HomepageCopyProvider>
  );
}
