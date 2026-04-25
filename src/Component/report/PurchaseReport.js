import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { API_URL } from "../../constant/config";
import invoiceServices from "../../services/invoice.services";
import "./index.css";

import { REQUEST_INVOICE_DATA } from "../../store/invoice/InvoiceAction";
import { useInvoice } from "../../store/invoice/InvoiceReducer";
import { AiOutlinePrinter } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import Edit from "../images/edit.png";
import { EDIT_PURCHASE_DATA } from "../../store/cart/cartActionType";
import ReactToPrint from "react-to-print";
import download from "../images/download.png";
import { ReportTablesLoaderWrap } from "./ReportTableLoader";
import { formatInr } from "../../utils/formatInr";
import ReportEntryModeToolbar from "./ReportEntryModeToolbar";
import {
  filterNestedUserDataByMode,
  getDefaultBillWiseDateRangeThroughToday,
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
  parseCreatedAtToLocalNoon,
  invoiceIdNumericSortKey,
  compareBillWiseRowsSortKey,
  omitBillWiseRowSortKeys,
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
import { saveReportExcelWithToast } from "../../utils/excelExport";
import { toast } from "react-toastify";

const PurchaseReport = () => {
  const componentRef = useRef();
  const exportTableRef = useRef();

  const dispatch = useDispatch();
  const { reportExportDirectoryHandle } = useStoreSettings();
  const { invoiceData, invoiceDataLoading } = useInvoice(false);
  const defaultFy = useMemo(
    () => listIndianFYOptions(12)[0]?.value ?? new Date().getFullYear(),
    []
  );
  /** MANAGER / SUPER ADMIN: list + entry summary include every user's bills (e.g. 001 by another clerk). */
  const purchaseInvoiceStoreWide = useMemo(() => {
    try {
      const r = localStorage.getItem("role");
      return r === "SUPER ADMIN" || r === "MANAGER";
    } catch {
      return false;
    }
  }, []);
  const [entryMode, setEntryMode] = useState("entry");
  const [filterDateRangeStart, setFilterDateRangeStart] = useState(
    () => getDefaultBillWiseDateRangeThroughToday().start
  );
  const [filterDateRangeEnd, setFilterDateRangeEnd] = useState(
    () => getDefaultBillWiseDateRangeThroughToday().end
  );
  const [filterMonthDate, setFilterMonthDate] = useState(() => new Date());
  const [fyStartYear, setFyStartYear] = useState(() => defaultFy);
  /** Item Wise date range (same UX as sales); drives entry-summary API. To defaults through today like Bill wise. */
  const [entryItemWiseStart, setEntryItemWiseStart] = useState(
    () => getDefaultBillWiseDateRangeThroughToday().start
  );
  const [entryItemWiseEnd, setEntryItemWiseEnd] = useState(
    () => getDefaultBillWiseDateRangeThroughToday().end
  );
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [sortedInvoiceData, setSortedInvoiceData] = useState([]);
  const [entrySummaryUsers, setEntrySummaryUsers] = useState([]);
  const [entrySummaryLoading, setEntrySummaryLoading] = useState(true);

  const fetchInvoiceData = async (invoiceId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/invoice/${invoiceId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch invoice data");

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      return null;
    }
  };

  const fetchInvoiceDataForStock = async (invoiceId) => {
    const data = await fetchInvoiceData(invoiceId);

    const transformedArray = data?.productId.map((item) => ({
      _id: item?._id?._id,
      name: item?._id?.name,
      productId: item?._id?.productId,
      price: item?.price,
      image: item?._id?.image,
      rate: item?._id?.rate,
      remark: item?._id?.remark,
      createdAt: item?._id?.createdAt,
      updatedAt: item?._id?.updatedAt,
      __v: item?._id?.__v,
      isDeActive: item?._id?.item?._id?.updatedAt,
      quantity: item?.quantity,
      priceType: item?._id?.priceType,
    }));

    if (data) {
      navigate("/stock", {
        state: { id: data?._id, invoiceId: data?.invoiceId, edit: true },
      });

      dispatch({ type: EDIT_PURCHASE_DATA, payload: transformedArray });
    }
  };

  const fetchInvoiceDataForModal = async (invoiceId) => {
    const data = await fetchInvoiceData(invoiceId);
    if (data) {
      setSelectedInvoice(data);
      setIsModalOpen(true);
    }
  };

  const invoiceFetchBounds = useMemo(() => {
    const billEnd = filterDateRangeEnd ?? filterDateRangeStart;
    const t1 = entryItemWiseStart.getTime();
    const t2 = entryItemWiseEnd.getTime();
    const t3 = filterDateRangeStart.getTime();
    const t4 = billEnd.getTime();
    return {
      start: new Date(Math.min(t1, t2, t3, t4)),
      end: new Date(Math.max(t1, t2, t3, t4)),
    };
  }, [
    entryItemWiseStart,
    entryItemWiseEnd,
    filterDateRangeStart,
    filterDateRangeEnd,
  ]);

  useEffect(() => {
    dispatch({
      type: REQUEST_INVOICE_DATA,
      payload: {
        isReturned: false,
        startDate: formatLocalDateYMD(invoiceFetchBounds.start),
        endDate: formatLocalDateYMD(invoiceFetchBounds.end),
        storeWide: purchaseInvoiceStoreWide,
      },
    });
  }, [dispatch, invoiceFetchBounds, purchaseInvoiceStoreWide]);

  useEffect(() => {
    let cancelled = false;
    setEntrySummaryLoading(true);
    invoiceServices
      .getInvoicesEntrySummary(
        false,
        {
          startDate: formatLocalDateYMD(entryItemWiseStart),
          endDate: formatLocalDateYMD(entryItemWiseEnd),
        },
        purchaseInvoiceStoreWide
      )
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
  }, [entryItemWiseStart, entryItemWiseEnd, purchaseInvoiceStoreWide]);

  const tableLoading = invoiceDataLoading;

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

  const handleEntryItemWiseRangeChange = useCallback((start, end) => {
    if (!start) return;
    const nextEnd = end ?? start;
    if (start.getTime() <= nextEnd.getTime()) {
      setEntryItemWiseStart(start);
      setEntryItemWiseEnd(nextEnd);
    } else {
      setEntryItemWiseStart(nextEnd);
      setEntryItemWiseEnd(start);
    }
  }, []);

  const filteredInvoiceUsers = useMemo(
    () =>
      filterNestedUserDataByMode(sortedInvoiceData, entryMode, {
        dateRangeStart: filterDateRangeStart,
        dateRangeEnd: filterDateRangeEnd,
        monthDate: filterMonthDate,
        fyStartYear,
      }),
    [
      sortedInvoiceData,
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

  const purchaseDateDocRows = useMemo(() => {
    if (entryMode !== "date") return [];
    const rows = [];
    filteredInvoiceUsers.forEach((user, userIndex) => {
      (user.data || []).forEach((invoice, invoiceIndex) => {
        const buckets = bucketAmountsFromBuyingCategories(invoice.categories);
        const row = {
          key: `d-${userIndex}-${invoiceIndex}-${invoice.invoiceId}`,
          __sortYmd: formatLocalDateYMD(invoice.createdAt),
          __sortBill: invoiceIdNumericSortKey(invoice.invoiceId),
          docNo: invoice.invoiceId,
          reportType: "Purchase",
          periodLabel: String(invoice.invoiceId ?? "—"),
          secondaryPeriodLabel: formatReportMonthWiseDateLabel(
            formatLocalDateYMD(invoice.createdAt)
          ),
          buckets,
          amount: sumBuckets(buckets),
          actionPrimary: (
            <span
              style={{ fontSize: "26px", cursor: "pointer" }}
              onClick={() => fetchInvoiceDataForModal(invoice.invoiceId)}
              title="Print / preview"
            >
              <AiOutlinePrinter />
            </span>
          ),
          actionSecondary: (
            <span
              style={{ fontSize: "26px", cursor: "pointer" }}
              onClick={() => fetchInvoiceDataForStock(invoice.invoiceId)}
              title="Edit stock"
            >
              <img style={{ width: "20px" }} src={Edit} alt="edit" />
            </span>
          ),
        };
        if (reportCategoryPeriodRowHasValue(row)) rows.push(row);
      });
    });
    rows.sort(compareBillWiseRowsSortKey);
    return rows.map(omitBillWiseRowSortKeys);
  }, [entryMode, filteredInvoiceUsers]);

  const purchaseMonthDayRows = useMemo(() => {
    if (entryMode !== "month") return [];
    return buildDayRowsForYmdRange(
      filteredInvoiceUsers,
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
  }, [entryMode, filteredInvoiceUsers, monthYmdBounds]);

  const purchaseYearMonthRows = useMemo(() => {
    if (entryMode !== "year") return [];
    return buildFiscalMonthRowsFromUsers(
      filteredInvoiceUsers,
      fyStartYear
    )
      .map((m) => ({
        key: m.key,
        periodLabel: formatExcelDateDDMMYY(m.monthDate),
        buckets: m.buckets,
        amount: m.amount,
      }))
      .filter(reportCategoryPeriodRowHasValue);
  }, [entryMode, filteredInvoiceUsers, fyStartYear]);

  const purchaseDateDocFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of purchaseDateDocRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [purchaseDateDocRows]);

  const monthDayFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of purchaseMonthDayRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [purchaseMonthDayRows]);

  const yearMonthFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of purchaseYearMonthRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [purchaseYearMonthRows]);

  const exportToExcel = async () => {
    try {
      const titleAndDate = buildEntryToolbarReportTitleRows({
        reportTitle: "Purchase Report",
        entryMode,
        entryItemWiseStart,
        entryItemWiseEnd,
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
            ? purchaseDateDocFooter
            : entryMode === "month"
            ? monthDayFooter
            : yearMonthFooter;
        tableData.push(buildAlignedPeriodCategoryFooterRow(entryMode, footer));
      }

      const fullAoa = [...titleAndDate, ...tableData];
      const blob = await reportExcelBlobFromAoa(fullAoa, "Report");
      await saveReportExcelWithToast(
        blob,
        "PurchaseReport.xlsx",
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
  useEffect(() => {
    if (!Array.isArray(invoiceData) || invoiceData.length === 0) {
      setSortedInvoiceData([]);
      return;
    }
    const sortedData = invoiceData.map((user) => ({
      ...user,
      data: [...user.data].sort((a, b) => {
        const dateA = parseCreatedAtToLocalNoon(a.createdAt)?.getTime() ?? 0;
        const dateB = parseCreatedAtToLocalNoon(b.createdAt)?.getTime() ?? 0;

        const numA = parseInt(String(a.invoiceId).replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(String(b.invoiceId).replace(/\D/g, ""), 10) || 0;

        if (dateA !== dateB) return dateA - dateB;

        return numA - numB;
      }),
    }));

    setSortedInvoiceData(sortedData);
  }, [invoiceData]);

  return (
    <>
      <div className="user-template purchase-report-root">
        <div className="user-container">
          <div
            className="userreport-box"
            style={{ justifyContent: "flex-end" }}
          >
            <div className="tfootgroup" style={{justifyContent:"space-between", width:"100%", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
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
                  showPurchaseItemWiseDateRange
                  entryItemWiseStart={entryItemWiseStart}
                  entryItemWiseEnd={entryItemWiseEnd}
                  onEntryItemWiseRangeChange={handleEntryItemWiseRangeChange}
                />
              </div>
              <div
                className="report-action-download--primary report-action-download--purchase"
                onClick={exportToExcel}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") exportToExcel();
                }}
                title="Export to Excel"
              >
               <img style={{width:"50px"}} src={download} alt="Download Excel" />
              </div>
              {/* <button className="userreprt-button" onClick={exportToExcel}>
                Export to Excel
              </button> */}
            </div>
          </div>

          <ReportTablesLoaderWrap
            loading={tableLoading || (entryMode === "entry" && entrySummaryLoading)}
            label="Loading report…"
            className="userreport-table-wrapper purchase-report-table-wrapper"
            minHeight={200}
          >
            <div className="purchase-report-table-inner" ref={exportTableRef}>
              {entryMode === "entry" && (
                <ReportMergedUserProductsCategories
                  users={entrySummaryUsers}
                  categorySubtitle="... Category Wise Purchase Report ..."
                  tableClassName="userreport-table purchase-report-table"
                />
              )}
              {entryMode === "date" && (
                <ReportCategoryPeriodTable
                  periodColumnLabel="Bill No."
                  secondaryPeriodColumnLabel="Date"
                  showDocColumns={false}
                  showActionColumn={false}
                  rows={purchaseDateDocRows}
                  footerBuckets={purchaseDateDocFooter.colSums}
                  footerTotal={purchaseDateDocFooter.grand}
                  emptyMessage="No data found"
                  className="userreport-table purchase-report-table"
                />
              )}
              {entryMode === "month" && (
                <ReportCategoryPeriodTable
                  periodColumnLabel="Date"
                  showDocColumns={false}
                  showActionColumn={false}
                  rows={purchaseMonthDayRows}
                  footerBuckets={monthDayFooter.colSums}
                  footerTotal={monthDayFooter.grand}
                  emptyMessage="No data found"
                  className="userreport-table purchase-report-table"
                />
              )}
              {entryMode === "year" && (
                <ReportCategoryPeriodTable
                  periodColumnLabel="Month"
                  showDocColumns={false}
                  showActionColumn={false}
                  rows={purchaseYearMonthRows}
                  footerBuckets={yearMonthFooter.colSums}
                  footerTotal={yearMonthFooter.grand}
                  emptyMessage="No data found"
                  className="userreport-table purchase-report-table"
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
                  <h2>Bill No.: {selectedInvoice.invoiceId}</h2>

                  <p>
                    <strong>Total Amount:</strong>
                    {" "}{selectedInvoice.totalAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <table
                  border="1"
                  width="100%"
                  style={{ borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th style={{width:"6%"}}>Pro. Id</th>
                      <th style={{width:"24%"}}>Product Name</th>
                      <th style={{width:"5%"}}>Qty</th>
                      <th style={{width:"7%"}}>Rate</th>
                      <th style={{width:"7%"}}>Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.productId.map((product, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: "left", width:"6%" }}>
                          {product._id.productId}
                        </td>
                        <td style={{ textAlign: "left", width:"24%" }}>
                          {product._id.name}
                        </td>
                        <td style={{ textAlign: "right", width:"5%" }}>
                          {formatInr(product.quantity, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td style={{ textAlign: "right", width:"7%" }}>
                          {formatInr(product.price, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td style={{ textAlign: "right", width:"7%" }}>
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
            Bill No.: {selectedInvoice?.invoiceId}
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

export default PurchaseReport;
