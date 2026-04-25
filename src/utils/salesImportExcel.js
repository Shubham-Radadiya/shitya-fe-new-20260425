import * as XLSX from "xlsx";
import {
  getDailyProductLineTotal,
  getDailyProductUnitRate,
} from "./dailyReportProduct";
import { buildPrintLayoutAoa } from "./dateRangeReportExcel";
import { formatExcelDateDDMMYY } from "./reportPayloadDate";

const VOUCHER_SEQ_KEY = "salesImportVoucherSeq";

const SALES_LEDGER_FIXED = "શ્રી.સા.મ.કે. વેચાણ";

/** Data columns in voucher import sheet (S No … Item name). */
const DATA_COLS = 14;
const TRAILING_EMPTY_COLS = 8;

function padRow(row) {
  const out = [...row];
  while (out.length < DATA_COLS + TRAILING_EMPTY_COLS) {
    out.push("");
  }
  return out;
}

/**
 * Next voucher number for today: YYMMDD_01, YYMMDD_02, … (per browser, localStorage).
 */
export function getNextSalesImportVoucherNumber(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const dayKey = `${yy}${mm}${dd}`;

  let state = { dayKey: "", seq: 0 };
  try {
    const raw = localStorage.getItem(VOUCHER_SEQ_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.dayKey === dayKey && typeof parsed.seq === "number") {
        state = parsed;
      }
    }
  } catch {
    /* ignore */
  }

  const seq = state.dayKey === dayKey ? state.seq + 1 : 1;
  localStorage.setItem(VOUCHER_SEQ_KEY, JSON.stringify({ dayKey, seq }));

  return `${dayKey}_${String(seq).padStart(2, "0")}`;
}

/** DD-MM-YY (aligned with report Excel exports). */
export function formatSalesImportDate(date = new Date()) {
  return formatExcelDateDDMMYY(date);
}

/** Narration: stall_date_time */
export function buildSalesImportNarration(stallName, date = new Date()) {
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const stall = (stallName || "").trim() || "Stall";
  return `${stall}_${formatExcelDateDDMMYY(date)}_${hh}:${min}`;
}

function lineTotalBuyingAmount(product) {
  if (
    product &&
    product.totalBuyingAmount != null &&
    product.totalBuyingAmount !== undefined
  ) {
    const n = Number(product.totalBuyingAmount);
    if (Number.isFinite(n)) return n;
  }
  return getDailyProductLineTotal(product);
}

/** Rate: prefer API `price`, else derived unit rate. */
function lineRateFromApi(product) {
  if (product && product.price != null && product.price !== undefined) {
    const p = Number(product.price);
    if (Number.isFinite(p) && p !== 0) return p;
  }
  return getDailyProductUnitRate(product);
}

const VOUCHER_HEADER = padRow([
  "S No",
  "Voucher Type",
  "Voucher Number",
  "Date",
  "S Drs",
  "Sales",
  "Amount",
  "Narration",
  "Stock Item Name",
  "Actual Qty",
  "Bill Qty",
  "Rate",
  "Amount",
  "Item name",
]);

/**
 * Sheet rows for Tally-style sales voucher (14 data columns + padding).
 * Increments voucher sequence once per call (use when user triggers modal print export).
 */
export function buildSalesVoucherImportRows(products, stallName, date = new Date()) {
  const voucherNumber = getNextSalesImportVoucherNumber(date);
  const dateStr = formatSalesImportDate(date);
  const narration = buildSalesImportNarration(stallName, date);
  const sDrs = (stallName || "").trim() || "";

  const rows = [VOUCHER_HEADER];

  (products || []).forEach((product, index) => {
    const qty = Number(product.totalBuyingCount) || 0;
    const rate = lineRateFromApi(product);
    const amount = lineTotalBuyingAmount(product);
    const itemName = product.name ?? "";
    rows.push(
      padRow([
        index + 1,
        "Sales",
        voucherNumber,
        dateStr,
        sDrs,
        SALES_LEDGER_FIXED,
        amount,
        narration,
        product.productId ?? "",
        qty,
        qty,
        rate,
        amount,
        itemName,
      ])
    );
  });

  return { rows, voucherNumber };
}

