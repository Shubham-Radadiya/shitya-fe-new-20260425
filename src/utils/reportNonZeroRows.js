import { getDailyProductLineTotal } from "./dailyReportProduct";

const EPS = 0.0005;

export function isReportNonZeroMoney(value) {
  return Math.abs(Number(value) || 0) > EPS;
}

export function reportBucketsHaveValue(buckets) {
  return Array.isArray(buckets) && buckets.some((b) => isReportNonZeroMoney(b));
}

/** Date / month / year category grid rows */
export function reportCategoryPeriodRowHasValue(row) {
  if (!row) return false;
  if (isReportNonZeroMoney(row.amount)) return true;
  return reportBucketsHaveValue(row.buckets);
}

/** Entry-wise invoice/bhet product lines */
export function reportFlattenedLineHasValue(line) {
  return line != null && isReportNonZeroMoney(line.amount);
}

/** Merged /report/daily product row */
export function mergedDailyProductHasValue(product, variant) {
  if (!product) return false;
  const raw = getDailyProductLineTotal(product);
  const v = variant === "returns" ? Math.abs(raw) : raw;
  return isReportNonZeroMoney(v);
}

/** Merged daily category row (totalAmount / totalQuantity from API merge) */
export function mergedDailyCategoryHasValue(category, variant) {
  if (!category) return false;
  const amt = Number(category.totalAmount) || 0;
  const shown = variant === "returns" ? Math.abs(amt) : amt;
  if (isReportNonZeroMoney(shown)) return true;
  const q = Number(category.totalQuantity) || 0;
  return variant === "returns" ? Math.abs(q) > EPS : Math.abs(q) > EPS;
}
