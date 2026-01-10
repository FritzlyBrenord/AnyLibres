"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full">
        <Header disableScrollEffect={true} />
        <div>{children}</div>
        <Footer />
      </div>
    </div>
  );
}
