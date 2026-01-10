// ============================================================================
// Component: GlobalTranslationIndicator - Indicateur de traduction global
// Un seul indicateur pour toute l'application (style Fiverr)
// ============================================================================

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Languages, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useSafeLanguage } from '@/hooks/useSafeLanguage';

// Context pour gérer l'état global de traduction
interface TranslationContextType {
    registerTranslation: (id: string) => void;
    unregisterTranslation: (id: string) => void;
    setTranslationError: (id: string, hasError: boolean) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
    const [activeTranslations, setActiveTranslations] = useState<Set<string>>(new Set());
    const [errorTranslations, setErrorTranslations] = useState<Set<string>>(new Set());

    const registerTranslation = (id: string) => {
        setActiveTranslations(prev => new Set(prev).add(id));
    };

    const unregisterTranslation = (id: string) => {
        setActiveTranslations(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        setErrorTranslations(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const setTranslationError = (id: string, hasError: boolean) => {
        setErrorTranslations(prev => {
            const next = new Set(prev);
            if (hasError) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    };

    return (
        <TranslationContext.Provider value={{ registerTranslation, unregisterTranslation, setTranslationError }}>
            {children}
            <GlobalTranslationIndicator
                isTranslating={activeTranslations.size > 0}
                hasError={errorTranslations.size > 0}
                count={activeTranslations.size}
            />
        </TranslationContext.Provider>
    );
}

export function useTranslationTracking() {
    const context = useContext(TranslationContext);
    if (!context) {
        // Si pas de provider, retourner des fonctions vides
        return {
            registerTranslation: () => {},
            unregisterTranslation: () => {},
            setTranslationError: () => {},
        };
    }
    return context;
}

// Composant visuel de l'indicateur
interface GlobalTranslationIndicatorProps {
    isTranslating: boolean;
    hasError: boolean;
    count: number;
}

function GlobalTranslationIndicator({ isTranslating, hasError, count }: GlobalTranslationIndicatorProps) {
    const { t } = useSafeLanguage();
    const [show, setShow] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (isTranslating) {
            setShow(true);
            setShowSuccess(false);
            setDismissed(false);
        } else if (hasError) {
            setShow(true);
            setShowSuccess(false);
            setDismissed(false);
        } else if (show && !isTranslating && !hasError && !dismissed) {
            // Afficher brièvement le succès
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setShow(false);
                setShowSuccess(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isTranslating, hasError, show, dismissed]);

    if (!show || dismissed) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            <div className="bg-white shadow-2xl rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3 min-w-[280px]">
                {/* Icône et statut */}
                {isTranslating && (
                    <>
                        <div className="relative flex-shrink-0">
                            <Languages className="w-5 h-5 text-blue-500 animate-pulse" />
                            <div className="absolute inset-0 animate-spin">
                                <RefreshCw className="w-5 h-5 text-blue-500/30" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                                {t.translation.inProgress}
                            </p>
                            <p className="text-xs text-slate-500">
                                {count} {count > 1 ? t.translation.elements : t.translation.element} {t.translation.inProgressCount}
                            </p>
                        </div>
                    </>
                )}

                {!isTranslating && hasError && (
                    <>
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                                {t.translation.error}
                            </p>
                            <p className="text-xs text-slate-500">
                                {t.translation.errorMessage}
                            </p>
                        </div>
                    </>
                )}

                {!isTranslating && !hasError && showSuccess && (
                    <>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                                {t.translation.completed}
                            </p>
                            <p className="text-xs text-slate-500">
                                {t.translation.completedSuccess}
                            </p>
                        </div>
                    </>
                )}

                {/* Bouton fermer */}
                <button
                    onClick={() => setDismissed(true)}
                    className="flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors"
                    aria-label="Fermer"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
}
