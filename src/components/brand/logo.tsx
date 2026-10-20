import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * NEXORA brand assets.
 *
 * The official logo asset is not present in this repository yet. The geometric
 * ribbon "N" mark below is a faithful vector implementation of the approved
 * logo direction (cyan → blue → purple gradient ribbon) used as a stand-in.
 *
 * When the official asset is available, drop it in at:
 *   - public/brand/nexora-logo.svg       (full lockup: mark + wordmark + tagline)
 *   - public/brand/nexora-logo-dark.svg  (light-on-dark variant)
 *   - public/brand/nexora-mark.svg       (icon-only mark)
 * then simplify these components to render the official files instead.
 */

const GRADIENT_ID = 'nexora-brand-gradient';

function GradientDefs() {
  return (
    <defs>
      <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#30C0F0" />
        <stop offset="50%" stopColor="#6090F0" />
        <stop offset="100%" stopColor="#9048F0" />
      </linearGradient>
    </defs>
  );
}

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  /** Accessible label. Pass null when the mark is purely decorative. */
  title?: string | null;
}

/** Compact icon-only logo: geometric ribbon-inspired N. */
export function LogoMark({ title = 'NEXORA', className, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('h-9 w-9', className)}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title ?? undefined}
      {...props}
    >
      <GradientDefs />
      <path
        d="M7 27V5h4.6l13.4 15.2V5H29v22h-4.6L11 11.8V27H7z"
        fill={`url(#${GRADIENT_ID})`}
      />
    </svg>
  );
}

export interface LogoProps {
  /** Renders light text for use on dark surfaces. */
  tone?: 'onDark' | 'onLight';
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Hide the wordmark and render only the mark. */
  markOnly?: boolean;
}

const markSizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const;

const wordSizes = {
  sm: 'text-[18px]',
  md: 'text-[22px]',
  lg: 'text-[28px]',
} as const;

/** Full brand lockup: mark + NEXORA wordmark (+ optional tagline). */
export function Logo({
  tone = 'onDark',
  showTagline = false,
  size = 'md',
  className,
  markOnly = false,
}: LogoProps) {
  const textClass = tone === 'onDark' ? 'text-white' : 'text-foreground';
  const taglineClass = tone === 'onDark' ? 'text-white/50' : 'text-muted-foreground';

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark title={null} className={markSizes[size]} />
      {!markOnly && (
        <span className="flex flex-col items-start leading-none">
          <span
            dir="ltr"
            className={cn(
              'font-brand font-bold tracking-[0.5px] leading-none',
              wordSizes[size],
              textClass
            )}
          >
            NEXORA
          </span>
          {showTagline && (
            <span
              dir="ltr"
              className={cn(
                'mt-1 text-[10px] font-medium uppercase tracking-[2px] leading-none',
                taglineClass
              )}
            >
              AI Automation
            </span>
          )}
        </span>
      )}
    </span>
  );
}