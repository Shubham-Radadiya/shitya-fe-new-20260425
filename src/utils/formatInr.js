/**
 * Indian digit grouping (e.g. 1,00,000) via locale "en-IN".
 */
export function formatInr(value, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(safe);
}

/** Amounts with two fraction digits (e.g. Excel / print totals). */
export function formatInrMoney(value) {
  return formatInr(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
