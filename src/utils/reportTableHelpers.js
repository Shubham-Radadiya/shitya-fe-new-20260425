/**
 * Count invoice/bhet rows nested under users (Purchase/Bhet report tables).
 */
export function countNestedUserDataRows(users) {
  if (!Array.isArray(users) || users.length === 0) return 0;
  return users.reduce((n, u) => n + (u?.data?.length ?? 0), 0);
}
