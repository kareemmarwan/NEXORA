import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Label({
  className,
  htmlFor,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 block text-sm font-medium text-foreground', className)}
      {...props}
    >
      {props.children}
      {required && <span className="ms-1 text-destructive" aria-hidden="true">*</span>}
    </label>
  );
}
