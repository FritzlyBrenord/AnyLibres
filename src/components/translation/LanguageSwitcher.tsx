// ============================================================================
// Component: LanguageSwitcher - Sélecteur de langue
// Permet de changer rapidement la langue de l'interface
// ============================================================================

'use client';

import { useState } from 'react';
import { Languages, Check } from 'lucide-react';
import { useSafeLanguage } from '@/hooks/useSafeLanguage';
import type { Language } from '@/i18n/translations';

const languages = [
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
];

export function LanguageSwitcher() {
    const { language, setLanguage } = useSafeLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

    return (
        <div className="relative">
            {/* Bouton principal */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                aria-label="Changer de langue"
            >
                <Languages className="w-4 h-4 text-slate-600" />
                <span className="text-2xl">{currentLanguage.flag}</span>
                <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                    {currentLanguage.name}
                </span>
            </button>

            {/* Menu déroulant */}
            {isOpen && (
                <>
                    {/* Overlay pour fermer */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${
                                    language === lang.code ? 'bg-purple-50' : ''
                                }`}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="flex-1 text-left text-sm font-medium text-slate-700">
                                    {lang.name}
                                </span>
                                {language === lang.code && (
                                    <Check className="w-4 h-4 text-purple-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
