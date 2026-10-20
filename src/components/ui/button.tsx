import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'gradient';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: cn(
    'relative overflow-hidden',
    'bg-gradient-to-br from-[#30C0F0] to-[#9048F0] text-white font-bold',
    'shadow-sm transition-all duration-150',
    'hover:translate-y-[-2px] hover:shadow-glow-blue',
    'active:translate-y-0'
  ),
  secondary: cn(
    'bg-secondary text-secondary-foreground',
    'hover:bg-secondary/70 active:translate-y-px',
    'transition-all duration-150'
  ),
  outline: cn(
    'border border-white/12 bg-transparent text-foreground',
    'hover:border-primary/40 hover:bg-primary/5',
    'active:translate-y-px transition-all duration-150'
  ),
  ghost: 'bg-transparent text-foreground hover:bg-muted transition-all duration-150',
  destructive: cn(
    'bg-destructive text-destructive-foreground shadow-sm',
    'hover:bg-destructive/90 active:translate-y-px',
    'transition-all duration-150'
  ),
  success: cn(
    'bg-success text-success-foreground shadow-sm',
    'hover:bg-success/90 active:translate-y-px',
    'transition-all duration-150'
  ),
  gradient: cn(
    'brand-gradient border-0 text-white font-bold',
    'shadow-sm shadow-glow hover:brightness-110',
    'active:translate-y-px transition-all duration-150'
  ),
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-lg',
  md: 'h-11 px-6 text-sm rounded-xl',
  lg: 'h-12 px-8 text-base rounded-xl',
  icon: 'h-11 w-11 rounded-xl',
};

export function buttonClass(opts: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  const { variant = 'primary', size = 'md', className } = opts;
  return cn(
    'inline-flex items-center justify-center gap-2 font-medium tracking-tight',
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
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';