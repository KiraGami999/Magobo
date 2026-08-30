'use client';

import { useEffect, useState } from 'react';
import type { PaymentOptionsInfo } from '@magobo/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '@/lib/api-client';

export function PaymentOptionsPanel() {
  const [payment, setPayment] = useState<PaymentOptionsInfo | null>(null);

  useEffect(() => {
    void apiGet<{ payment: PaymentOptionsInfo }>('/api/payments/options').then((response) => {
      if (response.success) setPayment(response.data.payment);
    });
  }, []);

  if (!payment) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground leading-relaxed">{payment.disclaimer}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>PayChangu</strong> — create a payment link in the{' '}
            <a
              href={payment.paychanguPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              PayChangu portal
            </a>{' '}
            and share it with the other party.
          </li>
          <li>
            <strong>Cash</strong> — pay in person when you agree on terms on Magobo.
          </li>
          <li>
            <strong>Bank transfer</strong> — arrange a direct transfer between your accounts.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
