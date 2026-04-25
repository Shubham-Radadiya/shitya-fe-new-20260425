import * as XLSX from "xlsx";
import {
  getDailyProductLineTotal,
  getDailyProductUnitRate,
} from "./dailyReportProduct";
import { REPORT_GJ_CATEGORY_LABELS } from "./reportCategoryAggregation";

/**
 * Sheet 1: Single merged table for the selected date range (products + categories).
 * Sheet 2: “Print layout” (same range + silak block).
 */
export function buildDateRangeSalesWorkbook({
  storeStallName,
  rangeLabel,
  currentReport = [],
  filteredProducts = [],
  filteredCategory = [],
  totalAmount = 0,
  /** Print layout (full range merged) */
  printSheetParams,
}) {
  const reportTitle = storeStallName
    ? `${storeStallName} - Sales report`
    : "Sales report";

  const usersLabel = currentReport
    .map((d) => d.userFullName)
    .filter(Boolean)
    .join(", ");

  const sheet1 = [];
  sheet1.push([reportTitle]);
  sheet1.push([`Date range: ${rangeLabel}`]);
  if (usersLabel) sheet1.push([`User(s): ${usersLabel}`]);
  sheet1.push([]);
  sheet1.push(["Products"]);
  sheet1.push([
    "Sr. No.",
    "Product ID",
    "Product Name",
    "Quantity",
    "Rate",
    "Amount",
  ]);
  filteredProducts.forEach((p, i) => {
    const nm = p.name || "N/A";
    sheet1.push([
      i + 1,
      p.productId,
      nm,
      p.totalBuyingCount,
      getDailyProductUnitRate(p),
      getDailyProductLineTotal(p),
    ]);
  });
  sheet1.push([]);
  sheet1.push(["", "", "", "", "Total:", totalAmount]);
  sheet1.push([]);
  sheet1.push(["Category totals"]);
  sheet1.push(["Sr. No.", "Category Name", "Total Quantity", "Total Amount"]);
  filteredCategory.forEach((c, i) => {
    sheet1.push([
      i + 1,
      c.categoryName,
      c.totalQuantity,
      c.totalAmount,
    ]);
  });
  sheet1.push([]);
  sheet1.push(["", "", "Total:", totalAmount]);

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1);
  XLSX.utils.book_append_sheet(wb, ws1, "Daily sales");

  const ws2 = XLSX.utils.aoa_to_sheet(
    buildPrintLayoutAoa(printSheetParams)
  );
  XLSX.utils.book_append_sheet(wb, ws2, "Print layout");

  return wb;
}

export function buildPrintLayoutAoa({
  salesReportTitle = "Daily Sale Report",
  reportVariant = "sales",
  reportDateLabel = "",
  currentReport = [],
  filteredProducts = [],
  filteredCategory = [],
  totalAmount = 0,
  totalQuantity = 0,
  printDateLabel,
  billDetail = [],
  returnbillDetail = [],
  totalSilakAmount = 0,
  totalSilakReturnAmount = 0,
  openSilak = 0,
  closeSilak = 0,
  kharch = 0,
  silakCurrencyTotal = 0,
  formattedTotalBhet = "",
  formattedDate = "",
  salesData = [],
}) {
  const usersLabel = currentReport
    .map((d) => d.userFullName)
    .filter(Boolean)
    .join(", ");

  const categoryDisplayTotal = filteredCategory.reduce((sum, c) => {
    const raw = Number(c.totalAmount) || 0;
    return sum + (reportVariant === "returns" ? Math.abs(raw) : raw);
  }, 0);

  const sheet2 = [];
  sheet2.push([salesReportTitle]);
  sheet2.push([`Date range: ${reportDateLabel || ""}`]);
  if (printDateLabel) sheet2.push([`Printed: ${printDateLabel}`]);
  if (usersLabel) sheet2.push(["User(s)", usersLabel]);
  sheet2.push([]);
  sheet2.push(["— Product lines (range total) —"]);
  sheet2.push(["Id", "Product", "Qty", "Amt"]);
  filteredProducts.forEach((p) => {
    const nm = p.name || "N/A";
    sheet2.push([
      p.productId,
      nm,
      p.totalBuyingCount,
      getDailyProductLineTotal(p),
    ]);
  });
  sheet2.push(["Total", "", totalQuantity, totalAmount]);
  sheet2.push([]);
  sheet2.push(["— Category wise —"]);
  sheet2.push(["Category", "Amount"]);
  filteredCategory.forEach((c) => {
    const raw = Number(c.totalAmount) || 0;
    const amt = reportVariant === "returns" ? Math.abs(raw) : raw;
    sheet2.push([c.categoryName, amt]);
  });
  sheet2.push(["Category total", categoryDisplayTotal]);
  sheet2.push([]);

  sheet2.push(["— Bill detail —"]);
  sheet2.push(["Bill Id", "Amount"]);
  (billDetail || []).forEach((b) => {
    sheet2.push([b.billId, b.totalAmount]);
  });
  sheet2.push(["Bills total", totalSilakAmount]);
  sheet2.push([]);

  if (returnbillDetail?.length) {
    sheet2.push(["— Return bill detail —"]);
    sheet2.push(["Return Bill Id", "Amount"]);
    returnbillDetail.forEach((b) => {
      sheet2.push([b.billId, b.totalAmount]);
    });
    sheet2.push(["Return total", totalSilakReturnAmount]);
    sheet2.push([]);
  }

  sheet2.push([`- (${formattedDate || reportDateLabel}) આજનો હિસાબ -`]);
  sheet2.push(["આજની ખુલતી સીલક", openSilak]);
  sheet2.push(["આજનુ વેચાણ", totalAmount]);
  sheet2.push(["ખર્ચ", kharch]);
  sheet2.push([
    "કુલ બેલેન્સ",
    (Number(openSilak) || 0) + (Number(totalAmount) || 0) - (Number(kharch) || 0),
  ]);
  sheet2.push(["આજની બંધ સીલક", closeSilak]);
  sheet2.push(["આજની જમા કરાવેલ રકમ", silakCurrencyTotal]);
  sheet2.push(["ટોટલ ભેટ", formattedTotalBhet]);
  sheet2.push([]);
  sheet2.push(["— Currency (denomination) —"]);
  sheet2.push(["Currency", "Count", "Amount"]);
  const noteCountTotal = (salesData || []).reduce(
    (s, r) => s + (Number(r.count) || 0),
    0
  );
  (salesData || []).forEach((row) => {
    const denom = Number(row.currency) || 0;
    const cnt = Number(row.count) || 0;
    sheet2.push([row.currency, cnt, denom * cnt]);
  });
  sheet2.push(["Currency total", noteCountTotal, silakCurrencyTotal]);

  return sheet2;
}

