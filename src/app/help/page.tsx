
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HelpCenter } from "@/components/help/HelpCenter";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <HelpCenter />
      <Footer />
    </main>
  );
}
