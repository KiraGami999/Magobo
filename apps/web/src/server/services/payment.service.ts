import 'server-only';
import {
  DEFAULT_PAYCHANGU_PORTAL_URL,
  PAYMENT_DISCLAIMER,
  PAYMENT_METHODS,
  type PaymentOptionsInfo,
} from '@magobo/shared';

export function getPaymentOptions(): PaymentOptionsInfo {
  return {
    paychanguPortalUrl: process.env.PAYCHANGU_PORTAL_URL ?? DEFAULT_PAYCHANGU_PORTAL_URL,
    methods: [...PAYMENT_METHODS],
    disclaimer: PAYMENT_DISCLAIMER,
  };
}
