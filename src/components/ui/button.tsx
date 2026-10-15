import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
  ghost: 'bg-transparent hover:bg-muted text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  success: 'bg-success text-success-foreground hover:bg-success/90',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-12 px-7 text-base rounded-xl',
  icon: 'h-11 w-11 rounded-xl',
};

export function buttonClass(opts: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  const { variant = 'primary', size = 'md', className } = opts;
  return cn(
    'inline-flex items-center justify-center gap-2 font-medium transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      asChild = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const classes = buttonClass({ variant, size, className });

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
