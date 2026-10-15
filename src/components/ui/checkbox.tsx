'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export function Checkbox({ className, label, description, id, ...props }: CheckboxProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex items-start gap-3">
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0 rounded-md border border-input text-primary',
          'accent-primary focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        {...props}
      />
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label htmlFor={inputId} className="text-sm font-medium leading-tight text-foreground">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
    </div>
  );
}
