/** Default PayChangu merchant dashboard — override via PAYCHANGU_PORTAL_URL. */
export const DEFAULT_PAYCHANGU_PORTAL_URL = 'https://dashboard.paychangu.com';

export const PAYMENT_METHODS = ['PAYCHANGU', 'CASH', 'BANK_TRANSFER'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentOptionsInfo {
  paychanguPortalUrl: string;
  methods: PaymentMethod[];
  disclaimer: string;
}

export const PAYMENT_DISCLAIMER =
  'Magobo does not process payments or hold funds yet. Use PayChangu for online checkout, or arrange cash or direct bank transfer with the other party. Always agree on terms on-platform before paying.';
