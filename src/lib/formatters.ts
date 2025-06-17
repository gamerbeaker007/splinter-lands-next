export function formatLargeNumber(number: number) {
  return new Intl.NumberFormat("en-US").format(number);
}
