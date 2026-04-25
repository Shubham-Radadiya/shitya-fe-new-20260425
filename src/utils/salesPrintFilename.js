/**
 * Browser "Print to PDF" / print dialog often uses document.title as the default filename.
 * Pattern: {prefix}_{DDMMYY}_{billOrInvoiceRef}
 */

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** DDMMYY from a Date */
export function formatPrintDateCompact(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return (
    pad2(d.getDate()) +
    pad2(d.getMonth() + 1) +
    String(d.getFullYear()).slice(-2)
  );
}

/** Safe fragment for filename (no path chars). */
export function sanitizePrintNumberPart(raw) {
  if (raw == null || raw === "") return "";
  return String(raw)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

/**
 * @param {"sales"|"purchase"|"bhet"|"excel"} kind
 * @param {string} numberPart - bill id, invoice no, etc.
 */
export function buildPrintDocumentTitle(kind, numberPart, date = new Date()) {
  const dmy = formatPrintDateCompact(date);
  const num =
    sanitizePrintNumberPart(numberPart) ||
    `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  const prefix =
    kind === "purchase"
      ? "purchase_print"
      : kind === "bhet"
      ? "bhet_print"
      : kind === "excel"
      ? "excel_print"
      : "sales_print";
  return `${prefix}_${dmy}_${num}`;
}

/**
 * @param {object} opts
 * @param {string} opts.pathname - React Router path e.g. /dashboard, /stock, /bhet
 * @param {string} [opts.billNumber] - sales Sr.No
 * @param {string} [opts.invoiceNumber] - purchase INV
 * @param {string} [opts.bhetNumber]
 * @param {boolean} [opts.showReprintBill]
 * @param {object} [opts.reprintBill]
 */
export function getPrintTitleForBillScreen(opts) {
  const {
    pathname,
    billNumber,
    invoiceNumber,
    bhetNumber,
    showReprintBill,
    reprintBill,
  } = opts;

  const reprintRef =
    showReprintBill &&
    (reprintBill?.billId ??
      reprintBill?.invoiceId ??
      reprintBill?.bhetNo ??
      reprintBill?._id);

  if (pathname === "/stock") {
    const n = reprintRef || invoiceNumber || "NA";
    return buildPrintDocumentTitle("purchase", n);
  }
  if (pathname === "/bhet") {
    const n = reprintRef || bhetNumber || "NA";
    return buildPrintDocumentTitle("bhet", n);
  }
  const n = reprintRef || billNumber || "NA";
  return buildPrintDocumentTitle("sales", n);
}
