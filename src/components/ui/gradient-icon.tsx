import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * NEXORA gradient icon system.
 *
 * A single brand gradient (purple -> blue -> cyan, top-left -> bottom-right)
 * is defined once as an SVG <linearGradient> sprite and injected at the root
 * layout. Every lucide icon is recolored via CSS `stroke: url(#id)` (see
 * globals.css). Because the gradient uses objectBoundingBox units with
 * percentage coordinates, this ONE definition scales to the bounding box of
 * every referencing icon — no per-instance ids are needed (per-instance defs
 * would duplicate identical markup for every icon on the page).
 *
 * The <GradientIcon /> wrapper is available for explicit per-usage control
 * (e.g. dynamic icon components) that must render the gradient stroke even
 * outside the global CSS scope.
 */

export const NEXORA_ICON_GRADIENT_ID = 'nexora-icon-gradient';

/** Brand gradient stops (top-left -> bottom-right). */
export const NEXORA_ICON_GRADIENT = {
  from: '#8B5CF6',
  mid: '#5B7CFA',
  to: '#00D4F5',
} as const;

/**
 * Hidden SVG sprite holding the shared gradient definition.
 * Render ONCE per page (in the root layout).
 * Uses h-0/w-0 instead of display:none so the gradient stays referenceable
 * in all browsers (Safari included) and works with SSR hydration.
 */
export function GradientIconDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute h-0 w-0 overflow-hidden"
    >
      <defs>
        <linearGradient
          id={NEXORA_ICON_GRADIENT_ID}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={NEXORA_ICON_GRADIENT.from} />
          <stop offset="50%" stopColor={NEXORA_ICON_GRADIENT.mid} />
          <stop offset="100%" stopColor={NEXORA_ICON_GRADIENT.to} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export interface GradientIconProps extends React.SVGProps<SVGSVGElement> {
  /** Lucide icon component to render with the brand gradient stroke. */
  icon: LucideIcon;
}

/**
 * Explicit gradient icon wrapper. Renders any lucide icon with the brand
 * gradient applied to its stroke, preserving the icon's own viewBox,
 * strokeWidth, line caps and alignment (all props pass through).
 */
export function GradientIcon({ icon: Icon, ...props }: GradientIconProps) {
  return <Icon stroke={`url(#${NEXORA_ICON_GRADIENT_ID})`} {...props} />;
}
