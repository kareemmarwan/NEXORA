'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AccordionItemData {
  id: string;
  question: React.ReactNode;
  answer: React.ReactNode;
}

export function Accordion({
  items,
  className,
  allowMultiple = false,
}: {
  items: AccordionItemData[];
  className?: string;
  allowMultiple?: boolean;
}) {
  const [openIds, setOpenIds] = React.useState<string[]>([]);

  function toggle(id: string) {
    setOpenIds((current) => {
      const isOpen = current.includes(id);
      if (allowMultiple) {
        return isOpen ? current.filter((x) => x !== id) : [...current, id];
      }
      return isOpen ? [] : [id];
    });
  }

  return (
    <div className={cn('flex flex-col divide-y divide-border rounded-2xl border border-border', className)}>
      {items.map((item) => {
        const open = openIds.includes(item.id);
        return (
          <div key={item.id} className="bg-card">
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`accordion-panel-${item.id}`}
                id={`accordion-trigger-${item.id}`}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-start text-sm font-medium text-foreground hover:bg-muted/50"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                    open && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-trigger-${item.id}`}
              hidden={!open}
              className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
