export function formatLargeNumber(number: number) {
  return new Intl.NumberFormat("en-US").format(number);
}

export function formatNumberWithSuffix(number: number): string {
  const abs = Math.abs(number);

  if (abs >= 1_000_000_000) {
    return (number / 1_000_000_000).toFixed(2).replace(/\.00$/, "") + " B";
  } else if (abs >= 1_000_000) {
    return (number / 1_000_000).toFixed(2).replace(/\.00$/, "") + " M";
  } else if (abs >= 1_000) {
    return (number / 1_000).toFixed(2).replace(/\.00$/, "") + " K";
  } else {
    return number.toFixed(2).replace(/\.00$/, "");
  }
}
