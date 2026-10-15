import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid = false, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    aria-invalid={invalid || undefined}
    className={cn(
      'flex h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground',
      'placeholder:text-muted-foreground',
      'disabled:cursor-not-allowed disabled:opacity-50',
      invalid && 'border-destructive focus-visible:ring-destructive',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';
