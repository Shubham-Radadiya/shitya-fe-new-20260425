import * as XLSX from "xlsx";
import {
  getDailyProductLineTotal,
  getDailyProductUnitRate,
} from "./dailyReportProduct";

/**
 * Sheet 1: structured daily sales from /report/daily.
 * Sheet 2: linear “print layout” snapshot (products, categories, bills, silak summary).
 */
export function buildDailyReportWorkbook({
  storeStallName,
  reportDateLabel,
  currentReport = [],
  filteredProducts = [],
  filteredCategory = [],
  totalAmount = 0,
  totalQuantity = 0,
  /** Print sheet extras */
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
  const reportTitle = storeStallName
    ? `${storeStallName} - Daily Sales Report`
    : "Daily Sales Report";

  const usersLabel = currentReport
    .map((d) => d.userFullName)
    .filter(Boolean)
    .join(", ");

  // —— Sheet 1: Daily report ——
  const sheet1 = [];
  sheet1.push([reportTitle]);
  sheet1.push([`Date: ${reportDateLabel}`]);
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

  // —— Sheet 2: Print layout ——
  const sheet2 = [];
  sheet2.push(["Daily Sale Report"]);
  sheet2.push(["Date", printDateLabel || reportDateLabel]);
  if (usersLabel) sheet2.push(["User(s)", usersLabel]);
  sheet2.push([]);
  sheet2.push(["— Product lines —"]);
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
    sheet2.push([c.categoryName, c.totalAmount]);
  });
  sheet2.push(["Category total", totalAmount]);
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
  (salesData || []).forEach((row) => {
    sheet2.push([
      row.currency,
      row.count,
      (Number(row.currency) || 0) * (Number(row.count) || 0),
    ]);
  });
  sheet2.push(["Currency total", "", silakCurrencyTotal]);

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1);
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2);
  XLSX.utils.book_append_sheet(wb, ws1, "Daily sales");
  XLSX.utils.book_append_sheet(wb, ws2, "Print layout");
  return wb;
}

export function workbookToBlobDaily(wb) {
  const workbookOut = XLSX.write(wb, {
    bookType: "xlsx",
    type: "binary",
  });
  const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  };
  return new Blob([s2ab(workbookOut)], {
    type: "application/octet-stream",
  });
}
