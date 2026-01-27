"use client";

import { useState, useEffect, useRef } from "react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { Language } from "@/i18n/translations";
import { Globe, X } from "lucide-react";

export default function SimpleLanguageSwitcher() {
  const { language, setLanguage } = useSafeLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: "50%" });
  const switcherRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "es", label: "Español", flag: "🇪🇸" },
  ];

  // Centrage vertical intelligent
  useEffect(() => {
    const updatePosition = () => {
      if (switcherRef.current) {
        const rect = switcherRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const center = viewportHeight / 2 - rect.height / 2;
        setPosition({
          top: `${Math.max(20, Math.min(center, viewportHeight - rect.height - 20))}px`,
        });
      }
    };

    const handleScroll = () => {
      updatePosition();
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const currentLanguage = languages.find((lang) => lang.code === language);

  return (
    <div
      ref={switcherRef}
      className="fixed right-0 z-50"
      style={{ top: position.top, transform: "translateY(-50%)" }}
    >
      {/* 🔘 Bouton globe compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          group
          bg-gradient-to-br from-slate-800 to-slate-900
          text-white
          p-3
          rounded-l-xl
          cursor-pointer
          shadow-lg shadow-slate-900/30
          border border-slate-700
          transition-all duration-300
          hover:shadow-xl hover:shadow-slate-900/40
          hover:from-slate-700 hover:to-slate-800
          active:scale-95
        "
        aria-label="Changer la langue"
      >
        <div className="relative">
          <Globe className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
        </div>
      </button>

      {/* 🗂️ Panneau de sélection */}
      <div
        className={`
        absolute top-0 right-0
        transition-all duration-300 ease-out
        ${
          isOpen
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-full opacity-0 invisible"
        }
      `}
      >
        <div
          className="
          bg-gradient-to-b from-slate-900 to-slate-800
          border border-slate-700
          rounded-l-xl
          shadow-xl shadow-slate-900/50
          overflow-hidden
          ml-1
        "
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Langue</span>
            <button
              onClick={() => setIsOpen(false)}
              className="
                p-1 rounded
                hover:bg-slate-700/50
                transition-colors
              "
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Options */}
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2
                  flex items-center gap-2
                  text-sm
                  transition-colors
                  hover:bg-slate-700/50
                  ${language === lang.code ? "bg-slate-700/30" : ""}
                `}
              >
                <span className="text-base text-amber-200">{lang.flag}</span>
                <span className="text-slate-200">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay pour fermer */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
