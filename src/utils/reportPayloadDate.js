/**
 * Local calendar YYYY-MM-DD for report API (server uses REPORT_TIMEZONE / Asia/Kolkata for day bounds).
 * Handles Mongo `{ $date }`, ISO strings, and **plain `YYYY-MM-DD`** from aggregations without UTC shift.
 */
export function formatLocalDateYMD(input) {
  if (input == null || input === "") return "";
  if (typeof input === "object" && input != null && input.$date != null) {
    return formatLocalDateYMD(input.$date);
  }
  if (typeof input === "string") {
    const s = input.trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const d =
    input instanceof Date && !Number.isNaN(input.getTime())
      ? input
      : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Local noon on the calendar day of `createdAt` (stable vs month/FY bounds). */
export function parseCreatedAtToLocalNoon(input) {
  const ymd = formatLocalDateYMD(input);
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Display label for month-wise report day rows: DD-MM-YY (local calendar from YYYY-MM-DD). */
export function formatReportMonthWiseDateLabel(ymd) {
  if (!ymd || typeof ymd !== "string") return "";
  const parts = ymd.split("-");
  if (parts.length !== 3) return "";
  const [yStr, mStr, dStr] = parts;
  const y = Number(yStr);
  const m = Number(mStr);
  const day = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day))
    return "";
  const yy = String(y).slice(-2);
  return `${String(day).padStart(2, "0")}-${String(m).padStart(2, "0")}-${yy}`;
}

/**
 * Excel / voucher headers: always **DD-MM-YY** (from `Date`, ISO, `YYYY-MM-DD`, or `YYYY-MM` month key).
 */
export function formatExcelDateDDMMYY(input) {
  if (input == null || input === "") return "";
  if (typeof input === "string") {
    const s = input.trim();
    const ymOnly = /^(\d{4})-(\d{2})$/.exec(s);
    if (ymOnly) {
      return formatReportMonthWiseDateLabel(`${ymOnly[1]}-${ymOnly[2]}-01`);
    }
  }
  const ymd = formatLocalDateYMD(input);
  if (!ymd) return "";
  return formatReportMonthWiseDateLabel(ymd);
}

/** Every calendar day from startYmd through endYmd inclusive (local date), as YYYY-MM-DD. */
export function enumerateInclusiveYMD(startYmd, endYmd) {
  let ys = startYmd;
  let ye = endYmd;
  if (ys > ye) {
    const t = ys;
    ys = ye;
    ye = t;
  }
  const out = [];
  const [sy, sm, sd] = ys.split("-").map(Number);
  const [ey, em, ed] = ye.split("-").map(Number);
  let cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  while (cur <= end) {
    out.push(formatLocalDateYMD(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return out;
}

/** Bill / invoice id for sorting (`INV-12` → 12; `001` → 1). */
export function invoiceIdNumericSortKey(invoiceId) {
  const n = parseInt(String(invoiceId ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Bill-wise / return bill-wise rows: chronological by bill date, then Bill No. within the same day
 * (so `001` appears before `002` even when API groups multiple users).
 */
export function compareBillWiseRowsSortKey(a, b) {
  const da = String(a.__sortYmd ?? "");
  const db = String(b.__sortYmd ?? "");
  if (da !== db) return da.localeCompare(db);
  const na = Number(a.__sortBill ?? 0);
  const nb = Number(b.__sortBill ?? 0);
  if (na !== nb) return na - nb;
  return String(a.periodLabel ?? "").localeCompare(String(b.periodLabel ?? ""), undefined, {
    numeric: true,
  });
}

export function omitBillWiseRowSortKeys(row) {
  if (row == null || typeof row !== "object") return row;
  const { __sortYmd, __sortBill, ...rest } = row;
  return rest;
}
