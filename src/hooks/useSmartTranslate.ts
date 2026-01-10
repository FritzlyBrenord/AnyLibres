// ============================================================================
// Hook: useSmartTranslate - Traduction intelligente avec gestion d'état
// Version améliorée de useAutoTranslate avec état de traduction et retry
// ============================================================================

'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { useSafeLanguage } from '@/hooks/useSafeLanguage';
import { useTranslationTracking } from '@/components/translation/GlobalTranslationIndicator';
import type { MultiLangText } from '@/types';

interface TranslationCache {
    [key: string]: string;
}

// Cache global pour éviter les traductions répétées
const translationCache: TranslationCache = {};

// Fonction pour vider le cache (utile pour déboguer)
if (typeof window !== 'undefined') {
    (window as any).clearTranslationCache = () => {
        Object.keys(translationCache).forEach(key => delete translationCache[key]);
        console.log('[useSmartTranslate] Cache cleared');
    };
}

// Queue pour gérer les traductions et éviter le rate limiting
let translationQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;
const DELAY_BETWEEN_TRANSLATIONS = 500; // 500ms de délai entre chaque traduction

async function processTranslationQueue() {
    if (isProcessingQueue || translationQueue.length === 0) return;

    isProcessingQueue = true;

    while (translationQueue.length > 0) {
        const translateFn = translationQueue.shift();
        if (translateFn) {
            await translateFn();
            // Attendre avant la prochaine traduction
            if (translationQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TRANSLATIONS));
            }
        }
    }

    isProcessingQueue = false;
}

interface UseSmartTranslateResult {
    translatedText: string;
    isTranslating: boolean;
    hasError: boolean;
    retry: () => void;
}

/**
 * Hook pour traduire automatiquement un contenu avec gestion d'état
 * @param content - Contenu à traduire (MultiLangText ou string)
 * @param sourceLang - Langue source (optionnel, 'auto' par défaut)
 * @returns Objet avec texte traduit, état de chargement, erreur et fonction retry
 */
