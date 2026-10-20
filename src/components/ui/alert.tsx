import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Variant = 'info' | 'success' | 'warning' | 'error';

const variantClasses: Record<Variant, { wrapper: string; icon: React.ElementType }> = {
  info: { wrapper: 'border-primary/25 bg-primary/[0.06] text-foreground', icon: Info },
  success: { wrapper: 'border-success/25 bg-success/[0.06] text-foreground', icon: CheckCircle2 },
  warning: { wrapper: 'border-warning/35 bg-warning/[0.08] text-foreground', icon: AlertTriangle },
  error: { wrapper: 'border-destructive/25 bg-destructive/[0.06] text-foreground', icon: AlertCircle },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrapper, icon: Icon } = variantClasses[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl border p-4', wrapper, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>
    </div>
  );
}
