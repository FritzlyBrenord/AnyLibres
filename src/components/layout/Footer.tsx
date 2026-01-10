// ============================================================================
// LAYOUT: Footer Premium
// Footer amélioré avec design premium
// ============================================================================

"use client";

import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  ArrowRight,
  Heart,
} from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

export function Footer() {
  const { t } = useSafeLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Logo className="text-white mb-4" />
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {t?.footer?.tagline || 'La plateforme premium qui connecte clients et prestataires de qualité.'}
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, label: "Facebook", href: "#" },
                { icon: Twitter, label: "Twitter", href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Linkedin, label: "LinkedIn", href: "#" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              {t?.footer?.services?.title || 'Services'}
            </h3>
            <ul className="space-y-3">
              {[
                { name: t?.footer?.services?.allCategories || 'Toutes les catégories', href: "/categories" },
                { name: t?.footer?.services?.searchService || 'Rechercher un service', href: "/search" },
                { name: t?.footer?.services?.findProvider || 'Trouver un prestataire', href: "/providers" },
                { name: t?.footer?.services?.becomeProvider || 'Devenir prestataire', href: "/become-provider" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              {t?.footer?.support?.title || 'Support'}
            </h3>
            <ul className="space-y-3">
              {[
                { name: t?.footer?.support?.about || 'À propos', href: "/about" },
                { name: t?.footer?.support?.faq || 'FAQ', href: "/about/faq" },
                { name: t?.footer?.support?.contact || 'Contact', href: "/about/contact" },
                { name: t?.footer?.support?.helpCenter || "Centre d'aide", href: "/help" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              {t?.footer?.legal?.title || 'Légal'}
            </h3>
            <ul className="space-y-3">
              {[
                { name: t?.footer?.legal?.terms || "Conditions d'utilisation", href: "/terms" },
                { name: t?.footer?.legal?.privacy || 'Politique de confidentialité', href: "/privacy" },
                { name: t?.footer?.legal?.cookies || 'Cookies', href: "/cookies" },
                { name: t?.footer?.legal?.security || 'Sécurité', href: "/security" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-xl text-white mb-2">
                {t?.footer?.newsletter?.title || 'Restez informé'}
              </h3>
              <p className="text-slate-300 text-sm">
                {t?.footer?.newsletter?.subtitle || 'Recevez les dernières actualités et offres exclusives'}
              </p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder={t?.footer?.newsletter?.placeholder || 'Votre email'}
                className="flex-1 lg:w-80 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg whitespace-nowrap">
                {t?.footer?.newsletter?.subscribe || "S'abonner"}
                <Mail className="w-4 h-4 ml-2 inline" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <span>© {currentYear} AnyLibre. {t?.footer?.bottom?.rights || 'Tous droits réservés.'}</span>
            <span className="text-slate-500">•</span>
            <span className="flex items-center gap-1">
              {t?.footer?.bottom?.madeWith || 'Fait avec'} <Heart className="w-4 h-4 text-red-400 fill-current" />{" "}
              {t?.footer?.bottom?.in || 'en Haïti'}
            </span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link
              href="/sitemap"
              className="text-slate-300 hover:text-white transition-colors duration-300"
            >
              {t?.footer?.bottom?.sitemap || 'Plan du site'}
            </Link>
            <Link
              href="/accessibility"
              className="text-slate-300 hover:text-white transition-colors duration-300"
            >
              {t?.footer?.bottom?.accessibility || 'Accessibilité'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
