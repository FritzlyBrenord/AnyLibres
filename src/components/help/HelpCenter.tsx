"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, User, Briefcase, Info } from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { ContactForm } from "./ContactForm";
import { ChatAssistant } from "./ChatAssistant";
import { cn } from "@/utils/utils";

export function HelpCenter() {
  const { t } = useSafeLanguage();
  const [activeTab, setActiveTab] = useState<"client" | "provider" | "general">("general");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const CONTACT_SECTION_ID = "contact-section";

  const scrollToContact = () => {
    document.getElementById(CONTACT_SECTION_ID)?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredFaq = t.help.faq.items.filter((item: any) =>
    item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 px-4 mb-12">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">{t.help.title}</h1>
          <p className="text-xl text-slate-300">{t.help.subtitle}</p>
          
          <div className="relative max-w-2xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t.help.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:bg-white/20 focus:border-white/40 transition-all outline-none backdrop-blur-xl"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Tabs */}
            <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
              {[
                { id: "general", label: t.help.tabs.general, icon: Info },
                { id: "client", label: t.help.tabs.client, icon: User },
                { id: "provider", label: t.help.tabs.provider, icon: Briefcase },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content based on Tab */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900">{t.help.general.title}</h2>
                  <p className="text-slate-600 leading-relaxed">{t.help.general.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {t.help.general.features.map((feature: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-600">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "client" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900">{t.help.client.title}</h2>
                  <div className="space-y-6">
                    {t.help.client.steps.map((step: any, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{step.title}</h3>
                          <p className="text-slate-600">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "provider" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900">{t.help.provider.title}</h2>
                  <div className="space-y-6">
                    {t.help.provider.steps.map((step: any, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{step.title}</h3>
                          <p className="text-slate-600">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {t.help.provider.steps[4]?.button && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <a href="/become-provider" className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-slate-700">
                            {t.help.provider.steps[4].button}
                        </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FAQ Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 pl-2">{t.help.faq.title}</h2>
              <div className="space-y-3">
                {filteredFaq.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left font-medium text-slate-900"
                    >
                      {item.q}
                      {openFaq === i ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-slate-600 animate-slide-down">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
                {filteredFaq.length === 0 && (
                   <p className="text-slate-500 italic p-4">Aucun résultat trouvé pour votre recherche.</p>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div id={CONTACT_SECTION_ID}>
               <ContactForm />
            </div>
            
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg bg-[url('/grid.svg')]">
              <h3 className="text-xl font-bold mb-2">Besoin d'aide urgente ?</h3>
              <p className="text-indigo-100 mb-6">Notre équipe de support est disponible 24/7 pour vous assister.</p>
              <button 
                onClick={scrollToContact}
                className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
              >
                {t.help.chat.agentButton}
              </button>
            </div>
          </div>

        </div>
      </div>
      
      <ChatAssistant requestsContact={scrollToContact} />
    </div>
  );
}
