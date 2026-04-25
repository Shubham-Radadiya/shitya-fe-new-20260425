import {
  formatLocalDateYMD,
  enumerateInclusiveYMD,
  formatReportMonthWiseDateLabel,
  parseCreatedAtToLocalNoon,
} from "./reportPayloadDate";
import { getIndianFYBoundsFromStartYear } from "./reportEntryFilters";
import { mergeDailyReportUserRows, productLineMergeKey } from "./mergeDailyReportUserRows";

/** Six fixed columns (Gujarati); include spelling variants for મુર્તિ. */
export const REPORT_CATEGORY_BUCKETS = [
  ["મુર્તિ", "મૂર્તિ"],
  ["વાઘા"],
  ["ઘરેણા"],
  ["પુજા"],
  ["પુસ્તક"],
  ["જનરલ"],
];

export const REPORT_GJ_CATEGORY_LABELS = REPORT_CATEGORY_BUCKETS.map(
  (b) => b[0]
);

function categoryNameMatches(catName, bucketNames) {
  const nm = String(catName ?? "").trim();
  return bucketNames.includes(nm);
}

/** Invoice / bhet lines use `totalBuyingAmount` per category. */
export function bucketAmountsFromBuyingCategories(categories) {
  return REPORT_CATEGORY_BUCKETS.map((names) =>
    (categories || []).reduce((sum, cat) => {
      if (!categoryNameMatches(cat.categoryName, names)) return sum;
      return sum + (Number(cat.totalBuyingAmount) || 0);
    }, 0)
  );
}

/** Merged /report/daily category rows use `totalAmount`. */
export function bucketAmountsFromDailyCategories(categories) {
  return REPORT_CATEGORY_BUCKETS.map((names) =>
    (categories || []).reduce((sum, cat) => {
      if (!categoryNameMatches(cat.categoryName, names)) return sum;
      return sum + (Number(cat.totalAmount) || 0);
    }, 0)
  );
}

export function sumBuckets(buckets) {
  return buckets.reduce((a, b) => a + (Number(b) || 0), 0);
}

/**
 * Flatten nested user → invoices → product lines for entry-wise product table.
 * List APIs (`getInvoiceForCategory`, `getBhetForCategory`) often return each doc with
 * `categories` only (no `productId`); those are expanded here as one row per category.
 * @param {Array<{ data?: any[] }>} users — filtered invoice/bhet users
 * @param {{ docIdKey?: 'invoiceId'|'billId'; negateQtyAndAmount?: boolean }} opts
 */
export function flattenNestedUsersToProductLines(users, opts = {}) {
  const docIdKey = opts.docIdKey || "invoiceId";
  const rows = [];
  for (const u of users || []) {
    for (const inv of u.data || []) {
      const docId = inv[docIdKey];
      const productLines = inv.productId;
      if (Array.isArray(productLines) && productLines.length > 0) {
        for (const line of productLines) {
          let qty = Number(line.quantity) || 0;
          const rate = Number(line.price) || 0;
          let amount = qty * rate;
          if (opts.negateQtyAndAmount) {
            qty = qty === 0 ? 0 : -Math.abs(qty);
            amount = amount === 0 ? 0 : -Math.abs(amount);
          }
          const idObj = line._id;
          const productId =
            idObj?.productId != null ? String(idObj.productId) : "";
          const name = idObj?.name != null ? String(idObj.name) : "";
          rows.push({
            key: `${docId}-${productLineMergeKey({
              productId,
              name,
            })}-${rows.length}`,
            docId,
            createdAt: inv.createdAt,
            productId,
            name,
            quantity: qty,
            rate,
            amount,
          });
        }
      } else if (Array.isArray(inv.categories) && inv.categories.length > 0) {
        for (const cat of inv.categories) {
          let qty = Number(cat.totalBuyingCount) || 0;
          let amount = Number(cat.totalBuyingAmount) || 0;
          if (opts.negateQtyAndAmount) {
            qty = qty === 0 ? 0 : -Math.abs(qty);
            amount = amount === 0 ? 0 : -Math.abs(amount);
          }
          const rate = qty !== 0 ? amount / qty : 0;
          const catId =
            cat.categoryId != null ? String(cat.categoryId) : "";
          const name =
            cat.categoryName != null ? String(cat.categoryName) : "Category";
          rows.push({
            key: `${docId}-cat-${productLineMergeKey({
              productId: catId,
              name,
            })}-${rows.length}`,
            docId,
            createdAt: inv.createdAt,
            productId: catId || "—",
            name,
            quantity: qty,
            rate,
            amount,
          });
        }
      }
    }
  }
  rows.sort((a, b) => {
    const ta = parseCreatedAtToLocalNoon(a.createdAt)?.getTime() ?? 0;
    const tb = parseCreatedAtToLocalNoon(b.createdAt)?.getTime() ?? 0;
    if (ta !== tb) return ta - tb;
    const da = String(a.docId ?? "");
    const db = String(b.docId ?? "");
    if (da !== db) return da.localeCompare(db, undefined, { numeric: true });
    return String(a.productId).localeCompare(String(b.productId));
  });
  return rows;
}

