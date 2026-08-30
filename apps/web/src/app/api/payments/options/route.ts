import { ok, withErrorHandling } from '@/server/api-response';
import { getPaymentOptions } from '@/server/services/payment.service';

export const GET = withErrorHandling(async () => {
  return ok({ payment: getPaymentOptions() });
});
