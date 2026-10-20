import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'muted' | 'gradient' | 'live';

const variantClasses: Record<Variant, string> = {
  default: 'bg-secondary/80 text-secondary-foreground border border-transparent',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/15 text-warning-foreground border border-warning/30',
  danger: 'bg-destructive/10 text-destructive border border-destructive/20',
  outline: 'border border-white/[0.08] text-muted-foreground bg-transparent',
  muted: 'bg-muted/50 text-muted-foreground border border-transparent',
  gradient: 'bg-gradient-to-r from-[#30C0F0] to-[#9048F0] text-white border-0',
  live: 'bg-success/10 text-success border border-success/20',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label leading-none transition-all duration-200',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}