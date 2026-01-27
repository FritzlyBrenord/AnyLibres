import { useEffect, useState } from 'react';
import { useSmartTranslate } from '@/hooks/useSmartTranslate';
import { Loader2 } from 'lucide-react';

interface TranslatedTextProps {
  text: string | null | undefined;
  className?: string; // Class for the wrapper (span/div) or the text itself
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; // Tag to render
  showLoading?: boolean; // Whether to show a loader icon while translating
  sourceLang?: string; // Optional source language hint
}

/**
 * Component that displays text and automatically translates it to the current language.
 * Uses useSmartTranslate hook.
 */
export default function TranslatedText({
  text,
  className = '',
  as: Component = 'span',
  showLoading = false,
  sourceLang = 'auto'
}: TranslatedTextProps) {
  const { translatedText, isTranslating, hasError } = useSmartTranslate(text, sourceLang);
  
  // If no text provided, render nothing
  if (!text) return null;

  return (
    <Component className={`${className} ${isTranslating ? 'animate-pulse' : ''}`}>
      {translatedText}
      {showLoading && isTranslating && (
        <span className="inline-block ml-2 align-text-bottom">
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
        </span>
      )}
    </Component>
  );
}
