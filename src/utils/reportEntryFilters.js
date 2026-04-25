import { formatLocalDateYMD } from "./reportPayloadDate";

/** Indian FY starting April: FY 2024–25 → Apr 1 2024 … Mar 31 2025 */
export function getIndianFYBoundsFromStartYear(fyStartYear) {
  const y = Number(fyStartYear);
  const start = new Date(y, 3, 1);
  const end = new Date(y + 1, 2, 31, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Purchase Bill-wise default range: current Indian FY from Apr 1, but **To** never past today
 * (picker shows e.g. 01/04/2026–16/04/2026 instead of full FY end 31/03/2027).
 */
export function getDefaultBillWiseDateRangeThroughToday() {
  const fy = listIndianFYOptions(12)[0]?.value ?? new Date().getFullYear();
  const { start, end } = getIndianFYBoundsFromStartYear(fy);
  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  let rangeEnd = new Date(Math.min(end.getTime(), endOfToday.getTime()));
  if (rangeEnd.getTime() < start.getTime()) {
    rangeEnd = new Date(start);
  }
  return { start, end: rangeEnd };
}

/** Dropdown options: most recent FY first */
export function listIndianFYOptions(yearsBack = 10) {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const currentFYStart = curMonth >= 3 ? curYear : curYear - 1;
  const options = [];
  for (let i = 0; i < yearsBack; i += 1) {
    const y = currentFYStart - i;
    options.push({
      value: y,
      label: `FY ${y}–${String(y + 1).slice(-2)}`,
    });
  }
  return options;
}

function localMonthBounds(d) {
  const dt = d instanceof Date && !Number.isNaN(d.getTime()) ? d : new Date();
  const y = dt.getFullYear();
  const m = dt.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function inTimeRange(isoOrDate, start, end) {
  const row = parseRowCreatedAt(isoOrDate);
  if (!row) return false;
  const t = row.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/** Normalize API `createdAt` (string, Date, or `{ $date }`) to a valid Date or null. */
function parseRowCreatedAt(ca) {
  if (ca == null) return null;
  if (typeof ca === "object" && ca.$date != null) {
    const d = new Date(ca.$date);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof ca === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ca.trim())) {
    const [y, m, d] = ca.trim().split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  const d = new Date(ca);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Bill-wise / date-wise: compare by local calendar day (YYYY-MM-DD).
 * Avoids single-day ranges missing rows when `createdAt` is UTC and local midnight bounds disagree.
 */
function inLocalYmdRange(ca, dateRangeStart, dateRangeEnd) {
  const rowDate = parseRowCreatedAt(ca);
  if (!rowDate) return false;
  const endDay = dateRangeEnd ?? dateRangeStart;
  let lo = formatLocalDateYMD(dateRangeStart);
  let hi = formatLocalDateYMD(endDay);
  if (lo > hi) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  const rowYmd = formatLocalDateYMD(rowDate);
  return rowYmd >= lo && rowYmd <= hi;
}

/**
 * @param {Array<{ data?: unknown[] }>} users
 * @param {'entry'|'date'|'month'|'year'} mode
 * @param {{ dateRangeStart?: Date; dateRangeEnd?: Date; monthDate?: Date; fyStartYear?: number }} opts
 */
export function filterNestedUserDataByMode(users, mode, opts = {}) {
  if (!Array.isArray(users)) return [];
  if (mode === "entry") {
    return users.map((u) => ({
      ...u,
      data: [...(u.data || [])],
    }));
  }

  const { dateRangeStart, dateRangeEnd, monthDate, fyStartYear } = opts;

  return users
    .map((u) => ({
      ...u,
      data: (u.data || []).filter((row) => {
        const ca = row?.createdAt;
        if (ca == null) return false;
        if (mode === "date" && dateRangeStart) {
          return inLocalYmdRange(ca, dateRangeStart, dateRangeEnd);
        }
        if (mode === "month" && monthDate) {
          const { start, end } = localMonthBounds(monthDate);
          return inTimeRange(ca, start, end);
        }
        if (mode === "year" && fyStartYear != null) {
          const { start, end } = getIndianFYBoundsFromStartYear(fyStartYear);
          return inTimeRange(ca, start, end);
        }
        return true;
      }),
    }))
    .filter((u) => (u.data || []).length > 0);
}