export function useSmartTranslate(
    content: MultiLangText | string | undefined,
    sourceLang: string = 'auto'
): UseSmartTranslateResult {
    const { language } = useSafeLanguage();
    const { registerTranslation, unregisterTranslation, setTranslationError } = useTranslationTracking();
    const translationId = useId();

    // Initialiser avec le contenu original pour éviter un texte vide
    const getInitialText = () => {
        if (!content) return '';
        if (typeof content === 'string') return content;
        const multiLang = content as MultiLangText;
        return multiLang.fr || multiLang.en || multiLang.es || '';
    };

    const [translatedText, setTranslatedText] = useState<string>(getInitialText());
    const [isTranslating, setIsTranslating] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [retryTrigger, setRetryTrigger] = useState(0);
    const [currentLanguage, setCurrentLanguage] = useState(language);

    const retry = useCallback(() => {
        setRetryTrigger(prev => prev + 1);
        setHasError(false);
    }, []);

    // Réinitialiser le texte traduit quand la langue change
    useEffect(() => {
        if (currentLanguage !== language) {
            console.log('[useSmartTranslate] Language changed:', { from: currentLanguage, to: language });
            setCurrentLanguage(language);
            setTranslatedText(getInitialText());
            setIsTranslating(false);
            setHasError(false);
        }
    }, [language, currentLanguage]);

    useEffect(() => {
        let isCancelled = false;

        async function translateContent() {
            // Si le contenu est undefined ou vide
            if (!content) {
                setTranslatedText('');
                setIsTranslating(false);
                setHasError(false);
                return;
            }

            // Si c'est une string simple
            if (typeof content === 'string') {
                const cacheKey = `${content}_${language}`;

                console.log('[useSmartTranslate] Processing:', {
                    contentPreview: content.substring(0, 30) + '...',
                    targetLang: language,
                    cacheKey: cacheKey.substring(0, 50) + '...',
                    inCache: !!translationCache[cacheKey],
                });

                // Vérifier le cache
                if (translationCache[cacheKey]) {
                    console.log('[useSmartTranslate] Using cached translation');
                    setTranslatedText(translationCache[cacheKey]);
                    setIsTranslating(false);
                    setHasError(false);
                    return;
                }

                // Note: On laisse l'API détecter automatiquement la langue source
                // L'API retournera le texte original si la langue cible = langue source

                // Lancer la traduction avec queue pour éviter le rate limiting
                setIsTranslating(true);
                setHasError(false);
                registerTranslation(translationId);

                // Ajouter à la queue
                const performTranslation = async () => {
                    if (isCancelled) return;

                    try {
                        console.log('[useSmartTranslate] Translating:', {
                            text: content.substring(0, 50) + '...',
                            targetLang: language,
                            sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
                        });

                        const response = await fetch('/api/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: content,
                                targetLang: language,
                                sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
                            }),
                        });

                        if (!response.ok) {
                            throw new Error('Translation API failed');
                        }

                        const data = await response.json();
                        const translated = data.translatedText || content;

                        console.log('[useSmartTranslate] Translation result:', {
                            original: content.substring(0, 30) + '...',
                            translated: translated.substring(0, 30) + '...',
                            detectedLang: data.detectedSourceLang,
                            targetLang: language,
                        });

                        if (!isCancelled) {
                            // Mettre en cache
                            translationCache[cacheKey] = translated;
                            setTranslatedText(translated);
                            setIsTranslating(false);
                            setHasError(false);
                            unregisterTranslation(translationId);
                        }
                    } catch (error) {
                        console.error('Translation error:', error);
                        if (!isCancelled) {
                            setTranslatedText(content); // Fallback sur le texte original
                            setIsTranslating(false);
                            setHasError(true);
                            setTranslationError(translationId, true);
                            unregisterTranslation(translationId);
                        }
                    }
                };

                // Ajouter à la queue et démarrer le traitement
                translationQueue.push(performTranslation);
                processTranslationQueue();
                return;
            }

            // Si c'est un objet MultiLangText
            const multiLangContent = content as MultiLangText;

            // Prendre n'importe quelle langue disponible comme source
            // On ne fait PAS confiance à la clé de langue car le contenu peut être dans une autre langue
            const availableLang = multiLangContent.fr || multiLangContent.en || multiLangContent.es || '';

            if (!availableLang) {
                setTranslatedText('');
                setIsTranslating(false);
                setHasError(false);
                return;
            }

            const cacheKey = `${availableLang}_${language}`;

            // Vérifier le cache
            if (translationCache[cacheKey]) {
                console.log('[useSmartTranslate] Using cached translation for MultiLangText');
                setTranslatedText(translationCache[cacheKey]);
                setIsTranslating(false);
                setHasError(false);
                return;
            }

            // Traduire en détectant automatiquement la langue source
            setIsTranslating(true);
            setHasError(false);
            registerTranslation(translationId);

            try {
                console.log('[useSmartTranslate] Translating MultiLangText:', {
                    text: availableLang.substring(0, 30) + '...',
                    targetLang: language,
                    sourceLang: 'auto (detecting)',
                });

                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: availableLang,
                        targetLang: language,
                        sourceLang: 'auto', // Détecter automatiquement la vraie langue
                    }),
                });

                if (!response.ok) {
                    throw new Error('Translation API failed');
                }

                const data = await response.json();
                const translated = data.translatedText || availableLang;

                if (!isCancelled) {
                    // Mettre en cache
                    translationCache[cacheKey] = translated;
                    setTranslatedText(translated);
                    setIsTranslating(false);
                    setHasError(false);
                    unregisterTranslation(translationId);
                }
            } catch (error) {
                console.error('Translation error:', error);
                if (!isCancelled) {
                    setTranslatedText(availableLang); // Fallback
                    setIsTranslating(false);
                    setHasError(true);
                    setTranslationError(translationId, true);
                    unregisterTranslation(translationId);
                }
            }
        }

        translateContent();

        return () => {
            isCancelled = true;
        };
    }, [content, language, sourceLang, retryTrigger]);

    return {
        translatedText,
        isTranslating,
        hasError,
        retry,
    };
}
