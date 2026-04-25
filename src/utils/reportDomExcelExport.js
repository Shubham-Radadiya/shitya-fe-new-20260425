import { formatExcelDateDDMMYY } from "./reportPayloadDate";
import { getIndianFYBoundsFromStartYear } from "./reportEntryFilters";
import { formatInrMoney } from "./formatInr";

/** Remove table footers so Excel rows align with column counts (no colspan collapse). */
export function stripReportTableFooters(root) {
  if (!root) return;
  root.querySelectorAll("tfoot").forEach((tf) => {
    if (tf.parentNode) tf.parentNode.removeChild(tf);
  });
  root.querySelectorAll("tr").forEach((row) => {
    if (row.querySelector(".tfootgroup") && row.parentNode) {
      row.parentNode.removeChild(row);
    }
  });
}

const fmtCellDate = (d) => formatExcelDateDDMMYY(d);

const fmtPair = (a, b) => {
  const la = fmtCellDate(a);
  const lb = fmtCellDate(b);
  return la === lb ? la : `${la} – ${lb}`;
};

/**
 * Title block for purchase/bhet style reports: title, date range line, generated timestamp.
 * @param {{ reportTitle: string, entryMode: string, entryItemWiseStart?: Date, entryItemWiseEnd?: Date, filterDateRangeStart: Date, filterDateRangeEnd?: Date|null, filterMonthDate: Date, monthYmdBounds: {start: string, end: string}, fyStartYear: number }} p
 */
export function buildEntryToolbarReportTitleRows(p) {
  const end = p.filterDateRangeEnd ?? p.filterDateRangeStart;
  let rangeLine = "";
  if (p.entryMode === "entry") {
    if (p.entryItemWiseStart && p.entryItemWiseEnd) {
      rangeLine = `Date range: ${fmtPair(p.entryItemWiseStart, p.entryItemWiseEnd)}`;
    } else {
      rangeLine = `Date range: ${fmtPair(p.filterDateRangeStart, end)}`;
    }
  } else if (p.entryMode === "date") {
    rangeLine = `Date range: ${fmtPair(p.filterDateRangeStart, end)}`;
  } else if (p.entryMode === "month") {
    rangeLine = `Date range: ${formatExcelDateDDMMYY(
      p.monthYmdBounds.start
    )} – ${formatExcelDateDDMMYY(p.monthYmdBounds.end)}`;
  } else {
    const { start, end: fyEnd } = getIndianFYBoundsFromStartYear(p.fyStartYear);
    rangeLine = `Date range: ${fmtPair(start, fyEnd)} (FY ${p.fyStartYear}–${String(
      Number(p.fyStartYear) + 1
    ).slice(-2)})`;
  }
  const gen = `Generated: ${fmtCellDate(new Date())}`;
  return [[p.reportTitle], [rangeLine], [gen]];
}

/** Title + explicit calendar range + generated (e.g. Silak monthly / fixed API window). */
export function buildDateRangeReportTitleRows(reportTitle, startDate, endDate) {
  const rangeLine = `Date range: ${fmtPair(startDate, endDate)}`;
  const gen = `Generated: ${fmtCellDate(new Date())}`;
  return [[reportTitle], [rangeLine], [gen]];
}

/** Footer row for ReportCategoryPeriodTable (no doc columns): columns match Bill+Date+6+Amt or Date+6+Amt. */
export function buildAlignedPeriodCategoryFooterRow(entryMode, footer) {
  const sums = footer?.colSums || [0, 0, 0, 0, 0, 0];
  const grand = footer?.grand ?? 0;
  const amt = formatInrMoney(grand);
  if (entryMode === "date") {
    return ["Total:-", "", ...sums, amt];
  }
  return ["Total:-", ...sums, amt];
}

/** thead + tbody rows as trimmed text; footers stripped first. */
export function tableRowsForExport(tableEl) {
  const c = tableEl.cloneNode(true);
  stripReportTableFooters(c);
  return Array.from(c.querySelectorAll("thead tr, tbody tr")).map((row) =>
    Array.from(row.querySelectorAll("th, td")).map((cell) => cell.textContent.trim())
  );
}

/**
 * After exporting a merged user product/category table, append a total row with one cell per column.
 * Uses live tbody (original table) for sums.
 */
export function appendMergedEntryTableFooter(tableEl, tableData) {
  const headers =
    tableEl.querySelector("thead tr")?.innerText?.replace(/\s+/g, " ").trim() ?? "";
  if (headers.includes("Product Name")) {
    let sum = 0;
    tableEl.querySelectorAll("tbody tr").forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      const raw = tds[tds.length - 1]?.textContent?.replace(/[,₹\s]/g, "") || "0";
      sum += Number(raw) || 0;
    });
    tableData.push(["", "", "", "", "Total:", formatInrMoney(sum)]);
  } else if (headers.includes("Category") && headers.includes("Amt")) {
    let sum = 0;
    tableEl.querySelectorAll("tbody tr").forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      const raw = tds[1]?.textContent?.replace(/[,₹\s]/g, "") || "0";
      sum += Number(raw) || 0;
    });
    tableData.push(["Total", formatInrMoney(sum)]);
  }
}
