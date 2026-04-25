import React from "react";
import { REPORT_GJ_CATEGORY_LABELS } from "../../utils/reportCategoryAggregation";
import {
  getDailyProductUnitRate,
  getDailyProductLineTotal,
} from "../../utils/dailyReportProduct";

const num = (n) => new Intl.NumberFormat("en-IN").format(Number(n) || 0);

const thNum = {
  width: "9%",
  textAlign: "center",
};

const tdNum = {
  width: "9%",
  textAlign: "end",
};

/**
 * Entry-wise: Sr, optional doc (invoice / bill), Product ID, Name, Qty, Rate, Amount.
 * Pass `docColumnLabel` for purchase/bhet so rows are tied to a document (unlike merged sales daily lines).
 */
export function ReportEntryWiseProductTable({
  lines,
  quantityAbs,
  className = "userreport-table",
  docColumnLabel,
}) {
  if (!lines?.length) return null;
  const showDoc = Boolean(docColumnLabel);
  /** Sr + optional doc + Product ID + Name */
  const headColSpanBeforeQty = showDoc ? 4 : 3;
  const totalQty = lines.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalAmt = lines.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return (
    <table className={className}>
      <thead>
        <tr>
          <th style={{ width: "6%" }}>Sr. No.</th>
          {showDoc && (
            <th style={{ width: "11%", textAlign: "start" }}>{docColumnLabel}</th>
          )}
          <th style={{ width: showDoc ? "10%" : "11%", textAlign: "start" }}>
            Product ID
          </th>
          <th style={{ textAlign: "start" }}>Product Name</th>
          <th style={{ width: "10%", textAlign: "end" }}>Quantity</th>
          <th style={{ width: "10%", textAlign: "end" }}>Rate</th>
          <th style={{ width: "11%", textAlign: "end" }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((row, index) => {
          const q = Number(row.quantity) || 0;
          const showQ = quantityAbs ? Math.abs(q) : q;
          const amt = Number(row.amount) || 0;
          const showAmt = quantityAbs ? Math.abs(amt) : amt;
          return (
            <tr key={row.key || index}>
              <td>{index + 1}</td>
              {showDoc && (
                <td style={{ textAlign: "start" }}>{row.docId != null ? String(row.docId) : "—"}</td>
              )}
              <td style={{ textAlign: "start" }}>{row.productId}</td>
              <td style={{ textAlign: "start" }}>{row.name || "N/A"}</td>
              <td style={{ textAlign: "end" }}>{num(showQ)}</td>
              <td style={{ textAlign: "end" }}>{num(row.rate)}</td>
              <td style={{ textAlign: "end" }}>{num(showAmt)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot className="report-table-themed-tfoot">
        <tr>
          <td colSpan={headColSpanBeforeQty} />
          <td style={{ textAlign: "end", fontWeight: "bold" }}>
            {num(quantityAbs ? Math.abs(totalQty) : totalQty)}
          </td>
          <td />
          <td style={{ textAlign: "end", fontWeight: "bold" }}>
            Total: {num(quantityAbs ? Math.abs(totalAmt) : totalAmt)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

/**
 * FY entry-wise summary: per user, merged `products` + `categories` (same shape as daily sales API).
 */
export function ReportMergedUserProductsCategories({
  users,
  quantityAbs = false,
  emptyMessage = "No data found",
  categorySubtitle = "... Category Wise Report ...",
  tableClassName = "userreport-table",
}) {
  const scalarCatName = (v) => {
    if (v == null) return "";
    return Array.isArray(v) ? String(v[0] ?? "") : String(v);
  };

  if (!users?.length) {
    return (
      <p className="report-table-empty-message" style={{ padding: "24px" }}>
        {emptyMessage}
      </p>
    );
  }

  const hasAny = users.some(
    (u) => (u.products?.length || 0) > 0 || (u.categories?.length || 0) > 0
  );
  if (!hasAny) {
    return (
      <p className="report-table-empty-message" style={{ padding: "24px" }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {users.map((u, userIdx) => {
        const products = u.products || [];
        const categories = u.categories || [];
        if (products.length === 0 && categories.length === 0) return null;

        const productGrand = products.reduce(
          (s, p) => s + getDailyProductLineTotal(p),
          0
        );
        const categoryGrand = categories.reduce(
          (s, c) => s + (Number(c.totalAmount) || 0),
          0
        );
        const showProductGrand = quantityAbs ? Math.abs(productGrand) : productGrand;
        const showCategoryGrand = quantityAbs ? Math.abs(categoryGrand) : categoryGrand;

        return (
          <div key={`merged-user-${userIdx}-${String(u.userId ?? u.userName ?? "")}`}>
            {products.length > 0 && (
              <table className={tableClassName}>
                <thead>
                  <tr>
                    <th style={{ width: "8%" }}>Sr. No.</th>
                    <th style={{ width: "13%", textAlign: "start" }}>Product ID</th>
                    <th style={{ textAlign: "start" }}>Product Name</th>
                    <th style={{ width: "11%", textAlign: "end" }}>Quantity</th>
                    <th style={{ width: "11%", textAlign: "end" }}>Rate</th>
                    <th style={{ width: "13%", textAlign: "end" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const q = Number(product.totalBuyingCount) || 0;
                    const showQ = quantityAbs ? Math.abs(q) : q;
                    const lineTotal = getDailyProductLineTotal(product);
                    const showAmt = quantityAbs ? Math.abs(lineTotal) : lineTotal;
                    return (
                      <tr key={`${String(product.product_id ?? product.productId)}-${index}`}>
                        <td style={{ width: "8%" }}>{index + 1}</td>
                        <td style={{ width: "13%", textAlign: "start" }}>
                          {product.productId}
                        </td>
                        <td style={{ textAlign: "start" }}>{product.name || "N/A"}</td>
                        <td style={{ width: "11%", textAlign: "end" }}>{num(showQ)}</td>
                        <td style={{ width: "11%", textAlign: "end" }}>
                          {num(getDailyProductUnitRate(product))}
                        </td>
                        <td style={{ width: "13%", textAlign: "end" }}>{num(showAmt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot
                  className="report-table-themed-tfoot"
                  style={{ borderTop: "1px solid var(--brown-color)" }}
                >
                  <tr>
                    <td colSpan={5}>
                      <div className="tfootgroup" />
                    </td>
                    <td style={{ textAlign: "end", fontWeight: "bold" }}>
                      Total: {num(showProductGrand)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
            {categories.length > 0 && (
              <>
                <p
                  className="pavti_footer_text_report"
                  style={{
                    fontSize: "1.05rem",
                    margin: "1.25rem 0 0.65rem",
                    textAlign: "center",
                  }}
                >
                  {categorySubtitle}
                </p>
                <table className={tableClassName}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "start" }}>Category</th>
                      <th style={{ width: "28%", textAlign: "end" }}>Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, idx) => {
                      const amt = Number(category.totalAmount) || 0;
                      const showAmt = quantityAbs ? Math.abs(amt) : amt;
                      return (
                        <tr key={`${scalarCatName(category.categoryName)}-${idx}`}>
                          <td style={{ textAlign: "start" }}>
                            {scalarCatName(category.categoryName)}
                          </td>
                          <td style={{ textAlign: "end" }}>{num(showAmt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot
                    className="report-table-themed-tfoot"
                    style={{ borderTop: "1px solid var(--brown-color)" }}
                  >
                    <tr>
                      <td style={{ fontWeight: "bold" }}>Total</td>
                      <td style={{ textAlign: "end", fontWeight: "bold" }}>
                        {num(showCategoryGrand)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Period table: optional doc columns, period label, 6 category columns, amount, optional action (2 cols).
 * Date-wise: pass showDocColumns={false} and showActionColumn={false} for a compact grid.
 */
export function ReportCategoryPeriodTable({
  docColumnLabel = "Invoice No.",
  periodColumnLabel = "Date",
  /** Optional second column before category buckets (e.g. Bill No. + Date). */
  secondaryPeriodColumnLabel,
  showDocColumns = true,
  showActionColumn = true,
  rows,
  footerBuckets,
  footerTotal,
  emptyMessage = "No data found",
  className = "userreport-table",
}) {
  const periodColCount = secondaryPeriodColumnLabel ? 2 : 1;
  const colSpan =
    (showDocColumns ? 2 : 0) +
    periodColCount +
    REPORT_GJ_CATEGORY_LABELS.length +
    1 +
    (showActionColumn ? 2 : 0);
  const totalLabelColSpan = (showDocColumns ? 2 : 0) + periodColCount;
  return (
    <table className={className}>
      <thead>
        <tr>
          {showDocColumns && (
            <>
              <th style={{ width: "8%", textAlign: "center" }}>{docColumnLabel}</th>
              <th style={{ width: "9%", textAlign: "center" }}>Report Type</th>
            </>
          )}
          <th style={{ width: "11%", textAlign: "center" }}>{periodColumnLabel}</th>
          {secondaryPeriodColumnLabel ? (
            <th style={{ width: "11%", textAlign: "center" }}>{secondaryPeriodColumnLabel}</th>
          ) : null}
          {REPORT_GJ_CATEGORY_LABELS.map((lab) => (
            <th key={lab} style={thNum}>
              {lab}
            </th>
          ))}
          <th style={{ ...thNum, width: "8%" }}>Amount</th>
          {showActionColumn && (
            <th style={{ width: "10%", textAlign: "center" }} colSpan={2}>
              Action
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {!rows?.length ? (
          <tr>
            <td colSpan={colSpan} className="report-table-empty-message">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={r.key}>
              {showDocColumns && (
                <>
                  <td style={{ textAlign: "center" }}>{r.docNo}</td>
                  <td style={{ textAlign: "center" }}>{r.reportType}</td>
                </>
              )}
              <td style={{ textAlign: "center" }}>{r.periodLabel}</td>
              {secondaryPeriodColumnLabel ? (
                <td style={{ textAlign: "center" }}>{r.secondaryPeriodLabel ?? "—"}</td>
              ) : null}
              {(r.buckets || []).map((v, i) => (
                <td key={i} style={tdNum}>
                  {num(v)}
                </td>
              ))}
              <td style={tdNum}>{num(r.amount)}</td>
              {showActionColumn && (
                <>
                  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                    {r.actionPrimary}
                  </td>
                  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                    {r.actionSecondary}
                  </td>
                </>
              )}
            </tr>
          ))
        )}
      </tbody>
      {rows?.length > 0 && (
        <tfoot className="report-table-themed-tfoot">
          <tr>
            <td colSpan={totalLabelColSpan} style={{ fontWeight: "bold" }}>
              Total:-
            </td>
            {(footerBuckets || [0, 0, 0, 0, 0, 0]).map((v, i) => (
              <td key={i} style={{ ...tdNum, fontWeight: "bold" }}>
                {num(v)}
              </td>
            ))}
            <td style={{ ...tdNum, fontWeight: "bold" }}>{num(footerTotal)}</td>
            {showActionColumn && <td colSpan={2} />}
          </tr>
        </tfoot>
      )}
    </table>
  );
}
