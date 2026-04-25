import React, { useEffect, useMemo, useState } from "react";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";
import { REQUEST_GET_STOCk } from "../../store/product/ProductAction";
import download from "../images/download.png";
import { ReportTablesLoaderWrap } from "./ReportTableLoader";
import { formatLocalDateYMD } from "../../utils/reportPayloadDate";
import { reportExcelBlobFromAoa } from "../../utils/reportExcelStyled";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import { saveReportExcelWithToast } from "../../utils/excelExport";
import { toast } from "react-toastify";

const nf = new Intl.NumberFormat("en-IN");

const VIEW_MODES = [
  { key: "category", label: "Category wise" },
  { key: "subcategory", label: "Sub category wise" },
  { key: "product", label: "Product wise" },
];

/** Same Indian FY window as the API default (`getCurrentFinancialYear`). */
function getDefaultStockDateRange() {
  const now = new Date();
  const start = new Date(
    now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1,
    3,
    1
  );
  const end = new Date(
    now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear(),
    2,
    31,
    23,
    59,
    59,
    999
  );
  return { start, end };
}

/** Net stock value at current catalog rate (Qty × Rate). */
function stockLineAmount(product) {
  const q = Number(product?.quantity) || 0;
  const r = Number(product?.price) || 0;
  return q * r;
}

function aggregateSubcategory(subcategory) {
  const products = subcategory?.products || [];
  return products.reduce(
    (acc, p) => ({
      qty: acc.qty + (Number(p.quantity) || 0),
      amt: acc.amt + stockLineAmount(p),
    }),
    { qty: 0, amt: 0 }
  );
}

function aggregateCategory(category) {
  const subs = category?.subCategories || [];
  return subs.reduce(
    (acc, sub) => {
      const s = aggregateSubcategory(sub);
      return { qty: acc.qty + s.qty, amt: acc.amt + s.amt };
    },
    { qty: 0, amt: 0 }
  );
}

function aggregateStockGrandTotal(stockList) {
  if (!Array.isArray(stockList)) return { qty: 0, amt: 0 };
  return stockList.reduce(
    (outer, categoryData) => {
      const cats = categoryData?.categories || [];
      const inner = cats.reduce(
        (acc, category) => {
          const s = aggregateCategory(category);
          return { qty: acc.qty + s.qty, amt: acc.amt + s.amt };
        },
        { qty: 0, amt: 0 }
      );
      return { qty: outer.qty + inner.qty, amt: outer.amt + inner.amt };
    },
    { qty: 0, amt: 0 }
  );
}

function eachCategory(stock, fn) {
  (stock || []).forEach((bundle) => {
    (bundle?.categories || []).forEach((cat) => fn(cat));
  });
}

