"use client";

import { useState } from "react";
import { Languages, Loader2, RotateCcw } from "lucide-react";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";

interface TranslatedMessageTextProps {
  text: string;
  isAutoTranslateActive?: boolean;
  targetLanguage?: string;
  isOwn?: boolean;
}

export function TranslatedMessageText({
  text,
  isAutoTranslateActive = false,
  targetLanguage = "auto",
  isOwn = false,
}: TranslatedMessageTextProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [hasTriggeredManual, setHasTriggeredManual] = useState(false);

  // Determine if we should be translating
  const shouldTranslate = isAutoTranslateActive || (showTranslation && hasTriggeredManual);
  
  // Use the auto-translate hook
  const translated = useAutoTranslate(
    shouldTranslate ? text : undefined, 
    "auto",
    targetLanguage === "auto" ? undefined : targetLanguage
  );

  const handleToggleTranslation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showTranslation) {
      setHasTriggeredManual(true);
    }
    setShowTranslation(!showTranslation);
  };

  const displayIcon = () => {
    if (shouldTranslate && !translated && text) {
      return <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" />;
    }
    if (showTranslation && hasTriggeredManual) {
      return <RotateCcw className="w-3 h-3 inline-block ml-1 cursor-pointer hover:text-white" onClick={handleToggleTranslation} />;
    }
    return (
      <span title="Traduire le message">
        <Languages 
          className={`w-3 h-3 inline-block ml-1 cursor-pointer ${isOwn ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`} 
          onClick={handleToggleTranslation} 
        />
      </span>
    );
  };

  return (
    <div className="relative group/translate">
      <p className="text-sm whitespace-pre-wrap break-words">
        {shouldTranslate && translated ? translated : text}
      </p>
      
      {!isAutoTranslateActive && (
        <div className={`absolute top-0 ${isOwn ? '-left-6' : '-right-6'} opacity-0 group-hover/translate:opacity-100 transition-opacity`}>
          {displayIcon()}
        </div>
      )}
      
      {showTranslation && hasTriggeredManual && translated && translated !== text && (
        <p className={`text-[10px] mt-1 opacity-70 italic border-t pt-1 ${isOwn ? 'border-white/20' : 'border-slate-200'}`}>
          Original: {text.length > 30 ? text.substring(0, 30) + "..." : text}
        </p>
      )}
    </div>
  );
}
