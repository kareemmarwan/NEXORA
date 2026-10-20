import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';

interface PricingPlan {
  name: string;
  description?: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
  variant?: 'default' | 'primary';
}

interface PricingCardsProps {
  plans: PricingPlan[];
  className?: string;
}

export function PricingCards({ plans, className }: PricingCardsProps) {
  return (
    <div className={cn('grid gap-5 md:grid-cols-2 lg:grid-cols-3', className)}>
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            'relative flex flex-col rounded-2xl border p-7 transition-all duration-300',
            plan.popular
              ? 'border-primary/30 bg-card shadow-glow-sm scale-[1.02]'
              : 'border-white/[0.06] bg-card hover:border-white/[0.12]'
          )}
        >
          {/* Popular Badge */}
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="gradient" className="px-4 py-1">
                Most Popular
              </Badge>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <h3 className="text-heading-3 text-foreground">{plan.name}</h3>
            {plan.description && (
              <p className="mt-1 text-small text-muted-foreground">{plan.description}</p>
            )}
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground font-brand tracking-tight">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-small text-muted-foreground">/{plan.period}</span>
              )}
            </div>
          </div>

          {/* Features */}
          <ul className="mb-8 flex flex-1 flex-col gap-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-body text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button
            variant={plan.popular ? 'primary' : 'outline'}
            className={cn(
              'w-full',
              !plan.popular && 'border-white/[0.12] text-foreground hover:border-white/25'
            )}
            asChild
          >
            <Link href={plan.href}>{plan.cta}</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}