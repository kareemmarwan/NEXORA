import 'server-only';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function resendEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Send a transactional email via Resend. Silently skips when the API key
 * is not configured so the app works without email in local/dev.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!resendEnabled()) return;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[email] failed to send', res.status, body);
  }
}

type Locale = 'ar' | 'en';

function shell(locale: Locale, title: string, bodyHtml: string): string {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const font = 'Cairo, Tahoma, Arial, sans-serif';
  return `<!doctype html>
<html dir="${dir}" lang="${locale}">
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:${font};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#1e3a8a;">${title}</h1>
          <div style="font-size:15px;line-height:1.8;color:#334155;">${bodyHtml}</div>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;" />
          <p style="margin:0;font-size:12px;color:#94a3b8;">AI Services Platform</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOrderCreatedEmail(opts: {
  to: string;
  orderNumber: string;
  total: string;
  locale: Locale;
}) {
  const isAr = opts.locale === 'ar';
  await sendEmail({
    to: opts.to,
    subject: isAr
      ? `تم استلام طلبك ${opts.orderNumber}`
      : `We received your order ${opts.orderNumber}`,
    html: shell(
      opts.locale,
      isAr ? 'تم إنشاء طلبك بنجاح' : 'Your order was created',
      isAr
        ? `<p>شكراً لك! تم استلام طلبك رقم <strong>${opts.orderNumber}</strong> بمبلغ <strong>${opts.total}</strong>.</p><p>يمكنك متابعة حالة الطلب من صفحة طلباتك.</p>`
        : `<p>Thank you! We received order <strong>${opts.orderNumber}</strong> for <strong>${opts.total}</strong>.</p><p>You can track its status from your orders page.</p>`
    ),
    text: isAr
      ? `تم استلام طلبك ${opts.orderNumber} بمبلغ ${opts.total}`
      : `Order ${opts.orderNumber} received for ${opts.total}`,
  });
}

export async function sendPaymentConfirmedEmail(opts: {
  to: string;
  orderNumber: string;
  locale: Locale;
}) {
  const isAr = opts.locale === 'ar';
  await sendEmail({
    to: opts.to,
    subject: isAr
      ? `تم تأكيد الدفع للطلب ${opts.orderNumber}`
      : `Payment confirmed for order ${opts.orderNumber}`,
    html: shell(
      opts.locale,
      isAr ? 'تم تأكيد الدفع' : 'Payment confirmed',
      isAr
        ? `<p>تم تأكيد الدفع للطلب رقم <strong>${opts.orderNumber}</strong>. سيبدأ فريقنا العمل على مشروعك فوراً.</p>`
        : `<p>Payment for order <strong>${opts.orderNumber}</strong> is confirmed. Our team is starting on your project now.</p>`
    ),
    text: isAr
      ? `تم تأكيد الدفع للطلب ${opts.orderNumber}`
      : `Payment confirmed for order ${opts.orderNumber}`,
  });
}

export async function sendDeliveredEmail(opts: {
  to: string;
  orderNumber: string;
  locale: Locale;
}) {
  const isAr = opts.locale === 'ar';
  await sendEmail({
    to: opts.to,
    subject: isAr
      ? `تم تسليم طلبك ${opts.orderNumber}`
      : `Your order ${opts.orderNumber} is delivered`,
    html: shell(
      opts.locale,
      isAr ? 'تم تسليم العمل' : 'Your project is delivered',
      isAr
        ? `<p>تم تسليم العمل للطلب رقم <strong>${opts.orderNumber}</strong>. يمكنك الاطلاع على ملاحظات التسليم والروابط من صفحة الطلب.</p><p>يرجى تأكيد الاستلام من صفحة الطلب.</p>`
        : `<p>Work for order <strong>${opts.orderNumber}</strong> has been delivered. Check delivery notes and links on the order page.</p><p>Please confirm receipt from the order page.</p>`
    ),
    text: isAr
      ? `تم تسليم طلبك ${opts.orderNumber}`
      : `Order ${opts.orderNumber} delivered`,
  });
}
