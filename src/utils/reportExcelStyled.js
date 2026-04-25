import ExcelJS from "exceljs";

/** Light green background (readable with bold black text). */
const TOTAL_ROW_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFC6EFCE" },
};

function normCell(v) {
  if (v == null) return "";
  return String(v).replace(/\u00a0/g, " ").trim();
}

/**
 * Detects footer / summary rows that should be bold + green in report Excel exports.
 * Avoids column headers like "Total Qty" (first non-empty cell is not exactly `Total`).
 */
export function isReportTotalRow(values) {
  if (!Array.isArray(values) || values.length === 0) return false;
  const cells = values.map(normCell);
  const firstNonEmpty = cells.find((s) => s.length > 0) ?? "";

  if (/^Overall Totals$/i.test(firstNonEmpty)) return true;
  if (/^Total:-/i.test(firstNonEmpty)) return true;
  if (/^Total$/i.test(firstNonEmpty)) return true;
  if (/^Category total$/i.test(firstNonEmpty)) return true;
  if (/^Bills total$/i.test(firstNonEmpty)) return true;
  if (/^Return total$/i.test(firstNonEmpty)) return true;
  if (/^Currency total$/i.test(firstNonEmpty)) return true;
  if (cells.some((s) => s === "Total:")) return true;

  // Print layout sheet (Gujarati silak summary lines that are numeric totals)
  if (firstNonEmpty === "કુલ બેલેન્સ") return true;
  if (firstNonEmpty.startsWith("ટોટલ")) return true;

  return false;
}

function applyTotalRowStyle(excelRow) {
  excelRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { ...(cell.font || {}), bold: true };
    cell.fill = { ...TOTAL_ROW_FILL };
  });
}

/**
 * @param {unknown[][]} aoa
 * @param {string} sheetName
 * @returns {Promise<Blob>}
 */
export async function reportExcelBlobFromAoa(aoa, sheetName = "Sheet1") {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31) || "Sheet1");

  (aoa || []).forEach((row) => {
    const excelRow = ws.addRow(Array.isArray(row) ? row : []);
    if (isReportTotalRow(row)) applyTotalRowStyle(excelRow);
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * @param {{ name: string, aoa: unknown[][] }[]} sheets
 * @returns {Promise<Blob>}
 */
export async function reportExcelBlobFromSheets(sheets) {
  const wb = new ExcelJS.Workbook();
  for (const sheet of sheets || []) {
    const name = String(sheet.name || "Sheet1").slice(0, 31) || "Sheet1";
    const ws = wb.addWorksheet(name);
    (sheet.aoa || []).forEach((row) => {
      const excelRow = ws.addRow(Array.isArray(row) ? row : []);
      if (isReportTotalRow(row)) applyTotalRowStyle(excelRow);
    });
  }
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
