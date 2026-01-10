"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";

interface InfoTooltipProps {
  title?: string;
  content: string | React.ReactNode;
  examples?: string[];
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function InfoTooltip({
  title,
  content,
  examples = [],
  position = "top",
  className = "",
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-blue-600 transition-colors ml-1.5 focus:outline-none"
        aria-label="Plus d'informations"
      >
        <Info className="w-4 h-4" />
      </button>

      {/* Tooltip Content */}
      {isOpen && (
        <>
          {/* Mobile: Full screen overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Tooltip Card */}
          <div
            className={`
              fixed md:absolute z-50 
              inset-x-4 bottom-4 md:inset-auto
              md:w-96 
              bg-white rounded-xl shadow-2xl border border-gray-200
              animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-bottom-0
              ${position === "top" ? "md:bottom-full md:mb-2" : ""}
              ${position === "bottom" ? "md:top-full md:mt-2" : ""}
              ${position === "left" ? "md:right-full md:mr-2" : ""}
              ${position === "right" ? "md:left-full md:ml-2" : ""}
              md:left-1/2 md:-translate-x-1/2
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-blue-600">💡</span>
                  {title}
                </h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-4 max-h-[70vh] md:max-h-96 overflow-y-auto">
              {/* Main Content */}
              <div className="text-sm text-gray-700 leading-relaxed mb-3">
                {content}
              </div>

              {/* Examples */}
              {examples.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Exemples
                  </p>
                  <div className="space-y-2">
                    {examples.map((example, index) => {
                      const isGood = example.startsWith("✅");
                      const isBad = example.startsWith("❌");
                      const isInfo = example.startsWith("💡") || example.startsWith("📝") || example.startsWith("💎") || example.startsWith("📋") || example.startsWith("📸") || example.startsWith("🎥");

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg text-sm ${
                            isGood
                              ? "bg-green-50 border border-green-200 text-green-900"
                              : isBad
                              ? "bg-red-50 border border-red-200 text-red-900"
                              : isInfo
                              ? "bg-blue-50 border border-blue-200 text-blue-900"
                              : "bg-gray-50 border border-gray-200 text-gray-900"
                          }`}
                        >
                          {example}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Arrow (only on desktop) */}
            <div
              className={`
                hidden md:block absolute w-3 h-3 bg-white border border-gray-200 rotate-45
                ${position === "top" ? "bottom-[-7px] left-1/2 -translate-x-1/2 border-t-0 border-l-0" : ""}
                ${position === "bottom" ? "top-[-7px] left-1/2 -translate-x-1/2 border-b-0 border-r-0" : ""}
                ${position === "left" ? "right-[-7px] top-1/2 -translate-y-1/2 border-l-0 border-b-0" : ""}
                ${position === "right" ? "left-[-7px] top-1/2 -translate-y-1/2 border-r-0 border-t-0" : ""}
              `}
            />
          </div>
        </>
      )}
    </div>
  );
}
