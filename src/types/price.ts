export const PRICE_KEYS = ['hive', 'hbd', 'sps', 'dec', 'voucher'] as const;

export type SplPriceData = Record<typeof PRICE_KEYS[number], number>;
