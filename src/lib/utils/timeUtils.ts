export function timeUntil(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Invalid date";

  const now = new Date();
  const diff = Math.max(0, date.getTime() - now.getTime());

  const minutes = Math.floor(diff / 60000) % 60;
  const hours = Math.floor(diff / 3600000) % 24;
  const days = Math.floor(diff / (3600000 * 24));
  const parts: string[] = [];

  if (days) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes && days === 0)
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);

  return parts.length > 0 ? parts.join(" ") : "now";
}

export function calculateProgress(
  createdAt: Date | string | null,
  endsAt: Date | string | null
): number {
  if (!createdAt || !endsAt) return 0;

  const start = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  if (now <= start) return 0;
  if (now >= end) return 100;

  const total = (end.getTime() - start.getTime()) / 1000;
  const elapsed = (now.getTime() - start.getTime()) / 1000;

  return Math.min(100, Math.round((elapsed / total) * 10000) / 100);
}

export function validDate(input: Date | string | null | undefined): boolean {
  if (!input) return false;
  const date = typeof input === "string" ? new Date(input) : input;
  return !isNaN(date.getTime());
}
