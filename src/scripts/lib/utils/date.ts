export function getTodayAtMidnight(): Date {
  return getStartOfDay(new Date());
}

export function getStartOfDay(date: Date = new Date()): Date {
  return new Date(date.toISOString().split("T")[0]);
}
