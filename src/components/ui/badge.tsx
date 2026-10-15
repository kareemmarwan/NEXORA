import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'muted';

const variantClasses: Record<Variant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/15 text-warning-foreground border border-warning/30',
  danger: 'bg-destructive/10 text-destructive border border-destructive/20',
  outline: 'border border-border text-foreground',
  muted: 'bg-muted text-muted-foreground',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
