"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { MainNav } from "@/components/navigation/main-nav";
import { ScrollProgress } from "@/components/animations/scroll-progress";

/** The home page has its own menu bar — no site nav or scroll bar — and the white clinic footer; the
 *  other pages keep the standard chrome. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = pathname === "/";

  return (
    <>
      {!standalone && <ScrollProgress />}
      {!standalone && <MainNav />}
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <Footer light={standalone} />
    </>
  );
}
