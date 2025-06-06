export function toPascalCaseLabel(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatNumber(value: number, locale: string = "en-US") {
  return new Intl.NumberFormat(locale).format(value);
}
