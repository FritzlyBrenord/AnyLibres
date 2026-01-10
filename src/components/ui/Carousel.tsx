// ============================================================================
// Component: Carousel - Carrousel réutilisable pour slides de services
// Style Fiverr/Upwork avec navigation fluide
// ============================================================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/utils';

interface CarouselProps {
  children: React.ReactNode[];
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
  showNavigation?: boolean;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  className?: string;
}

export function Carousel({
  children,
  itemsPerView = { mobile: 1, tablet: 3, desktop: 5 },
  gap = 20,
  showNavigation = true,
  autoScroll = false,
  autoScrollInterval = 5000,
  className = '',
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(itemsPerView.desktop);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Responsive items per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsToShow(itemsPerView.mobile);
      } else if (width < 1024) {
        setItemsToShow(itemsPerView.tablet);
      } else {
        setItemsToShow(itemsPerView.desktop);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerView]);

  // Update scroll buttons state
  useEffect(() => {
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex < children.length - itemsToShow);
  }, [currentIndex, children.length, itemsToShow]);

  // Auto scroll
  useEffect(() => {
    if (!autoScroll) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= children.length - itemsToShow) {
          return 0; // Retour au début
        }
        return prev + 1;
      });
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, autoScrollInterval, children.length, itemsToShow]);

  const scroll = (direction: 'left' | 'right') => {
    setCurrentIndex(prev => {
      if (direction === 'left') {
        return Math.max(0, prev - itemsToShow);
      } else {
        return Math.min(children.length - itemsToShow, prev + itemsToShow);
      }
    });
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, children.length - itemsToShow)));
  };

  if (children.length === 0) {
    return null;
  }

  const totalDots = Math.ceil(children.length / itemsToShow);
  const currentDot = Math.floor(currentIndex / itemsToShow);

  return (
    <div className={cn('relative group', className)}>
      {/* Navigation Buttons */}
      {showNavigation && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 border border-slate-200"
          aria-label="Previous"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
      )}

      {showNavigation && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 border border-slate-200"
          aria-label="Next"
        >
          <ChevronRight className="w-6 h-6 text-slate-700" />
        </button>
      )}

      {/* Carousel Container */}
      <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
            gap: `${gap}px`,
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: `calc(${100 / itemsToShow}% - ${(gap * (itemsToShow - 1)) / itemsToShow}px)`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Dots Navigation */}
      {totalDots > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index * itemsToShow)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                currentDot === index
                  ? 'w-8 bg-indigo-600'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Variante compacte sans navigation
export function CarouselCompact({
  children,
  itemsPerView = { mobile: 2, tablet: 3, desktop: 5 },
  gap = 16,
  className = '',
}: Omit<CarouselProps, 'showNavigation' | 'autoScroll'>) {
  return (
    <Carousel
      itemsPerView={itemsPerView}
      gap={gap}
      showNavigation={false}
      className={className}
    >
      {children}
    </Carousel>
  );
}
