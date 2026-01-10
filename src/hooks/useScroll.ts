// ============================================================================
// HOOK: useScroll
// Détecte la position du scroll
// ============================================================================

'use client';

import { useState, useEffect } from 'react';

export function useScroll(threshold: number = 100) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > threshold;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initial state
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, threshold]);

  return scrolled;
}