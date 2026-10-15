'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  id,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <label htmlFor={inputId} className={cn('inline-flex cursor-pointer items-center gap-3', className)}>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted',
          disabled && 'opacity-50'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            'start-0.5',
            checked && 'start-[22px]'
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
    </label>
  );
}