function invoicesInUsers(users) {
  const list = [];
  for (const u of users || []) {
    for (const inv of u.data || []) list.push(inv);
  }
  return list;
}

/** Group invoices by local calendar date. */
export function groupInvoicesByYMD(users) {
  const map = new Map();
  for (const inv of invoicesInUsers(users)) {
    const ymd = formatLocalDateYMD(inv.createdAt);
    if (!map.has(ymd)) map.set(ymd, []);
    map.get(ymd).push(inv);
  }
  return map;
}

/** One row per calendar day in [startYmd, endYmd]; empty days get zero buckets. */
export function buildDayRowsForYmdRange(users, startYmd, endYmd) {
  const byDay = groupInvoicesByYMD(users);
  const days = enumerateInclusiveYMD(startYmd, endYmd);
  return days.map((ymd) => {
    const invs = byDay.get(ymd) || [];
    const buckets = [0, 0, 0, 0, 0, 0];
    for (const inv of invs) {
      const b = bucketAmountsFromBuyingCategories(inv.categories);
      b.forEach((v, i) => {
        buckets[i] += v;
      });
    }
    return {
      ymd,
      dateLabel: formatReportMonthWiseDateLabel(ymd),
      buckets,
      amount: sumBuckets(buckets),
      invoiceCount: invs.length,
    };
  });
}

/** Indian FY: list calendar months from April (fyStartYear) through March (fyStartYear+1). */
export function listIndianFYMonths(fyStartYear) {
  const y0 = Number(fyStartYear);
  const out = [];
  for (let i = 0; i < 12; i += 1) {
    const calMonth = ((3 + i) % 12) + 1;
    const calYear = i < 9 ? y0 : y0 + 1;
    const start = new Date(calYear, calMonth - 1, 1);
    const end = new Date(calYear, calMonth, 0, 23, 59, 59, 999);
    const label = start.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
    out.push({ label, start, end, calYear, calMonth });
  }
  return out;
}

export function buildFiscalMonthRowsFromUsers(users, fyStartYear) {
  const months = listIndianFYMonths(fyStartYear);
  const invs = invoicesInUsers(users);
  return months.map((m) => {
    const buckets = [0, 0, 0, 0, 0, 0];
    for (const inv of invs) {
      const row = parseCreatedAtToLocalNoon(inv.createdAt);
      const t = row?.getTime();
      if (t == null || t < m.start.getTime() || t > m.end.getTime()) continue;
      const b = bucketAmountsFromBuyingCategories(inv.categories);
      b.forEach((v, i) => {
        buckets[i] += v;
      });
    }
    return {
      key: `${m.calYear}-${m.calMonth}`,
      monthLabel: m.label,
      monthDate: m.start,
      buckets,
      amount: sumBuckets(buckets),
    };
  });
}

/** From /report/daily per-day payloads: map ymd -> merged category buckets. */
export function bucketMapFromSalesReportByDate(salesReportByDate) {
  const map = new Map();
  for (const day of salesReportByDate || []) {
    const merged = mergeDailyReportUserRows(day.rows || []);
    const buckets = bucketAmountsFromDailyCategories(merged.categories);
    map.set(day.ymd, { buckets, amount: sumBuckets(buckets), merged });
  }
  return map;
}

export function buildSalesMonthDayRows(salesReportByDate, monthDate) {
  const y = monthDate.getFullYear();
  const mo = monthDate.getMonth();
  const startYmd = formatLocalDateYMD(new Date(y, mo, 1));
  const endYmd = formatLocalDateYMD(new Date(y, mo + 1, 0));
  const bucketMap = bucketMapFromSalesReportByDate(salesReportByDate);
  return enumerateInclusiveYMD(startYmd, endYmd).map((ymd) => {
    const hit = bucketMap.get(ymd);
    const buckets = hit ? hit.buckets : [0, 0, 0, 0, 0, 0];
    return {
      ymd,
      dateLabel: formatReportMonthWiseDateLabel(ymd),
      buckets,
      amount: sumBuckets(buckets),
    };
  });
}

export function buildSalesFiscalMonthRows(salesReportByDate, fyStartYear) {
  const { start: fyStart, end: fyEnd } =
    getIndianFYBoundsFromStartYear(fyStartYear);
  const daysInFy = enumerateInclusiveYMD(
    formatLocalDateYMD(fyStart),
    formatLocalDateYMD(fyEnd)
  );
  const bucketMap = bucketMapFromSalesReportByDate(salesReportByDate);
  const months = listIndianFYMonths(fyStartYear);
  return months.map((m) => {
    const buckets = [0, 0, 0, 0, 0, 0];
    for (const ymd of daysInFy) {
      const t = new Date(`${ymd}T12:00:00`).getTime();
      if (t < m.start.getTime() || t > m.end.getTime()) continue;
      const hit = bucketMap.get(ymd);
      if (!hit) continue;
      hit.buckets.forEach((v, i) => {
        buckets[i] += v;
      });
    }
    return {
      key: `${m.calYear}-${m.calMonth}`,
      monthLabel: m.label,
      monthDate: m.start,
      buckets,
      amount: sumBuckets(buckets),
    };
  });
}