function safeVoucherFilePart(voucherNumber) {
  return String(voucherNumber).replace(/[/\\?%*:|"<>]/g, "-");
}

/** Spec for styled Excel export (toolbar voucher download). */
export function buildSalesImportExportSpec(
  products,
  stallName,
  voucherDate = new Date()
) {
  const d =
    voucherDate instanceof Date && !Number.isNaN(voucherDate.getTime())
      ? voucherDate
      : new Date();
  const { rows, voucherNumber } = buildSalesVoucherImportRows(
    products,
    stallName,
    d
  );
  const fileName = `S_Import_${safeVoucherFilePart(voucherNumber)}.xlsx`;
  return { rows, fileName, voucherNumber };
}

/** Spec for styled Excel export (modal print: voucher + print layout sheets). */
export function buildModalPrintSalesExportSpec(
  products,
  stallName,
  printSheetParams
) {
  const now = new Date();
  const { rows, voucherNumber } = buildSalesVoucherImportRows(
    products,
    stallName,
    now
  );
  const fileName = `Sales_print_${safeVoucherFilePart(voucherNumber)}.xlsx`;
  const sheets = [
    { name: "Sales voucher", aoa: rows },
    { name: "Print layout", aoa: buildPrintLayoutAoa(printSheetParams) },
  ];
  return { sheets, fileName, voucherNumber };
}

/**
 * Modal Print: Sheet1 = voucher import (14 cols), Sheet2 = print layout.
 */
export function buildModalPrintSalesWorkbook(products, stallName, printSheetParams) {
  const now = new Date();
  const { rows, voucherNumber } = buildSalesVoucherImportRows(
    products,
    stallName,
    now
  );

  const workbook = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, ws1, "Sales voucher");

  const ws2 = XLSX.utils.aoa_to_sheet(buildPrintLayoutAoa(printSheetParams));
  XLSX.utils.book_append_sheet(workbook, ws2, "Print layout");

  const safeVoucher = voucherNumber.replace(/[/\\?%*:|"<>]/g, "-");
  const fileName = `Sales_print_${safeVoucher}.xlsx`;

  return { workbook, voucherNumber, fileName };
}

/**
 * Toolbar download: single sheet, table data only (products + categories).
 */
export function buildSalesReportTableDataOnlyWorkbook({
  filteredProducts = [],
  filteredCategory = [],
  totalAmount = 0,
}) {
  const aoa = [];
  aoa.push([
    "Sr. No.",
    "Product ID",
    "Product Name",
    "Quantity",
    "Rate",
    "Amount",
  ]);
  filteredProducts.forEach((p, i) => {
    aoa.push([
      i + 1,
      p.productId ?? "",
      p.name ?? "",
      p.totalBuyingCount ?? 0,
      getDailyProductUnitRate(p),
      getDailyProductLineTotal(p),
    ]);
  });
  aoa.push([]);
  aoa.push(["", "", "", "", "Total:", totalAmount]);
  aoa.push([]);
  aoa.push(["Sr. No.", "Category Name", "Total Quantity", "Total Amount"]);
  filteredCategory.forEach((c, i) => {
    aoa.push([
      i + 1,
      c.categoryName ?? "",
      c.totalQuantity ?? 0,
      c.totalAmount ?? 0,
    ]);
  });
  aoa.push([]);
  aoa.push(["", "", "Total:", totalAmount]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(aoa),
    "Table data"
  );
  return workbook;
}

/**
 * Single-sheet Tally-style sales voucher export (voucher # / date use `voucherDate`).
 * @deprecated Use buildSalesVoucherImportRows + sheet builder; kept for compatibility.
 */
export function buildSalesImportWorkbook(
  products,
  stallName,
  voucherDate = new Date()
) {
  const d =
    voucherDate instanceof Date && !Number.isNaN(voucherDate.getTime())
      ? voucherDate
      : new Date();
  const { rows, voucherNumber } = buildSalesVoucherImportRows(
    products,
    stallName,
    d
  );
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "M1");

  const safeVoucher = voucherNumber.replace(/[/\\?%*:|"<>]/g, "-");
  const fileName = `S_Import_${safeVoucher}.xlsx`;

  return { workbook, voucherNumber, fileName };
}

export function workbookToBlob(workbook) {
  const workbookOut = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  return new Blob([workbookOut], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
