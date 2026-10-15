import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid = false, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'flex min-h-[110px] w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground',
      'placeholder:text-muted-foreground',
      'disabled:cursor-not-allowed disabled:opacity-50',
      invalid && 'border-destructive',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
