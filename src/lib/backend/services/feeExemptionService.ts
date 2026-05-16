/**
 * Server-only module. Never import this from client components or shared code.
 * Reads FEE_EXEMPT_USERS / FEE_EXEMPT_REGIONS from server-only env vars
 * (no NEXT_PUBLIC_ prefix) so the exemption list is never bundled into the
 * client and cannot be read from the browser.
 */

function parseUserList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
}

function parseNumberList(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));
}

const DEFAULT_FEE_EXEMPT_USERS = ["beaker007"];
const DEFAULT_FEE_EXEMPT_REGIONS = [65];

const FEE_EXEMPT_USERS: string[] = Array.from(
  new Set([
    ...DEFAULT_FEE_EXEMPT_USERS,
    ...parseUserList(process.env.FEE_EXEMPT_USERS),
  ])
);

const FEE_EXEMPT_REGIONS: number[] = Array.from(
  new Set([
    ...DEFAULT_FEE_EXEMPT_REGIONS,
    ...parseNumberList(process.env.FEE_EXEMPT_REGIONS),
  ])
);

export function shouldApplyFee(
  username: string,
  regionNumber: number
): boolean {
  const lower = username.toLowerCase();
  if (FEE_EXEMPT_USERS.some((u) => u.toLowerCase() === lower)) return false;
  return !FEE_EXEMPT_REGIONS.includes(regionNumber);
}
