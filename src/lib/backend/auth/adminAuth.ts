/**
 * Admin authorization utility — server-side only.
 * Does NOT have the "use server" directive; call from Server Components or
 * other server-side modules only.
 */

/**
 * Returns true when the given upstream-verified Splinterlands username matches
 * the ADMIN_ACCOUNT env var. Fails closed if the variable is absent or empty.
 */
export function isAdminUser(username: string): boolean {
  const adminAccount = process.env.ADMIN_ACCOUNT;
  if (!adminAccount?.trim()) return false;
  return adminAccount.trim().toLowerCase() === username.toLowerCase();
}
