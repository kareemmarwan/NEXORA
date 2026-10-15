import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { OrderStatus, PaymentStatus, ProofStatus } from '@/types/database';

const orderVariant: Record<OrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted'> = {
  pending_payment: 'warning',
  payment_review: 'warning',
  paid: 'primary',
  in_progress: 'primary',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  refunded: 'muted',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('status.order');
  return <Badge variant={orderVariant[status]}>{t(status)}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const t = useTranslations('status.payment');
  const variant =
    status === 'paid' ? 'success' : status === 'failed' ? 'danger' : status === 'under_review' ? 'warning' : 'muted';
  return <Badge variant={variant}>{t(status)}</Badge>;
}

export function ProofStatusBadge({ status }: { status: ProofStatus }) {
  const t = useTranslations('status.proof');
  const variant = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';
  return <Badge variant={variant}>{t(status)}</Badge>;
}
