'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface TickerProps {
  /** Items to display in the ticker */
  items: React.ReactNode[];
  /** Animation duration in seconds */
  duration?: number;
  /** Whether to pause on hover */
  pauseOnHover?: boolean;
  /** Gap between items in pixels */
  gap?: number;
  /** Additional class names */
  className?: string;
}

export function Ticker({
  items,
  duration = 30,
  gap = 32,
  className,
}: TickerProps) {
  return (
    <div
      className={cn('overflow-hidden relative', className)}
      style={{ '--gap': `${gap}px` } as React.CSSProperties}
    >
      <div className="flex items-center" style={{ gap: `${gap}px` }}>
        {/* First set */}
        <div
          className="flex shrink-0 items-center justify-around"
          style={{ gap: `${gap}px`, animation: `ticker ${duration}s linear infinite` }}
        >
          {items.map((item, i) => (
            <div key={`ticker-1-${i}`} className="flex items-center gap-3 shrink-0">
              {item}
            </div>
          ))}
        </div>
        {/* Duplicate for seamless loop */}
        <div
          className="flex shrink-0 items-center justify-around"
          style={{ gap: `${gap}px`, animation: `ticker ${duration}s linear infinite` }}
          aria-hidden="true"
        >
          {items.map((item, i) => (
            <div key={`ticker-2-${i}`} className="flex items-center gap-3 shrink-0">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TickerRowProps {
  /** Items to display */
  items: React.ReactNode[];
  /** Animation direction */
  direction?: 'left' | 'right';
  /** Animation duration in seconds */
  duration?: number;
  /** Additional class names */
  className?: string;
}

export function TickerRow({
  items,
  direction = 'left',
  duration = 50,
  className,
}: TickerRowProps) {
  const animationStyle = {
    animationDirection: direction === 'right' ? 'reverse' : 'normal',
  };

  return (
    <div className={cn('overflow-hidden py-3', className)}>
      <div className="flex whitespace-nowrap" style={{ ...animationStyle, animation: `ticker ${duration}s linear infinite` }}>
        {items.map((item, i) => (
          <span key={`row-1-${i}`} className="mx-8 inline-flex items-center text-muted-foreground/60">
            {item}
          </span>
        ))}
        {items.map((item, i) => (
          <span key={`row-2-${i}`} className="mx-8 inline-flex items-center text-muted-foreground/60" aria-hidden="true">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}