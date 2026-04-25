/** Stable key so the same product matches across days (ObjectId vs string, etc.). */
export function productLineMergeKey(p) {
  const raw = p?.product_id ?? p?.productId;
  if (raw != null && raw !== "") {
    if (typeof raw === "object" && raw !== null) {
      if (typeof raw.$oid === "string") return raw.$oid;
      if (typeof raw.toString === "function") {
        const s = raw.toString();
        if (s && s !== "[object Object]") return s;
      }
    }
    return String(raw).trim();
  }
  const pid = String(p?.productId ?? "").trim();
  if (pid) return `pid:${pid}`;
  return `name:${String(p?.name ?? "")}`;
}

/**
 * Merge multiple /report/daily user rows (or one day + many users) into one
 * products + categories list — same idea as mergeStoreWideDailyRows on the server.
 * Also collapses duplicate lines for the same product within a single document.
 */
export function mergeDailyReportUserRows(docs) {
  const list = Array.isArray(docs) ? docs.filter(Boolean) : [];
  if (list.length === 0) {
    return {
      products: [],
      categories: [],
      userFullNames: [],
    };
  }

  const productMap = new Map();
  const categoryMap = new Map();

  for (const doc of list) {
    for (const p of doc.products || []) {
      const key = productLineMergeKey(p);
      const existing = productMap.get(key);
      if (!existing) {
        productMap.set(key, { ...p });
      } else {
        existing.totalBuyingAmount += p.totalBuyingAmount || 0;
        existing.totalBuyingCount += p.totalBuyingCount || 0;
        existing.price =
          existing.totalBuyingCount !== 0
            ? existing.totalBuyingAmount / existing.totalBuyingCount
            : 0;
      }
    }
    for (const c of doc.categories || []) {
      const key = String(c.categoryName ?? "").trim() || "__uncategorized";
      const existing = categoryMap.get(key);
      if (!existing) {
        categoryMap.set(key, { ...c });
      } else {
        existing.totalQuantity += c.totalQuantity || 0;
        existing.totalAmount += c.totalAmount || 0;
      }
    }
  }

  const products = Array.from(productMap.values()).sort(
    (a, b) =>
      (a.categoryIndex ?? 0) - (b.categoryIndex ?? 0) ||
      String(a.productId).localeCompare(String(b.productId))
  );
  const categories = Array.from(categoryMap.values()).sort(
    (a, b) => (a.categoryIndex ?? 0) - (b.categoryIndex ?? 0)
  );

  const userFullNames = [
    ...new Set(list.map((d) => d.userFullName).filter(Boolean)),
  ];

  return { products, categories, userFullNames };
}
