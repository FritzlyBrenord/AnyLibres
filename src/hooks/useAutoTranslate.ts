// ============================================================================
// Hook: useAutoTranslate - Traduction automatique des contenus dynamiques
// Traduit automatiquement selon la langue choisie par l'utilisateur
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useSafeLanguage } from '@/hooks/useSafeLanguage';
import type { MultiLangText } from '@/types';

interface TranslationCache {
    [key: string]: string;
}

// Cache global pour éviter les traductions répétées
const translationCache: TranslationCache = {};

/**
 * Hook pour traduire automatiquement un contenu multilingue
 * @param content - Contenu à traduire (MultiLangText ou string)
 * @param sourceLang - Langue source (optionnel, 'auto' par défaut)
 * @returns Le texte traduit dans la langue actuelle
 */
export function useAutoTranslate(
    content: MultiLangText | string | undefined,
    sourceLang: string = 'auto',
    targetLang?: string
): string {
    const { language: appLanguage } = useSafeLanguage();
    const language = targetLang || appLanguage;
    const [translatedText, setTranslatedText] = useState<string>('');
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        async function translateContent() {
            // Si le contenu est undefined ou vide
            if (!content) {
                setTranslatedText('');
                return;
            }

            // Si c'est une string simple, la traduire
            if (typeof content === 'string') {
                const cacheKey = `${content}_${language}`;

                // Vérifier le cache
                if (translationCache[cacheKey]) {
                    setTranslatedText(translationCache[cacheKey]);
                    return;
                }

                // Traduire
                setIsTranslating(true);
                try {
                    const response = await fetch('/api/translate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text: content,
                            targetLang: language,
                            sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
                        }),
                    });

                    const data = await response.json();
                    const translated = data.translatedText || content;

                    // Mettre en cache
                    translationCache[cacheKey] = translated;
                    setTranslatedText(translated);
                } catch (error) {
                    console.error('Translation error:', error);
                    setTranslatedText(content); // Fallback sur le texte original
                } finally {
                    setIsTranslating(false);
                }
                return;
            }

            // Si c'est un objet MultiLangText
            const multiLangContent = content as any;

            // Si la traduction existe déjà dans la langue demandée
            if (multiLangContent[language]) {
                setTranslatedText(multiLangContent[language]!);
                return;
            }

            // Sinon, prendre la première langue disponible et traduire
            const availableLang = multiLangContent.fr || multiLangContent.en || multiLangContent.es || '';

            if (!availableLang) {
                setTranslatedText('');
                return;
            }

            const cacheKey = `${availableLang}_${language}`;

            // Vérifier le cache
            if (translationCache[cacheKey]) {
                setTranslatedText(translationCache[cacheKey]);
                return;
            }

            // Traduire
            setIsTranslating(true);
            try {
                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: availableLang,
                        targetLang: language,
                        sourceLang: 'auto',
                    }),
                });

                const data = await response.json();
                const translated = data.translatedText || availableLang;

                // Mettre en cache
                translationCache[cacheKey] = translated;
                setTranslatedText(translated);
            } catch (error) {
                console.error('Translation error:', error);
                setTranslatedText(availableLang); // Fallback
            } finally {
                setIsTranslating(false);
            }
        }

        translateContent();
    }, [content, language, sourceLang]);

    return translatedText;
}

/**
 * Hook pour obtenir l'état de traduction
 */
export function useTranslationStatus(content: MultiLangText | string | undefined): {
    isTranslating: boolean;
    hasTranslation: boolean;
} {
    const { language } = useSafeLanguage();
    const [isTranslating, setIsTranslating] = useState(false);

    if (!content) {
        return { isTranslating: false, hasTranslation: false };
    }

    if (typeof content === 'string') {
        return { isTranslating, hasTranslation: true };
    }

    const multiLangContent = content as any;
    const hasTranslation = !!multiLangContent[language];

    return { isTranslating, hasTranslation };
}
