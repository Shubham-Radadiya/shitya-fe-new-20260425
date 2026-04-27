import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import "./index.css";
import { useBhet } from "../../store/invoice/InvoiceReducer";
import { AiOutlinePrinter } from "react-icons/ai";
import ReactToPrint from "react-to-print";
import { REQUEST_BHET_DATA } from "../../store/invoice/InvoiceAction";
import { API_URL } from "../../constant/config";
import invoiceServices from "../../services/invoice.services";
import download from "../images/download.png";
import { ReportTablesLoaderWrap } from "./ReportTableLoader";
import { formatInr } from "../../utils/formatInr";
import ReportEntryModeToolbar from "./ReportEntryModeToolbar";
import {
  filterNestedUserDataByMode,
  listIndianFYOptions,
} from "../../utils/reportEntryFilters";
import {
  bucketAmountsFromBuyingCategories,
  sumBuckets,
  buildDayRowsForYmdRange,
  buildFiscalMonthRowsFromUsers,
} from "../../utils/reportCategoryAggregation";
import {
  ReportMergedUserProductsCategories,
  ReportCategoryPeriodTable,
} from "./ReportSharedTables";
import {
  formatLocalDateYMD,
  formatReportMonthWiseDateLabel,
  formatExcelDateDDMMYY,
} from "../../utils/reportPayloadDate";
import { reportCategoryPeriodRowHasValue } from "../../utils/reportNonZeroRows";
import {
  buildEntryToolbarReportTitleRows,
  buildAlignedPeriodCategoryFooterRow,
  tableRowsForExport,
  appendMergedEntryTableFooter,
} from "../../utils/reportDomExcelExport";
import { reportExcelBlobFromAoa } from "../../utils/reportExcelStyled";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import { useAdminReportBranch } from "../../context/AdminReportBranchContext";
import { saveReportExcelWithToast } from "../../utils/excelExport";
import { toast } from "react-toastify";

