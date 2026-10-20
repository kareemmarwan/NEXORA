import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid = false, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-11 w-full appearance-none rounded-xl border border-input bg-card px-4 pe-10 text-sm text-foreground transition-colors duration-200',
        'hover:border-primary/40',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input',
        invalid && 'border-destructive',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
