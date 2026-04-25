/**
 * Daily report product rows from /report/daily and /report/daily/admin.
 * New API: `price` = unit rate, `totalBuyingAmount` = sum(rate × qty) per product.
 * Legacy: `price` was already the line total (no totalBuyingAmount).
 */
export function getDailyProductLineTotal(product) {
  if (product == null) return 0;
  if (
    product.totalBuyingAmount != null &&
    product.totalBuyingAmount !== undefined
  ) {
    const n = Number(product.totalBuyingAmount);
    return Number.isFinite(n) ? n : 0;
  }
  const legacy = Number(product.price);
  return Number.isFinite(legacy) ? legacy : 0;
}

/** Unit rate (weighted average if bills used different rates). */
export function getDailyProductUnitRate(product) {
  if (product == null) return 0;
  const qty = Number(product.totalBuyingCount) || 0;
  if (!qty) return 0;
  return getDailyProductLineTotal(product) / qty;
}
