// ============================================================================
// Component: TranslationIndicator - Indicateur de traduction comme Fiverr
// Affiche un petit badge avec état de traduction et option de reload
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { Languages, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface TranslationIndicatorProps {
    isTranslating: boolean;
    hasError?: boolean;
    onRetry?: () => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function TranslationIndicator({
    isTranslating,
    hasError = false,
    onRetry,
    position = 'top-right'
}: TranslationIndicatorProps) {
    const [show, setShow] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (isTranslating) {
            setShow(true);
            setShowSuccess(false);
        } else if (hasError) {
            setShow(true);
            setShowSuccess(false);
        } else if (show && !isTranslating && !hasError) {
            // Afficher brièvement le succès
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setShow(false);
                setShowSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isTranslating, hasError, show]);

    if (!show) return null;

    const positionClasses = {
        'top-right': 'top-2 right-2',
        'top-left': 'top-2 left-2',
        'bottom-right': 'bottom-2 right-2',
        'bottom-left': 'bottom-2 left-2',
    };

    return (
        <div
            className={`absolute ${positionClasses[position]} z-10 animate-fade-in`}
        >
            <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-2 text-sm">
                {isTranslating && (
                    <>
                        <div className="relative">
                            <Languages className="w-4 h-4 text-blue-500 animate-pulse" />
                            <div className="absolute inset-0 animate-spin">
                                <RefreshCw className="w-4 h-4 text-blue-500/30" />
                            </div>
                        </div>
                        <span className="text-slate-700 font-medium">
                            Traduction...
                        </span>
                    </>
                )}

                {!isTranslating && hasError && (
                    <>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-slate-700 font-medium">
                            Échec traduction
                        </span>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="ml-1 p-1 hover:bg-slate-100 rounded transition-colors"
                                aria-label="Réessayer la traduction"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-blue-500 hover:rotate-180 transition-transform duration-300" />
                            </button>
                        )}
                    </>
                )}

                {!isTranslating && !hasError && (
                    <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-slate-700 font-medium">
                            Traduit
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
