"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header variant="solid" disableBarSearch={true} />
      <main className="pt-16 lg:pt-20">{children}</main>
      <Footer />
    </>
  );
}