const BhetReport = () => {
  const componentRef = useRef();
  const exportTableRef = useRef();
  const dispatch = useDispatch();
  const { reportExportDirectoryHandle } = useStoreSettings();
  const { bhetData, bhetDataLoading } = useBhet();
  const defaultFy = useMemo(
    () => listIndianFYOptions(12)[0]?.value ?? new Date().getFullYear(),
    []
  );
  const bhetStoreWide = useMemo(() => {
    try {
      const r = localStorage.getItem("role");
      return r === "SUPER ADMIN" || r === "MANAGER";
    } catch {
      return false;
    }
  }, []);
  const adminBranch = useAdminReportBranch();
  const reportBranchForApi =
    bhetStoreWide && adminBranch?.reportBranchName
      ? adminBranch.reportBranchName
      : undefined;
  const [entryMode, setEntryMode] = useState("entry");
  const [filterDateRangeStart, setFilterDateRangeStart] = useState(() => new Date());
  const [filterDateRangeEnd, setFilterDateRangeEnd] = useState(() => new Date());
  const [filterMonthDate, setFilterMonthDate] = useState(() => new Date());
  const [fyStartYear, setFyStartYear] = useState(() => defaultFy);
  const [entrySummaryUsers, setEntrySummaryUsers] = useState([]);
  const [entrySummaryLoading, setEntrySummaryLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInvoiceData = async (invoiceId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/bhet/${invoiceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch invoice data");

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      return null;
    }
  };

  const fetchInvoiceDataForModal = async (invoiceId) => {
    const data = await fetchInvoiceData(invoiceId);
    if (data) {
      setSelectedInvoice(data);
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    dispatch({
      type: REQUEST_BHET_DATA,
      payload: {
        isReturned: false,
        storeWide: bhetStoreWide,
        ...(reportBranchForApi ? { branchName: reportBranchForApi } : {}),
      },
    });
  }, [dispatch, bhetStoreWide, reportBranchForApi]);

  useEffect(() => {
    let cancelled = false;
    setEntrySummaryLoading(true);
    invoiceServices
      .getBhetEntrySummary(false, {
        storeWide: bhetStoreWide,
        branchName: reportBranchForApi,
      })
      .then((data) => {
        if (!cancelled) {
          setEntrySummaryUsers(Array.isArray(data) ? data : []);
          setEntrySummaryLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntrySummaryUsers([]);
          setEntrySummaryLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bhetStoreWide, reportBranchForApi]);

  const tableLoading = bhetDataLoading;

  const handleFilterDateRangeChange = useCallback((start, end) => {
    if (!start) return;
    if (end == null) {
      setFilterDateRangeStart(start);
      setFilterDateRangeEnd(null);
      return;
    }
    if (start.getTime() <= end.getTime()) {
      setFilterDateRangeStart(start);
      setFilterDateRangeEnd(end);
    } else {
      setFilterDateRangeStart(end);
      setFilterDateRangeEnd(start);
    }
  }, []);

  const sortedBhetUsers = useMemo(() => {
    if (!Array.isArray(bhetData)) return [];
    return bhetData.map((user) => ({
      ...user,
      data: [...(user.data || [])].sort(
        (a, b) => Number(a.billId) - Number(b.billId)
      ),
    }));
  }, [bhetData]);

  const filteredBhetUsers = useMemo(
    () =>
      filterNestedUserDataByMode(sortedBhetUsers, entryMode, {
        dateRangeStart: filterDateRangeStart,
        dateRangeEnd: filterDateRangeEnd,
        monthDate: filterMonthDate,
        fyStartYear,
      }),
    [
      sortedBhetUsers,
      entryMode,
      filterDateRangeStart,
      filterDateRangeEnd,
      filterMonthDate,
      fyStartYear,
    ]
  );

  const monthYmdBounds = useMemo(() => {
    const d = filterMonthDate;
    const y = d.getFullYear();
    const m = d.getMonth();
    return {
      start: formatLocalDateYMD(new Date(y, m, 1)),
      end: formatLocalDateYMD(new Date(y, m + 1, 0)),
    };
  }, [filterMonthDate]);

  const bhetDateDocRows = useMemo(() => {
    if (entryMode !== "date") return [];
    const rows = [];
    filteredBhetUsers.forEach((user, userIndex) => {
      (user.data || []).forEach((invoice, invoiceIndex) => {
        const buckets = bucketAmountsFromBuyingCategories(invoice.categories);
        const row = {
          key: `d-${userIndex}-${invoiceIndex}-${invoice.billId}`,
          docNo: invoice.billId,
          reportType: "Bhet",
          periodLabel: String(invoice.billId ?? "—"),
          secondaryPeriodLabel: formatReportMonthWiseDateLabel(
            formatLocalDateYMD(invoice.createdAt)
          ),
          buckets,
          amount: sumBuckets(buckets),
          actionPrimary: (
            <span
              style={{ fontSize: "26px", cursor: "pointer" }}
              onClick={() => fetchInvoiceDataForModal(invoice.billId)}
              title="Print / preview"
            >
              <AiOutlinePrinter />
            </span>
          ),
          actionSecondary: null,
        };
        if (reportCategoryPeriodRowHasValue(row)) rows.push(row);
      });
    });
    return rows;
  }, [entryMode, filteredBhetUsers]);

  const bhetMonthDayRows = useMemo(() => {
    if (entryMode !== "month") return [];
    return buildDayRowsForYmdRange(
      filteredBhetUsers,
      monthYmdBounds.start,
      monthYmdBounds.end
    )
      .map((d) => ({
        key: d.ymd,
        periodLabel: d.dateLabel,
        buckets: d.buckets,
        amount: d.amount,
      }))
      .filter(reportCategoryPeriodRowHasValue);
  }, [entryMode, filteredBhetUsers, monthYmdBounds]);

  const bhetYearMonthRows = useMemo(() => {
    if (entryMode !== "year") return [];
    return buildFiscalMonthRowsFromUsers(filteredBhetUsers, fyStartYear)
      .map((m) => ({
        key: m.key,
        periodLabel: formatExcelDateDDMMYY(m.monthDate),
        buckets: m.buckets,
        amount: m.amount,
      }))
      .filter(reportCategoryPeriodRowHasValue);
  }, [entryMode, filteredBhetUsers, fyStartYear]);

  const bhetDateDocFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of bhetDateDocRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [bhetDateDocRows]);

  const monthDayFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of bhetMonthDayRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [bhetMonthDayRows]);

  const yearMonthFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of bhetYearMonthRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [bhetYearMonthRows]);

  const exportToExcel = async () => {
    try {
      const titleAndDate = buildEntryToolbarReportTitleRows({
        reportTitle: "Bhet Report",
        entryMode,
        filterDateRangeStart,
        filterDateRangeEnd,
        filterMonthDate,
        monthYmdBounds,
        fyStartYear,
      });

      let tableData = [];
      if (entryMode === "entry") {
        const tables = Array.from(
          exportTableRef.current?.querySelectorAll("table.userreport-table") || []
        );
        for (const tbl of tables) {
          tableData.push(...tableRowsForExport(tbl));
          appendMergedEntryTableFooter(tbl, tableData);
          tableData.push([]);
        }
      } else {
        const table = exportTableRef.current?.querySelector("table.userreport-table");
        if (!table) return;
        tableData = tableRowsForExport(table);
        const footer =
          entryMode === "date"
            ? bhetDateDocFooter
            : entryMode === "month"
            ? monthDayFooter
            : yearMonthFooter;
        tableData.push(buildAlignedPeriodCategoryFooterRow(entryMode, footer));
      }

      const fullAoa = [...titleAndDate, ...tableData];
      const blob = await reportExcelBlobFromAoa(fullAoa, "Report");
      await saveReportExcelWithToast(
        blob,
        "BhetReport.xlsx",
        reportExportDirectoryHandle
      );
    } catch (e) {
      console.error(e);
      toast.error("Could not create Excel.");
    }
  };

  const totalQuantity = selectedInvoice?.productId.reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {}, [selectedInvoice]);

  return (
    <>
      <div className="user-template bhet-report-root">
        <div className="user-container">
          <div
            className="userreport-box"
            style={{
              justifyContent: "space-between",
              width: "100%",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <ReportEntryModeToolbar
                mode={entryMode}
                onModeChange={setEntryMode}
                dateRangeStart={filterDateRangeStart}
                dateRangeEnd={filterDateRangeEnd}
                onDateRangeChange={handleFilterDateRangeChange}
                monthDate={filterMonthDate}
                onMonthDateChange={setFilterMonthDate}
                fyStartYear={fyStartYear}
                onFyStartYearChange={setFyStartYear}
                disabled={tableLoading}
              />
            </div>
            <div className="tfootgroup">
              <div
                className="report-action-download--primary report-action-download--bhet"
                onClick={exportToExcel}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") exportToExcel();
                }}
                title="Export to Excel"
              >
                <img style={{ width: "50px" }} src={download} alt="Download Excel" />
              </div>
              {/* <button className="userreprt-button" onClick={exportToExcel}>
                Export to Excel
              </button> */}
            </div>
          </div>

          <ReportTablesLoaderWrap
            loading={tableLoading || (entryMode === "entry" && entrySummaryLoading)}
            label="Loading report…"
            className="userreport-table-wrapper bhet-report-table-wrapper"
            minHeight={200}
          >
            <div className="bhet-report-table-inner" ref={exportTableRef}>
              {entryMode === "entry" && (
                <ReportMergedUserProductsCategories
                  users={entrySummaryUsers}
                  categorySubtitle="... Category Wise Bhet Report ..."
                  tableClassName="userreport-table bhet-report-table"
                />
              )}
              {entryMode === "date" && (
                <ReportCategoryPeriodTable
                  periodColumnLabel="Bhet No."
                  secondaryPeriodColumnLabel="Date"
                  showDocColumns={false}
                  showActionColumn={false}
                  rows={bhetDateDocRows}
                  footerBuckets={bhetDateDocFooter.colSums}
                  footerTotal={bhetDateDocFooter.grand}
                  emptyMessage="No data found"
                  className="userreport-table bhet-report-table"
                />
              )}
              {entryMode === "month" && (
                <ReportCategoryPeriodTable
                  periodColumnLabel="Date"
                  showDocColumns={false}
                  showActionColumn={false}
                  rows={bhetMonthDayRows}
                  footerBuckets={monthDayFooter.colSums}
                  footerTotal={monthDayFooter.grand}
                  emptyMessage="No data found"
                  className="userreport-table bhet-report-table"
                />
              )}
              {entryMode === "year" && (
                <ReportCategoryPeriodTable
                  periodColumnLabel="Month"
                  showDocColumns={false}
                  showActionColumn={false}
                  rows={bhetYearMonthRows}
                  footerBuckets={yearMonthFooter.colSums}
                  footerTotal={yearMonthFooter.grand}
                  emptyMessage="No data found"
                  className="userreport-table bhet-report-table"
                />
              )}
            </div>
          </ReportTablesLoaderWrap>
        </div>
      </div>

      {isModalOpen &&
        selectedInvoice &&
        Object.keys(selectedInvoice).length > 0 && (
          <>
            <div
              className="modal-overlay"
              onClick={() => setIsModalOpen(false)}
            ></div>
            <div className="purchase-modal">
              <div className="purchase-modal-content">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </p>
                  <h2>Bhet No.: {selectedInvoice.billId}</h2>

                  <p>
                    <strong>Total Amount:</strong>{" "}
                    {selectedInvoice.totalAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <table
                  border="1"
                  width="100%"
                  style={{ borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>Pro. Id</th>
                      <th style={{ width: "25%" }}>Product Name</th>
                      <th style={{ width: "5%" }}>Qty</th>
                      <th style={{ width: "7%" }}>Rate</th>
                      <th style={{ width: "7%" }}>Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.productId.map((product, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: "left", width: "5%" }}>
                          {product._id.productId}
                        </td>
                        <td style={{ textAlign: "left", width: "25%" }}>
                          {product._id.name}
                        </td>
                        <td style={{ textAlign: "right", width: "5%" }}>
                          {formatInr(product.quantity, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td style={{ textAlign: "right", width: "7%" }}>
                          {formatInr(product.price, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td style={{ textAlign: "right", width: "7%" }}>
                          {formatInr(product.price * product.quantity, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  className="print-button"
                  style={{ marginRight: "10px" }}
                >
                  <ReactToPrint
                    trigger={() => (
                      <p style={{ fontSize: "0.82rem", cursor: "pointer" }}>
                        Print Bill
                      </p>
                    )}
                    content={() => componentRef.current}
                    removeAfterPrint={false}
                  />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="print-button"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}

      <div ref={componentRef} className="print-content">
        <h1
          style={{
            padding: "11px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "0",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          Jay Swaminarayan
        </h1>
        <div className="bill_header_sub">
          <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold" }}>
            Date :- {new Date(selectedInvoice?.createdAt).toLocaleDateString()}
          </p>
          <h8
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "bold",
              paddingRight: "5px",
            }}
          >
            Bhet No.: {selectedInvoice?.billId}
          </h8>
        </div>
        <div className="bill_header_main"></div>
        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 12px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />

          <div
            className="pavti_title_head"
            style={{ height: "24px", alignItems: "center", width: "380px" }}
          >
            <p
              className="pavti_title"
              style={{
                width: "52px",
                textAlign: "center",
                fontWeight: "bold",
                borderRight: "1px solid",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ID
            </p>
            <p
              className="pavti_title"
              style={{
                width: "208px",
                textAlign: "left",
                fontWeight: "bold",
                borderRight: "1px solid",
                paddingLeft: "4px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Item
            </p>
            <p
              className="pavti_title"
              style={{
                width: "40px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Qty
            </p>
            <p
              className="pavti_title"
              style={{
                width: "80px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Amt
            </p>
          </div>
          <hr style={{ borderTop: "solid 1px" }} />
          {selectedInvoice === null ? (
            <p>Loading...</p>
          ) : selectedInvoice?.productId?.length > 0 ? (
            selectedInvoice.productId.map((product, i) => (
              <div key={i}>
                <div className="pavti_data_1" style={{ width: "380px" }}>
                  <p
                    title={product.productId}
                    className="pavti_product_Id_1"
                    style={{
                      textAlign: "left",
                      width: "52px",
                      borderRight: "1px solid",
                      fontSize: "15px",
                    }}
                  >
                    {product._id.productId}
                  </p>
                  <h3
                    className="pavti_product_name_1"
                    style={{
                      width: "208px",
                      borderRight: "1px solid",
                      paddingLeft: "4px",
                      fontSize: "15px",
                    }}
                  >
                    {" "}
                    {product._id.name}
                  </h3>
                  <div className="pavti_data_quantity">
                    <span style={{ fontSize: "15px" }}>
                      {new Intl.NumberFormat("en-IN").format(product.quantity)}
                    </span>
                  </div>
                  <p
                    className="product_price_report"
                    style={{ fontSize: "15px", textAlign: "center" }}
                  >
                    {new Intl.NumberFormat("en-IN").format(
                      product.price * product.quantity
                    )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p>No data available</p>
          )}

          <hr style={{ borderTop: "solid 1px" }} />
          <hr style={{ borderTop: "solid 1px", margin: "0px" }} />
          <div
            className="pavti_total"
            style={{ height: "30px", alignItems: "center", width: "380px" }}
          >
            <p
              style={{
                width: "265px",
                margin: 0,
                textAlign: "left",
                fontWeight: "bold",
                height: "32px",
                display: "flex",
                alignItems: "Center",
                justifyContent: "center",
                borderRight: "1px solid",
              }}
            >
              Total
            </p>
            <p
              style={{
                width: "40px",
                margin: 0,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(totalQuantity)}
            </p>
            <p
              style={{
                width: "80px",
                margin: 0,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(
                selectedInvoice?.totalAmount
              )}
            </p>
          </div>

          <hr style={{ borderTop: "solid 2px" }} />
          <p className="pavti_footer_text_report">... Visit Again ...</p>
        </div>
      </div>
    </>
  );
};

export default BhetReport;