/**
 * Single-sheet AOA for Sales report period modes: bill-wise, month-wise, year-wise
 * (same columns as {@link ReportCategoryPeriodTable} without doc/action columns).
 */
export function buildSalesPeriodReportAoa({
  mode,
  salesReportTitle = "Sales Report",
  dateRangeLabel = "",
  usersLabel = "",
  periodColumnLabel,
  secondaryPeriodColumnLabel,
  rows = [],
  footerBuckets = [0, 0, 0, 0, 0, 0],
  footerTotal = 0,
}) {
  const sectionTitle =
    mode === "date" ? "Bill wise" : mode === "month" ? "Month wise" : "Year wise";
  const aoa = [];
  aoa.push([salesReportTitle]);
  aoa.push([`Date range: ${dateRangeLabel}`]);
  if (usersLabel) aoa.push([`User(s): ${usersLabel}`]);
  aoa.push([]);
  aoa.push([sectionTitle]);

  const header = [periodColumnLabel];
  if (secondaryPeriodColumnLabel) header.push(secondaryPeriodColumnLabel);
  header.push(...REPORT_GJ_CATEGORY_LABELS, "Amount");
  aoa.push(header);

  rows.forEach((r) => {
    const line = [r.periodLabel ?? ""];
    if (secondaryPeriodColumnLabel) {
      line.push(r.secondaryPeriodLabel ?? "");
    }
    const buckets = r.buckets || [];
    for (let i = 0; i < REPORT_GJ_CATEGORY_LABELS.length; i += 1) {
      line.push(buckets[i] ?? 0);
    }
    line.push(r.amount ?? 0);
    aoa.push(line);
  });

  const foot = ["Total"];
  if (secondaryPeriodColumnLabel) foot.push("");
  const sums = footerBuckets || [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < REPORT_GJ_CATEGORY_LABELS.length; i += 1) {
    foot.push(sums[i] ?? 0);
  }
  foot.push(footerTotal ?? 0);
  aoa.push(foot);

  const sheetName =
    (mode === "date" ? "BillWise" : mode === "month" ? "MonthWise" : "YearWise").slice(
      0,
      31
    ) || "Report";
  return { aoa, sheetName };
}

/**
 * Legacy SheetJS workbook (no cell styles). Prefer `buildSalesPeriodReportAoa` +
 * `reportExcelBlobFromAoa` (see `salesPeriodReportExcelExport.js`).
 */
export function buildSalesPeriodReportWorkbook(params) {
  const { aoa, sheetName } = buildSalesPeriodReportAoa(params);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetName);
  return wb;
}