const StockTable = () => {
  const [viewMode, setViewMode] = useState("category");
  const [stockRangeStart, setStockRangeStart] = useState(() => {
    return getDefaultStockDateRange().start;
  });
  const [stockRangeEnd, setStockRangeEnd] = useState(() => {
    return getDefaultStockDateRange().end;
  });
  const dispatch = useDispatch();
  const { reportExportDirectoryHandle } = useStoreSettings();

  const stock = useSelector((state) => state.product?.stock?.data || []);
  const stockLoading = useSelector((state) => state.product?.stockLoading);

  const hasStockRows =
    Array.isArray(stock) &&
    stock.some((c) => Array.isArray(c?.categories) && c.categories.length > 0);

  const grandTotal = useMemo(() => aggregateStockGrandTotal(stock), [stock]);

  const categoryRows = useMemo(() => {
    const rows = [];
    eachCategory(stock, (cat) => {
      const agg = aggregateCategory(cat);
      rows.push({
        key: String(cat.categoryId ?? cat.categoryName),
        categoryName: cat.categoryName,
        qty: agg.qty,
        amt: agg.amt,
      });
    });
    return rows;
  }, [stock]);

  const subcategoryRows = useMemo(() => {
    const rows = [];
    eachCategory(stock, (cat) => {
      (cat?.subCategories || []).forEach((sub) => {
        const agg = aggregateSubcategory(sub);
        rows.push({
          key: `${cat.categoryId ?? cat.categoryName}-${sub.subCategoryId ?? sub.subCategoryName}`,
          categoryName: cat.categoryName,
          subCategoryName: sub.subCategoryName,
          qty: agg.qty,
          amt: agg.amt,
        });
      });
    });
    return rows;
  }, [stock]);

  const productRows = useMemo(() => {
    const rows = [];
    eachCategory(stock, (cat) => {
      (cat?.subCategories || []).forEach((sub) => {
        (sub?.products || []).forEach((p, idx) => {
          rows.push({
            key: `${cat.categoryId}-${sub.subCategoryId}-${p.productId}-${idx}`,
            categoryName: cat.categoryName,
            subCategoryName: sub.subCategoryName,
            productId: p.productId,
            name: p.name,
            quantity: Number(p.quantity) || 0,
            price: Number(p.price) || 0,
            amount: stockLineAmount(p),
          });
        });
      });
    });
    return rows;
  }, [stock]);

  useEffect(() => {
    const endForApi = stockRangeEnd ?? stockRangeStart;
    dispatch({
      type: REQUEST_GET_STOCk,
      payload: {
        startDate: formatLocalDateYMD(stockRangeStart),
        endDate: formatLocalDateYMD(endForApi),
      },
    });
  }, [dispatch, stockRangeStart, stockRangeEnd]);

  const exportToExcel = async () => {
    try {
      let data = [];
      if (viewMode === "category") {
        data = categoryRows.map((r) => ({
          Category: r.categoryName,
          Qty: r.qty,
          Amount: r.amt,
        }));
        data.push({ Category: "Total", Qty: grandTotal.qty, Amount: grandTotal.amt });
      } else if (viewMode === "subcategory") {
        data = subcategoryRows.map((r) => ({
          Category: r.categoryName,
          "Sub category": r.subCategoryName,
          Qty: r.qty,
          Amount: r.amt,
        }));
        data.push({
          Category: "Total",
          "Sub category": "",
          Qty: grandTotal.qty,
          Amount: grandTotal.amt,
        });
      } else {
        data = productRows.map((r) => ({
          Category: r.categoryName,
          "Sub category": r.subCategoryName,
          "Product ID": r.productId,
          Product: r.name,
          Qty: r.quantity,
          Rate: r.price,
          Amount: r.amount,
        }));
        data.push({
          Category: "Total",
          "Sub category": "",
          "Product ID": "",
          Product: "",
          Qty: grandTotal.qty,
          Rate: "",
          Amount: grandTotal.amt,
        });
      }

      const keys = Object.keys(data[0] || {});
      const aoa = [
        keys,
        ...data.map((row) => keys.map((k) => row[k] ?? "")),
      ];
      const blob = await reportExcelBlobFromAoa(aoa, "Stock Report");
      await saveReportExcelWithToast(
        blob,
        "StockReport.xlsx",
        reportExportDirectoryHandle
      );
    } catch (e) {
      console.error(e);
      toast.error("Could not create Excel.");
    }
  };

  const renderTable = () => {
    if (viewMode === "category") {
      return (
        <table className="userreport-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "right", width: "14%" }}>Qty</th>
              <th style={{ textAlign: "right", width: "18%" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {categoryRows.map((r) => (
              <tr key={r.key}>
                <td>{r.categoryName}</td>
                <td style={{ textAlign: "right" }}>{nf.format(r.qty)}</td>
                <td style={{ textAlign: "right" }}>{nf.format(r.amt)}</td>
              </tr>
            ))}
          </tbody>
          {hasStockRows && !stockLoading ? (
            <tfoot className="report-table-themed-tfoot">
              <tr>
                <td style={{ fontWeight: 700 }}>Total</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {nf.format(grandTotal.qty)}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {nf.format(grandTotal.amt)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      );
    }

    if (viewMode === "subcategory") {
      return (
        <table className="userreport-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>Sub category</th>
              <th style={{ textAlign: "right", width: "12%" }}>Qty</th>
              <th style={{ textAlign: "right", width: "16%" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {subcategoryRows.map((r) => (
              <tr key={r.key}>
                <td>{r.categoryName}</td>
                <td>{r.subCategoryName}</td>
                <td style={{ textAlign: "right" }}>{nf.format(r.qty)}</td>
                <td style={{ textAlign: "right" }}>{nf.format(r.amt)}</td>
              </tr>
            ))}
          </tbody>
          {hasStockRows && !stockLoading ? (
            <tfoot className="report-table-themed-tfoot">
              <tr>
                <td colSpan={2} style={{ fontWeight: 700 }}>
                  Total
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {nf.format(grandTotal.qty)}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {nf.format(grandTotal.amt)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      );
    }

    return (
      <table className="userreport-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Category</th>
            <th style={{ textAlign: "left" }}>Sub category</th>
            <th style={{ textAlign: "left", width: "10%" }}>Product ID</th>
            <th style={{ textAlign: "left" }}>Product</th>
            <th style={{ textAlign: "right", width: "9%" }}>Qty</th>
            <th style={{ textAlign: "right", width: "9%" }}>Rate</th>
            <th style={{ textAlign: "right", width: "11%" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {productRows.map((r) => (
            <tr key={r.key}>
              <td>{r.categoryName}</td>
              <td>{r.subCategoryName}</td>
              <td>{r.productId}</td>
              <td>{r.name}</td>
              <td style={{ textAlign: "right" }}>{nf.format(r.quantity)}</td>
              <td style={{ textAlign: "right" }}>{nf.format(r.price)}</td>
              <td style={{ textAlign: "right" }}>{nf.format(r.amount)}</td>
            </tr>
          ))}
        </tbody>
        {hasStockRows && !stockLoading ? (
          <tfoot className="report-table-themed-tfoot">
            <tr>
              <td colSpan={4} style={{ fontWeight: 700 }}>
                Total
              </td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>
                {nf.format(grandTotal.qty)}
              </td>
              <td />
              <td style={{ textAlign: "right", fontWeight: 700 }}>
                {nf.format(grandTotal.amt)}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    );
  };

  const emptyColSpan =
    viewMode === "category" ? 3 : viewMode === "subcategory" ? 4 : 7;

  return (
    <div className="user-template stock-report-root">
      <div className="user-container">
        <div
          className="userreport-box"
          style={{
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            alignItems: "flex-start",
          }}
        >
          <div
            className="report-stock-view-toolbar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              alignItems: "center",
              flex: "1 1 280px",
            }}
            role="tablist"
            aria-label="Stock report view"
          >
            <div
              className="report-entry-toolbar-controls report-date-range-controls"
              style={{ display: "flex", alignItems: "center", gap: "20px" }}
            >
              <FaCalendarAlt style={{ color: "var(--brown-color)" }} aria-hidden />
              <span style={{ fontSize: "15px", fontWeight: 600 }}>Period:</span>
              <DatePicker
                selectsRange
                startDate={stockRangeStart}
                endDate={stockRangeEnd}
                onChange={(dates) => {
                  const [start, end] = dates || [];
                  if (!start) return;
                  /* Keep end null until second click so a real range can be chosen (same as other reports). */
                  if (end == null) {
                    setStockRangeStart(start);
                    setStockRangeEnd(null);
                    return;
                  }
                  if (start.getTime() <= end.getTime()) {
                    setStockRangeStart(start);
                    setStockRangeEnd(end);
                  } else {
                    setStockRangeStart(end);
                    setStockRangeEnd(start);
                  }
                }}
                shouldCloseOnSelect={false}
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select date range"
                className="report-date-picker-input report-entry-toolbar-input report-date-range-picker-input"
                disabled={Boolean(stockLoading)}
                portalId="sahitya-report-datepicker-root"
                popperClassName="report-datepicker-popper"
              />
            </div>
            {VIEW_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={viewMode === m.key}
                className={`report-entry-mode-btn${viewMode === m.key ? " is-active" : ""}`}
                onClick={() => setViewMode(m.key)}
                disabled={Boolean(stockLoading)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div
            className="tfootgroup"
            style={{
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "22px" }}>Stock Report</div>
            <div className="download" onClick={exportToExcel} role="button" tabIndex={0}>
              <img style={{ width: "50px" }} src={download} alt="Download Excel" />
            </div>
          </div>
        </div>
        <ReportTablesLoaderWrap
          loading={Boolean(stockLoading)}
          label="Loading stock…"
          className="userreport-table-wrapper"
          minHeight={200}
        >
          {!stockLoading && !hasStockRows ? (
            <table className="userreport-table">
              <tbody>
                <tr>
                  <td colSpan={emptyColSpan} className="report-table-empty-message">
                    No data found
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            renderTable()
          )}
        </ReportTablesLoaderWrap>
      </div>
    </div>
  );
};

export default StockTable;
