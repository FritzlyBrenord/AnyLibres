// ============================================================================
// ROOT LAYOUT
// Layout principal de l'application
// ============================================================================

import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers/Providers";
import ImpersonationBanner from "@/components/ImpersonationBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AnyLibre - Plateforme Premium de Services Freelance",
  description:
    "Trouvez le prestataire parfait pour votre projet. Des milliers de professionnels qualifiés prêts à réaliser vos projets.",
  keywords:
    "freelance, services, prestataires, design, développement, marketing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        <ImpersonationBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
