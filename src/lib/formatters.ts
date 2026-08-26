type NumberFormatOptions = {
  locale?: string | string[];
  maximumFractionDigits?: number;
  /**
   * Pads with trailing zeros up to this many decimals. Use it for columns that
   * should line up (prices, DEC amounts); leave it off for free-flowing text.
   */
  minimumFractionDigits?: number;
};

// Pinned on purpose. A locale-less toLocaleString() resolves to the server
// locale during SSR and the browser locale on the client, which both breaks
// hydration and renders inconsistent numbers side by side.
const DEFAULT_LOCALE = "en-US";

/** Grouped decimal notation, e.g. 1234567.891 → "1,234,567.891". */
export function formatNumber(
  value: number,
  {
    locale = DEFAULT_LOCALE,
    maximumFractionDigits = 3,
    minimumFractionDigits,
  }: NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}

/** Whole numbers, e.g. 1234.7 → "1,235". */
export function formatInt(
  value: number,
  options: Omit<NumberFormatOptions, "maximumFractionDigits"> = {}
): string {
  return formatNumber(value, { ...options, maximumFractionDigits: 0 });
}

/**
 * Exactly `digits` decimals, e.g. 1234.5 → "1,234.50". Use it for amounts that
 * sit in a column and should align; `formatNumber` drops trailing zeros.
 */
export function formatFixed(
  value: number,
  digits = 2,
  options: Omit<
    NumberFormatOptions,
    "maximumFractionDigits" | "minimumFractionDigits"
  > = {}
): string {
  return formatNumber(value, {
    ...options,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Compact notation with a space before the unit, e.g. 1234567 → "1.235 M".
 * Prefer this for tiles and tooltips where space is tight; use `formatNumber`
 * wherever the exact figure matters.
 */
export function formatCompactNumber(
  value: number,
  {
    locale = DEFAULT_LOCALE,
    maximumFractionDigits = 3,
    minimumFractionDigits,
  }: NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}
