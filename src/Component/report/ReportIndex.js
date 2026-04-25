/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import ReactToPrint from "react-to-print";
import "./index.css";
// import { NavLink } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../constant/config";
import { REQUEST_BHET_DATA } from "../../store/invoice/InvoiceAction";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import { saveReportExcelWithToast } from "../../utils/excelExport";
import {
  getDailyProductLineTotal,
  getDailyProductUnitRate,
} from "../../utils/dailyReportProduct";
import {
  buildSalesImportExportSpec,
  buildModalPrintSalesExportSpec,
} from "../../utils/salesImportExcel";
import {
  reportExcelBlobFromAoa,
  reportExcelBlobFromSheets,
} from "../../utils/reportExcelStyled";
import { salesPeriodReportExcelBlob } from "../../utils/salesPeriodReportExcelExport";
import { toast } from "react-toastify";
import download from "../images/download.png";
import {
  formatLocalDateYMD,
  enumerateInclusiveYMD,
  formatExcelDateDDMMYY,
} from "../../utils/reportPayloadDate";
import ReportSalesRangeToolbar, {
  resolveSalesReportRange,
} from "./ReportSalesRangeToolbar";
import { listIndianFYOptions } from "../../utils/reportEntryFilters";
import {
  mergeDailyReportUserRows,
  productLineMergeKey,
} from "../../utils/mergeDailyReportUserRows";
import { ReportTableLoadingOverlay } from "./ReportTableLoader";
import {
  bucketAmountsFromDailyCategories,
  sumBuckets,
  buildSalesMonthDayRows,
  buildSalesFiscalMonthRows,
} from "../../utils/reportCategoryAggregation";
import { ReportCategoryPeriodTable } from "./ReportSharedTables";
import {
  mergedDailyProductHasValue,
  mergedDailyCategoryHasValue,
  reportCategoryPeriodRowHasValue,
} from "../../utils/reportNonZeroRows";
import { loadBranchOptionsForForms } from "../../utils/branchOptionsClient";

const initialData = [
  { currency: "500", count: 0 },
  { currency: "200", count: 0 },
  { currency: "100", count: 0 },
  { currency: "50", count: 0 },
  { currency: "20", count: 0 },
  { currency: "10", count: 0 },
  { currency: "5", count: 0 },
  { currency: "2", count: 0 },
  { currency: "1", count: 0 },
];

/** Default ખુલતી/બંધ સીલક when API omits the field (`undefined || 0` was forcing 0). */
const DEFAULT_SILAK_BALANCE = 10000;

const startOfLocalDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** First calendar day of the month for `date` (local), at midnight. */
const startOfLocalMonth = (date = new Date()) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const ReportIndex = ({ variant = "sales" }) => {
  // const componentRef = useRef();
  const dispatch = useDispatch();
  const {
    stallName: storeStallName,
    reportExportDirectoryHandle,
    openingSilakMode,
    openingSilakFixedValue,
  } = useStoreSettings();

  const salesReportTitle = useMemo(() => {
    const stall = (storeStallName || "").trim();
    const base =
      variant === "returns" ? "Sales Return Report" : "Sales Report";
    return stall ? `${stall} — ${base}` : base;
  }, [storeStallName, variant]);

  const isOpeningSilakFixed = openingSilakMode === "fixed";
  const resolvedFixedOpeningSilak = useMemo(() => {
    const n = Number(openingSilakFixedValue);
    return Number.isFinite(n) ? Math.floor(n) : DEFAULT_SILAK_BALANCE;
  }, [openingSilakFixedValue]);
  const [silakOpen, setSilakOpen] = useState(false);
  const [silakModalDate, setSilakModalDate] = useState(() =>
    startOfLocalDay(new Date())
  );
  const [silakModalSalesTotal, setSilakModalSalesTotal] = useState(null);
  const [reportType] = useState("daily");
  const defaultFy = useMemo(
    () => listIndianFYOptions(12)[0]?.value ?? new Date().getFullYear(),
    []
  );
  const [salesRangeMode, setSalesRangeMode] = useState("entry");
  const [reportDateStart, setReportDateStart] = useState(() =>
    startOfLocalMonth()
  );
  const [reportDateEnd, setReportDateEnd] = useState(() => new Date());
  const [salesDateRangeStart, setSalesDateRangeStart] = useState(() =>
    startOfLocalMonth()
  );
  const [salesDateRangeEnd, setSalesDateRangeEnd] = useState(() => new Date());
  const [salesMonthDate, setSalesMonthDate] = useState(() => new Date());
  const [salesFyStartYear, setSalesFyStartYear] = useState(() => defaultFy);
  /** Per-day API payloads: { ymd, dateLabel, rows } — Item Wise / Month / Year modes */
  const [salesReportByDate, setSalesReportByDate] = useState([]);
  /** Bill wise mode: `/report/daily` with `groupBy: "bill"` (one row per bill). */
  const [salesReportByBill, setSalesReportByBill] = useState([]);
  const [loadingSalesReport, setLoadingSalesReport] = useState(true);
  const [reportBranchOptions, setReportBranchOptions] = useState([]);
  const [reportBranchName, setReportBranchName] = useState(() =>
    String(
      localStorage.getItem("sahitya_report_branch") ||
        localStorage.getItem("branchName") ||
        "KUD"
    )
      .trim()
      .toUpperCase()
  );
  /** Tracks last toolbar period mode so switching to Item Wise can copy the visible range onto From/To. */
  const salesRangePrevModeRef = useRef("entry");

  const resolvedSalesRange = useMemo(
    () =>
      resolveSalesReportRange(salesRangeMode, {
        rangeStart: reportDateStart,
        rangeEnd: reportDateEnd,
        dateRangeStart: salesDateRangeStart,
        dateRangeEnd: salesDateRangeEnd,
        monthDate: salesMonthDate,
        fyStartYear: salesFyStartYear,
      }),
    [
      salesRangeMode,
      reportDateStart,
      reportDateEnd,
      salesDateRangeStart,
      salesDateRangeEnd,
      salesMonthDate,
      salesFyStartYear,
    ]
  );

  const printRangeDateLabel = useMemo(() => {
    const { start, end } = resolvedSalesRange;
    return formatLocalDateYMD(start) === formatLocalDateYMD(end)
      ? formatExcelDateDDMMYY(end)
      : `${formatExcelDateDDMMYY(start)} – ${formatExcelDateDDMMYY(end)}`;
  }, [resolvedSalesRange]);

  const displayLineTotal = useCallback(
    (product) => {
      const v = getDailyProductLineTotal(product);
      return variant === "returns" ? Math.abs(v) : v;
    },
    [variant]
  );
  /** Dedupe: react-to-print may call onBeforePrint more than once — one Excel + one save. */
  const modalPrintPrepPromiseRef = useRef(null);
  /** Ignore stale `/report/daily` responses when the silak date picker changes quickly. */
  const silakFetchSeqRef = useRef(0);
  const printRef = useRef();
  const [billDetail, setBillDetail] = useState(null);
  const [returnbillDetail, setReturnBillDetail] = useState(null);
  const bhetData = useSelector((state) => state.invoice.bhetData);

  const sumBhetAmountForYmd = useCallback(
    (ymd) => {
      const entries = bhetData?.[0]?.data;
      if (!Array.isArray(entries) || !ymd) return 0;
      return entries
        .filter((entry) => formatLocalDateYMD(entry.createdAt) === ymd)
        .flatMap((entry) => entry.categories || [])
        .reduce(
          (sum, category) => sum + (Number(category.totalBuyingAmount) || 0),
          0
        );
    },
    [bhetData]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const options = await loadBranchOptionsForForms();
      if (!mounted) return;
      setReportBranchOptions(options);
      if (options.length && !options.includes(reportBranchName)) {
        setReportBranchName(options[0]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reportBranchName]);

  useEffect(() => {
    localStorage.setItem("sahitya_report_branch", reportBranchName);
  }, [reportBranchName]);

  useEffect(() => {
    if (reportType !== "daily") return;
    const startYmd = formatLocalDateYMD(resolvedSalesRange.start);
    const endYmd = formatLocalDateYMD(resolvedSalesRange.end);
    const token = localStorage.getItem("access_token");
    const onlyReturns = variant === "returns";
    let cancelled = false;

    if (salesRangeMode === "date") {
      setSalesReportByDate([]);
      (async () => {
        setLoadingSalesReport(true);
        try {
          const res = await axios.post(
            `${API_URL}/report/daily`,
            {
              startDate: startYmd,
              endDate: endYmd,
              groupBy: "bill",
              branchName: reportBranchName,
              ...(onlyReturns ? { onlyReturned: true } : {}),
            },
            { headers: { Authorization: token } }
          );
          const rows = Array.isArray(res.data) ? res.data : [];
          if (!cancelled) setSalesReportByBill(rows);
        } catch (e) {
          console.error(e);
          if (!cancelled) {
            setSalesReportByBill([]);
            toast.error("Failed to load sales report.");
          }
        } finally {
          if (!cancelled) setLoadingSalesReport(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (salesRangeMode === "entry") {
      setSalesReportByBill([]);
      (async () => {
        setLoadingSalesReport(true);
        try {
          const res = await axios.post(
            `${API_URL}/report/daily`,
            {
              startDate: startYmd,
              endDate: endYmd,
              branchName: reportBranchName,
              ...(onlyReturns ? { onlyReturned: true } : {}),
            },
            { headers: { Authorization: token } }
          );
          const rows = Array.isArray(res.data) ? res.data : [];
          if (!cancelled) {
            setSalesReportByDate([
              {
                ymd: startYmd,
                dateLabel:
                  startYmd === endYmd
                    ? formatExcelDateDDMMYY(startYmd)
                    : `${formatExcelDateDDMMYY(startYmd)} – ${formatExcelDateDDMMYY(endYmd)}`,
                rows,
                merged: mergeDailyReportUserRows(rows),
              },
            ]);
          }
        } catch (e) {
          console.error(e);
          if (!cancelled) {
            setSalesReportByDate([]);
            toast.error("Failed to load sales report.");
          }
        } finally {
          if (!cancelled) setLoadingSalesReport(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    setSalesReportByBill([]);
    const days = enumerateInclusiveYMD(startYmd, endYmd);
    const maxDays = 400;
    if (days.length > maxDays) {
      toast.error(
        `Date range has ${days.length} days (max ${maxDays}). Narrow the range.`
      );
      setSalesReportByDate([]);
      setLoadingSalesReport(false);
      return;
    }
    (async () => {
      setLoadingSalesReport(true);
      try {
        const results = await Promise.all(
          days.map((ymd) =>
            axios
              .post(
                `${API_URL}/report/daily`,
                {
                  startDate: ymd,
                  endDate: ymd,
                  branchName: reportBranchName,
                  ...(onlyReturns ? { onlyReturned: true } : {}),
                },
                { headers: { Authorization: token } }
              )
              .then((res) => {
                const rows = Array.isArray(res.data) ? res.data : [];
                return {
                  ymd,
                  dateLabel: formatExcelDateDDMMYY(ymd),
                  rows,
                  merged: mergeDailyReportUserRows(rows),
                };
              })
          )
        );
        if (!cancelled) setSalesReportByDate(results);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setSalesReportByDate([]);
          toast.error("Failed to load sales report.");
        }
      } finally {
        if (!cancelled) setLoadingSalesReport(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportType, salesRangeMode, resolvedSalesRange, variant, reportBranchName]);

  const getTotalAmount = useCallback(
    (categories) =>
      categories?.reduce(
        (acc, category) => acc + (category.totalBuyingAmount || 0),
        0
      ) || 0,
    []
  );

  const rangeMerged = useMemo(
    () =>
      mergeDailyReportUserRows(salesReportByDate.flatMap((d) => d.rows || [])),
    [salesReportByDate]
  );

  const currentReport = useMemo(() => {
    if (reportType !== "daily") return [];
    const { products, userFullNames } = rangeMerged;
    if (!products?.length && !userFullNames?.length) return [];
    return [
      {
        userId: "range",
        userName: "range",
        userFullName:
          userFullNames.length > 0 ? userFullNames.join(", ") : "—",
        products: rangeMerged.products,
        categories: rangeMerged.categories,
      },
    ];
  }, [reportType, rangeMerged]);

  const filteredProducts = useMemo(
    () =>
      (rangeMerged.products || []).filter((p) =>
        mergedDailyProductHasValue(p, variant)
      ),
    [rangeMerged, variant]
  );

  const filteredCategory = useMemo(
    () =>
      (rangeMerged.categories || []).filter(
        (categorie) =>
          mergedDailyCategoryHasValue(categorie, variant)
      ),
    [rangeMerged, variant]
  );

  const adjustSalesBuckets = useCallback(
    (buckets) =>
      (buckets || []).map((v) => {
        const n = Number(v) || 0;
        return variant === "returns" ? Math.abs(n) : n;
      }),
    [variant]
  );

  const salesDateModeRows = useMemo(() => {
    if (salesRangeMode !== "date") return [];
    if (!salesReportByBill?.length) return [];
    return salesReportByBill
      .map((bill) => {
        const merged = mergeDailyReportUserRows([bill]);
        const raw = bucketAmountsFromDailyCategories(merged.categories);
        const buckets = adjustSalesBuckets(raw);
        const amount = sumBuckets(buckets);
        const oid =
          bill.billMongoId &&
          typeof bill.billMongoId === "object" &&
          bill.billMongoId.$oid
            ? bill.billMongoId.$oid
            : bill.billMongoId;
        const key = oid != null ? String(oid) : String(bill.billDisplayId ?? "");
        const created = bill.createdAt ? new Date(bill.createdAt) : null;
        const dateYmd =
          created && !Number.isNaN(created.getTime())
            ? formatLocalDateYMD(created)
            : "";
        const row = {
          key,
          docNo: "—",
          reportType: variant === "returns" ? "Sales Return" : "Sales",
          periodLabel: String(bill.billDisplayId ?? "—"),
          secondaryPeriodLabel: dateYmd
            ? formatExcelDateDDMMYY(dateYmd)
            : "—",
          buckets,
          amount,
          actionPrimary: null,
          actionSecondary: null,
        };
        return reportCategoryPeriodRowHasValue(row) ? row : null;
      })
      .filter(Boolean);
  }, [salesRangeMode, salesReportByBill, variant, adjustSalesBuckets]);

  const salesDateModeFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of salesDateModeRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [salesDateModeRows]);

  const salesMonthDayRows = useMemo(() => {
    if (salesRangeMode !== "month") return [];
    return buildSalesMonthDayRows(salesReportByDate, salesMonthDate)
      .map((d) => ({
        key: d.ymd,
        periodLabel: d.dateLabel,
        buckets: adjustSalesBuckets(d.buckets),
        amount: sumBuckets(adjustSalesBuckets(d.buckets)),
      }))
      .filter(reportCategoryPeriodRowHasValue);
  }, [salesRangeMode, salesReportByDate, salesMonthDate, adjustSalesBuckets]);

  const salesMonthDayFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of salesMonthDayRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [salesMonthDayRows]);

  const salesYearMonthRows = useMemo(() => {
    if (salesRangeMode !== "year") return [];
    return buildSalesFiscalMonthRows(salesReportByDate, salesFyStartYear)
      .map((m) => ({
        key: m.key,
        periodLabel: m.monthLabel,
        buckets: adjustSalesBuckets(m.buckets),
        amount: sumBuckets(adjustSalesBuckets(m.buckets)),
      }))
      .filter(reportCategoryPeriodRowHasValue);
  }, [salesRangeMode, salesReportByDate, salesFyStartYear, adjustSalesBuckets]);

  const salesYearMonthFooter = useMemo(() => {
    const colSums = [0, 0, 0, 0, 0, 0];
    let grand = 0;
    for (const r of salesYearMonthRows) {
      (r.buckets || []).forEach((v, i) => {
        colSums[i] += v;
      });
      grand += r.amount || 0;
    }
    return { colSums, grand };
  }, [salesYearMonthRows]);

  const totalAmount = useMemo(() => {
    if (reportType === "daily") {
      return filteredProducts.reduce(
        (sum, item) => sum + displayLineTotal(item),
        0
      );
    }
    return filteredProducts.reduce(
      (sum, item) => sum + getTotalAmount(item.categories),
      0
    );
  }, [reportType, filteredProducts, getTotalAmount, displayLineTotal]);

  /** Only **today** may be edited; past/future dates are read-only in the silak modal. */
  const silakIsViewOnly = useMemo(
    () => formatLocalDateYMD(silakModalDate) !== formatLocalDateYMD(new Date()),
    [silakModalDate]
  );

  /**
   * In the silak modal, sales must match **only** the modal date (`/report/daily` for that day).
   * Outside the modal, keep the main report total from the toolbar range.
   */
  const silakDisplayTotal = useMemo(() => {
    if (silakOpen) {
      return Number(silakModalSalesTotal) || 0;
    }
    return totalAmount;
  }, [silakOpen, silakModalSalesTotal, totalAmount]);

  const silakModalBhetTotal = useMemo(
    () => sumBhetAmountForYmd(formatLocalDateYMD(silakModalDate)),
    [sumBhetAmountForYmd, silakModalDate]
  );

  const formattedSilakModalBhet = useMemo(
    () => new Intl.NumberFormat("en-IN").format(silakModalBhetTotal),
    [silakModalBhetTotal]
  );

  const totalQuantity = useMemo(
    () =>
      filteredProducts?.reduce((total, item) => {
        const q = Number(item.totalBuyingCount) || 0;
        return total + (variant === "returns" ? Math.abs(q) : q);
      }, 0) || 0,
    [filteredProducts, variant]
  );

  const currentDateTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${formatExcelDateDDMMYY(
      resolvedSalesRange.end
    )} (${hours}:${minutes})`;
  };
  const totalBhetAmount = useMemo(
    () => sumBhetAmountForYmd(formatLocalDateYMD(new Date())),
    [sumBhetAmountForYmd]
  );
  const formattedTotalBhet = useMemo(
    () => new Intl.NumberFormat("en-IN").format(totalBhetAmount),
    [totalBhetAmount]
  );

  const silakAccountDateLabel = useMemo(() => {
    const d = silakOpen ? silakModalDate : new Date();
    return formatExcelDateDDMMYY(d);
  }, [silakOpen, silakModalDate]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const fetchBillDetails = async () => {
      try {
        const response = await fetch(
          `${API_URL}/bill?isReturned=false&branchName=${encodeURIComponent(
            reportBranchName
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: token, // Use token here
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch bill details");
        }

        const data = await response.json();
        setBillDetail(data);
      } catch (error) {
        console.error("Error fetching bill details:", error);
      }
    };

    const fetchReturnBillDetails = async () => {
      try {
        const response = await fetch(
          `${API_URL}/bill?isReturned=true&branchName=${encodeURIComponent(
            reportBranchName
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: token, // Use token here
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch return bill details");
        }

        const data = await response.json();
        setReturnBillDetail(data);
      } catch (error) {
        console.error("Error fetching return bill details:", error);
      }
    };
    fetchBillDetails();
    fetchReturnBillDetails();
  }, [reportBranchName]);

  const [salesData, setSalesData] = useState(initialData);
  const [openSilak, setOpenSilak] = useState(DEFAULT_SILAK_BALANCE);
  const [kharch, setKharch] = useState(0);
  const [closeSilak, setCloseSilak] = useState(DEFAULT_SILAK_BALANCE);
  const [existingData, setExistingData] = useState([]);
  const [id, setId] = useState();

  const fetchUpdatedData = useCallback(
    async (forDate) => {
      const d =
        forDate != null
          ? startOfLocalDay(forDate)
          : startOfLocalDay(new Date());
      const token = localStorage.getItem("access_token");
      const ymd = formatLocalDateYMD(d);
      const isPastDay = formatLocalDateYMD(new Date()) !== ymd;
      /** One sequence per `fetchUpdatedData` run so out-of-order API responses cannot mix dates. */
      const fetchSeq = ++silakFetchSeqRef.current;

      try {
        const response = await axios.get(`${API_URL}/daily-currency`, {
          params: {
            date: ymd,
            ...(variant === "returns" ? { onlyReturned: "true" } : {}),
          },
          headers: {
            Authorization: token,
          },
        });

        if (fetchSeq !== silakFetchSeqRef.current) return;

        const row = response.data;
        /** Backend may send `null` (legacy) or `{ persisted: false, businessYmd }` when no row exists. */
        const isEmptyDay =
          row == null ||
          row === "" ||
          row.persisted === false;
        if (!isEmptyDay && row && row._id) {
          const rowData = Array.isArray(row.data) ? row.data : [];
          const formattedData = initialData.map((init) => {
            const found = rowData.find((item) => item.currency === init.currency);
            return {
              currency: init.currency,
              count: found ? Number(found.count) || 0 : 0,
            };
          });

          setSalesData(formattedData);
          setExistingData(rowData);
          setId(row._id);
          setKharch(row.kharch || 0);
          const fromApiOpen =
            row.openSilak != null && row.openSilak !== ""
              ? Number(row.openSilak)
              : DEFAULT_SILAK_BALANCE;
          setOpenSilak(
            !isPastDay && isOpeningSilakFixed
              ? resolvedFixedOpeningSilak
              : fromApiOpen
          );
          setCloseSilak(
            row.closeSilak != null && row.closeSilak !== ""
              ? Number(row.closeSilak)
              : DEFAULT_SILAK_BALANCE
          );
        } else {
          setSalesData(initialData);
          setExistingData([]);
          setId(undefined);
          setKharch(0);
          setCloseSilak(DEFAULT_SILAK_BALANCE);
          setOpenSilak(
            isPastDay
              ? DEFAULT_SILAK_BALANCE
              : isOpeningSilakFixed
                ? resolvedFixedOpeningSilak
                : DEFAULT_SILAK_BALANCE
          );
        }

        const saleSum =
          row &&
          typeof row.daySalesTotal === "number" &&
          Number.isFinite(row.daySalesTotal)
            ? row.daySalesTotal
            : 0;
        setSilakModalSalesTotal(saleSum);
      } catch (error) {
        if (fetchSeq !== silakFetchSeqRef.current) return;
        setSalesData(initialData);
        setExistingData([]);
        setId(undefined);
        setOpenSilak(
          isPastDay
            ? DEFAULT_SILAK_BALANCE
            : isOpeningSilakFixed
              ? resolvedFixedOpeningSilak
              : DEFAULT_SILAK_BALANCE
        );
        setKharch(0);
        setCloseSilak(DEFAULT_SILAK_BALANCE);
        setSilakModalSalesTotal(0);
      }
    },
    [isOpeningSilakFixed, resolvedFixedOpeningSilak, variant]
  );

  const closeModal = useCallback(() => {
    setSilakOpen(false);
    setSilakModalSalesTotal(null);
    const t = startOfLocalDay(new Date());
    setSilakModalDate(t);
    fetchUpdatedData(t);
  }, [fetchUpdatedData]);

  const OpenModel = useCallback(() => {
    if (isOpeningSilakFixed) {
      setOpenSilak(resolvedFixedOpeningSilak);
    }
    setSilakModalDate(startOfLocalDay(new Date()));
    setSilakOpen(true);
    dispatch({ type: REQUEST_BHET_DATA });
  }, [dispatch, isOpeningSilakFixed, resolvedFixedOpeningSilak]);

  useEffect(() => {
    fetchUpdatedData(startOfLocalDay(new Date()));
  }, [fetchUpdatedData]);

  useEffect(() => {
    if (!silakOpen) return;
    fetchUpdatedData(silakModalDate);
  }, [silakOpen, silakModalDate, fetchUpdatedData]);

  useEffect(() => {
    if (!isOpeningSilakFixed) return;
    if (!silakOpen) return;
    if (formatLocalDateYMD(silakModalDate) !== formatLocalDateYMD(new Date())) {
      return;
    }
    setOpenSilak(resolvedFixedOpeningSilak);
  }, [
    isOpeningSilakFixed,
    resolvedFixedOpeningSilak,
    silakOpen,
    silakModalDate,
  ]);

  const handleValueChange = (index, value) => {
    const updatedSalesData = [...salesData];
    updatedSalesData[index].count = parseInt(value, 10) || 0;
    setSalesData(updatedSalesData);
  };

  /** Sum of currency × count; drives "આજની જમા કરાવેલ રકમ" and saved `jamaRakam`. */
  const SilakCurrencyTotal = useMemo(
    () =>
      salesData?.reduce((acc, cur) => acc + cur.currency * cur.count, 0) ?? 0,
    [salesData]
  );

  const currencyNoteCountTotal = useMemo(
    () =>
      (salesData || []).reduce((s, r) => s + (Number(r.count) || 0), 0),
    [salesData]
  );

  const silakVadGhatDelta = useMemo(() => {
    const o = parseInt(openSilak, 10) || 0;
    const t = parseInt(silakDisplayTotal, 10) || 0;
    const c = parseInt(closeSilak, 10) || 0;
    const j = SilakCurrencyTotal || 0;
    const k = parseInt(kharch, 10) || 0;
    const v = o + t - c - j - k;
    return Number.isFinite(v) ? v : 0;
  }, [openSilak, silakDisplayTotal, closeSilak, kharch, SilakCurrencyTotal]);

  const silakVadGhatDeltaStyle = useMemo(() => {
    const n = silakVadGhatDelta;
    if (n < 0) return { color: "#b71c1c" };
    if (n > 0) return { color: "#1b5e20" };
    return { color: "#000000" };
  }, [silakVadGhatDelta]);

  const handleSubmit = () => {
    if (silakIsViewOnly) return;
    const modalYmd = formatLocalDateYMD(silakModalDate);
    const payload = {
      date: modalYmd,
      data: salesData.map((cur) => ({
        currency: String(cur.currency),
        count: parseInt(cur.count, 10) || 0,
      })),
      kharch: parseInt(kharch, 10) || 0,
      openSilak: isOpeningSilakFixed
        ? resolvedFixedOpeningSilak
        : parseInt(openSilak, 10) || DEFAULT_SILAK_BALANCE,
      closeSilak: parseInt(closeSilak, 10) || DEFAULT_SILAK_BALANCE,
      jamaRakam: SilakCurrencyTotal,
    };

    const token = localStorage.getItem("access_token");
    const refreshDate = startOfLocalDay(silakModalDate);

    if (id) {
      axios
        .patch(`${API_URL}/daily-currency/${id}`, payload, {
          headers: { Authorization: token },
        })
        .then(() => {
          fetchUpdatedData(refreshDate);
        });
    } else {
      axios
        .post(`${API_URL}/daily-currency`, payload, {
          headers: { Authorization: token },
        })
        .then(() => {
          fetchUpdatedData(refreshDate);
        });
    }
    closeModal();
  };

  const totalSilakAmount = billDetail?.reduce(
    (acc, cur) => acc + cur.totalAmount,
    0
  );

  // const silakTotalAmount = salesData?.reduce(
  //   (acc, cur) => acc + cur.totalAmount,
  //   0
  // );
  const totalSilakReturnAmount = returnbillDetail?.reduce(
    (acc, cur) => acc + cur.totalAmount,
    0
  );

  const midIndex = billDetail?.length ? Math.ceil(billDetail.length / 2) : 0;
  const firstHalf = billDetail?.length ? billDetail.slice(0, midIndex) : [];
  const secondHalf = billDetail?.length ? billDetail.slice(midIndex) : [];

  const midReturnIndex = returnbillDetail?.length
    ? Math.ceil(returnbillDetail.length / 2)
    : 0;
  const firstHalfReturn = returnbillDetail?.length
    ? returnbillDetail.slice(0, midReturnIndex)
    : [];
  const secondHalfReturn = returnbillDetail?.length
    ? returnbillDetail.slice(midReturnIndex)
    : [];

  const getPrintSheetParams = (overrides = {}) => ({
    salesReportTitle,
    reportVariant: variant,
    reportDateLabel: printRangeDateLabel,
    currentReport,
    filteredProducts,
    filteredCategory,
    totalAmount: overrides.totalAmount ?? totalAmount,
    totalQuantity,
    printDateLabel: currentDateTime(),
    billDetail: billDetail || [],
    returnbillDetail: returnbillDetail || [],
    totalSilakAmount: totalSilakAmount ?? 0,
    totalSilakReturnAmount: totalSilakReturnAmount ?? 0,
    openSilak,
    closeSilak,
    kharch,
    silakCurrencyTotal: SilakCurrencyTotal,
    formattedTotalBhet,
    formattedDate: overrides.formattedDate ?? silakAccountDateLabel,
    salesData,
  });

  /** Toolbar Print: Tally-style voucher sheet (Voucher Type, Voucher Number, Date, line items, …). */
  const exportSalesReportVoucherExcel = async () => {
    if (reportType !== "daily") return;
    if (!filteredProducts?.length) {
      toast.info("No sales data in the selected range to export.");
      return;
    }
    try {
      const voucherDate = new Date(resolvedSalesRange.end);
      const now = new Date();
      voucherDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );
      const { rows, fileName } = buildSalesImportExportSpec(
        filteredProducts,
        storeStallName,
        voucherDate
      );
      const blob = await reportExcelBlobFromAoa(rows, "M1");
      await saveReportExcelWithToast(blob, fileName, reportExportDirectoryHandle);
    } catch (e) {
      console.error(e);
      toast.error("Could not create Excel.");
    }
  };

  /** Modal Print: Sheet1 Tally-style voucher (voucher # increments per print today), Sheet2 print layout. */
  const exportModalPrintSalesExcel = async ({
    silent = false,
    printOverrides,
  } = {}) => {
    if (reportType !== "daily") return;
    if (!filteredProducts?.length) {
      if (!silent) toast.info("No sales data to export.");
      return;
    }
    try {
      const { sheets, fileName } = buildModalPrintSalesExportSpec(
        filteredProducts,
        storeStallName,
        getPrintSheetParams(printOverrides)
      );
      const blob = await reportExcelBlobFromSheets(sheets);
      await saveReportExcelWithToast(blob, fileName, reportExportDirectoryHandle, {
        silent,
      });
    } catch (e) {
      console.error(e);
      if (!silent) toast.error("Could not create Excel.");
    }
  };

  const handleSalesReportPrintClick = () => {
    exportSalesReportVoucherExcel().catch(() => {});
    OpenModel();
  };

  const handleSalesRangeChange = useCallback((start, end) => {
    setReportDateStart(start);
    setReportDateEnd(end);
  }, []);

  const handleSalesDateRangeChange = useCallback((start, end) => {
    if (!start) return;
    if (end == null) {
      setSalesDateRangeStart(start);
      setSalesDateRangeEnd(null);
      return;
    }
    if (start.getTime() <= end.getTime()) {
      setSalesDateRangeStart(start);
      setSalesDateRangeEnd(end);
    } else {
      setSalesDateRangeStart(end);
      setSalesDateRangeEnd(start);
    }
  }, []);

  const handleSalesRangeModeChange = useCallback(
    (nextMode) => {
      const prev = salesRangePrevModeRef.current;
      if (nextMode === "entry" && prev !== "entry") {
        const { start, end } = resolveSalesReportRange(prev, {
          rangeStart: reportDateStart,
          rangeEnd: reportDateEnd,
          dateRangeStart: salesDateRangeStart,
          dateRangeEnd: salesDateRangeEnd ?? salesDateRangeStart,
          monthDate: salesMonthDate,
          fyStartYear: salesFyStartYear,
        });
        setReportDateStart(start);
        setReportDateEnd(end);
      }
      salesRangePrevModeRef.current = nextMode;
      setSalesRangeMode(nextMode);
    },
    [
      reportDateStart,
      reportDateEnd,
      salesDateRangeStart,
      salesDateRangeEnd,
      salesMonthDate,
      salesFyStartYear,
    ]
  );

  const exportSalesPeriodModeExcel = useCallback(async () => {
    if (reportType !== "daily" || loadingSalesReport) return;
    if (
      salesRangeMode !== "date" &&
      salesRangeMode !== "month" &&
      salesRangeMode !== "year"
    ) {
      return;
    }
    const rows =
      salesRangeMode === "date"
        ? salesDateModeRows
        : salesRangeMode === "month"
        ? salesMonthDayRows
        : salesYearMonthRows;
    const rowsForExcel =
      salesRangeMode === "year"
        ? salesYearMonthRows.map((r) => {
            const parts = String(r.key).split("-");
            const y = Number(parts[0]);
            const mo = Number(parts[1]);
            if (!Number.isFinite(y) || !Number.isFinite(mo)) return r;
            return {
              ...r,
              periodLabel: formatExcelDateDDMMYY(
                `${y}-${String(mo).padStart(2, "0")}-01`
              ),
            };
          })
        : rows;
    if (!rows?.length) {
      toast.info("No data in this period to export.");
      return;
    }
    const footer =
      salesRangeMode === "date"
        ? salesDateModeFooter
        : salesRangeMode === "month"
        ? salesMonthDayFooter
        : salesYearMonthFooter;
    const periodColumnLabel =
      salesRangeMode === "date"
        ? "Bill No."
        : salesRangeMode === "month"
        ? "Date"
        : "Month";
    const secondaryPeriodColumnLabel =
      salesRangeMode === "date" ? "Date" : undefined;
    const usersLabel = currentReport
      .map((d) => d.userFullName)
      .filter(Boolean)
      .join(", ");
    const modePart =
      salesRangeMode === "date"
        ? "BillWise"
        : salesRangeMode === "month"
        ? "MonthWise"
        : "YearWise";
    const startYmd = formatLocalDateYMD(resolvedSalesRange.start);
    const endYmd = formatLocalDateYMD(resolvedSalesRange.end);
    const fileName = `Sales_${modePart}_${startYmd}_${endYmd}.xlsx`;

    try {
      const blob = await salesPeriodReportExcelBlob({
        mode: salesRangeMode,
        salesReportTitle,
        dateRangeLabel: printRangeDateLabel,
        usersLabel,
        periodColumnLabel,
        secondaryPeriodColumnLabel,
        rows: rowsForExcel,
        footerBuckets: footer.colSums,
        footerTotal: footer.grand,
      });
      await saveReportExcelWithToast(blob, fileName, reportExportDirectoryHandle);
    } catch (e) {
      console.error(e);
      toast.error("Could not create Excel.");
    }
  }, [
    reportType,
    loadingSalesReport,
    salesRangeMode,
    salesDateModeRows,
    salesMonthDayRows,
    salesYearMonthRows,
    salesDateModeFooter,
    salesMonthDayFooter,
    salesYearMonthFooter,
    salesReportTitle,
    printRangeDateLabel,
    currentReport,
    reportExportDirectoryHandle,
    resolvedSalesRange,
  ]);

  return (
    <>
      <div className="user-template sales-report-root">
        <div className="user-container">
          <div className="userreport-box" style={{ justifyContent: "flex-end" }}>
            <div
              className="tfootgroup"
              style={{
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
                flexWrap: "nowrap",
                gap: "10px",
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  flex: "1 1 280px",
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "nowrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ReportSalesRangeToolbar
                    mode={salesRangeMode}
                    onModeChange={handleSalesRangeModeChange}
                    rangeStart={reportDateStart}
                    rangeEnd={reportDateEnd}
                    onRangeChange={handleSalesRangeChange}
                    dateRangeStart={salesDateRangeStart}
                    dateRangeEnd={salesDateRangeEnd}
                    onDateRangeChange={handleSalesDateRangeChange}
                    monthDate={salesMonthDate}
                    onMonthDateChange={setSalesMonthDate}
                    fyStartYear={salesFyStartYear}
                    onFyStartYearChange={setSalesFyStartYear}
                    disabled={loadingSalesReport}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label
                    htmlFor="report-branch-select"
                    className="report-branch-label"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      marginRight: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Branch
                  </label>
                  <select
                    id="report-branch-select"
                    className="report-branch-select"
                    value={reportBranchName}
                    onChange={(e) =>
                      setReportBranchName(
                        String(e.target.value || "").trim().toUpperCase()
                      )
                    }
                    disabled={loadingSalesReport}
                  >
                    {(reportBranchOptions.length
                      ? reportBranchOptions
                      : [reportBranchName]
                    ).map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {salesRangeMode === "entry" && (
                  <div className="tfootgroup">
                    <button
                      type="button"
                      className="userreprt-button report-action-btn--primary"
                      onClick={handleSalesReportPrintClick}
                      title="Export Tally-style sales voucher (Excel) and open print summary"
                    >
                      Print
                    </button>
                  </div>
                )}
                {(salesRangeMode === "date" ||
                  salesRangeMode === "month" ||
                  salesRangeMode === "year") && (
                  <div
                    className="report-action-download--primary"
                    onClick={() => exportSalesPeriodModeExcel()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        exportSalesPeriodModeExcel();
                      }
                    }}
                    title="Export this report to Excel (.xlsx)"
                  >
                    <img
                      style={{ width: "50px" }}
                      src={download}
                      alt="Download Excel"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="userreport-table-wrapper report-tables-with-loader"
            style={{ position: "relative", minHeight: "120px" }}
          >
            <ReportTableLoadingOverlay
              show={loadingSalesReport}
              label="Loading report…"
            />
            <div
              className={loadingSalesReport ? "report-tables-dimmed" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                transition: "opacity 0.2s ease",
              }}
            >
              {reportType === "daily" && (
                <>
                  {!loadingSalesReport &&
                    salesRangeMode === "entry" &&
                    (filteredProducts.length > 0 || filteredCategory.length > 0) && (
                    <>
                      {filteredProducts.length > 0 && (
                        <table className="userreport-table">
                          <thead>
                            <tr>
                              <th style={{ width: "8%" }}>Sr. No.</th>
                              <th style={{ width: "13%", textAlign: "start" }}>
                                Product ID
                              </th>
                              <th style={{ textAlign: "start" }}>Product Name</th>
                              <th style={{ width: "11%", textAlign: "end" }}>
                                Quantity
                              </th>
                              <th style={{ width: "11%", textAlign: "end" }}>Rate</th>
                              <th style={{ width: "13%", textAlign: "end" }}>
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map((product, index) => (
                              <tr key={productLineMergeKey(product)}>
                                <td style={{ width: "8%" }}>{index + 1}</td>
                                <td style={{ width: "13%", textAlign: "start" }}>
                                  {product.productId}
                                </td>
                                <td style={{ textAlign: "start" }}>
                                  {product.name || "N/A"}
                                </td>
                                <td style={{ width: "11%", textAlign: "end" }}>
                                  {new Intl.NumberFormat("en-IN").format(
                                    variant === "returns"
                                      ? Math.abs(Number(product.totalBuyingCount) || 0)
                                      : product.totalBuyingCount
                                  ) || "N/A"}
                                </td>
                                <td style={{ width: "11%", textAlign: "end" }}>
                                  {new Intl.NumberFormat("en-IN").format(
                                    getDailyProductUnitRate(product)
                                  )}
                                </td>
                                <td style={{ width: "13%", textAlign: "end" }}>
                                  {new Intl.NumberFormat("en-IN").format(
                                    displayLineTotal(product)
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot
                            style={{
                              borderTop: "1px solid var(--brown-color)",
                            }}
                          >
                            <tr>
                              <td colSpan="5">
                                <div className="tfootgroup"></div>
                              </td>
                              <td
                                style={{
                                  textAlign: "end",
                                  fontWeight: "bold",
                                }}
                              >
                                Total:{" "}
                                {new Intl.NumberFormat("en-IN").format(totalAmount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                      {filteredCategory.length > 0 && (
                        <>
                          <p
                            className="pavti_footer_text_report"
                            style={{
                              fontSize: "1.05rem",
                              margin: "1.25rem 0 0.65rem",
                              textAlign: "center",
                            }}
                          >
                            ... Category Wise Daily Report ...
                          </p>
                          <table className="userreport-table">
                            <thead>
                              <tr>
                                <th style={{ textAlign: "start" }}>Category</th>
                                <th style={{ width: "28%", textAlign: "end" }}>Amt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredCategory.map((category, idx) => (
                                <tr key={`${category.categoryName}-${idx}`}>
                                  <td style={{ textAlign: "start" }}>
                                    {category.categoryName}
                                  </td>
                                  <td style={{ textAlign: "end" }}>
                                    {new Intl.NumberFormat("en-IN").format(
                                      variant === "returns"
                                        ? Math.abs(Number(category.totalAmount) || 0)
                                        : Number(category.totalAmount) || 0
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot
                              style={{
                                borderTop: "1px solid var(--brown-color)",
                              }}
                            >
                              <tr>
                                <td style={{ fontWeight: "bold" }}>Total</td>
                                <td style={{ textAlign: "end", fontWeight: "bold" }}>
                                  {new Intl.NumberFormat("en-IN").format(totalAmount)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </>
                      )}
                    </>
                  )}
                  {!loadingSalesReport && salesRangeMode === "date" && (
                    <ReportCategoryPeriodTable
                      periodColumnLabel="Bill No."
                      secondaryPeriodColumnLabel="Date"
                      showDocColumns={false}
                      showActionColumn={false}
                      rows={salesDateModeRows}
                      footerBuckets={salesDateModeFooter.colSums}
                      footerTotal={salesDateModeFooter.grand}
                      emptyMessage="No sales data for this range."
                      className="userreport-table"
                    />
                  )}
                  {!loadingSalesReport && salesRangeMode === "month" && (
                    <ReportCategoryPeriodTable
                      periodColumnLabel="Date"
                      showDocColumns={false}
                      showActionColumn={false}
                      rows={salesMonthDayRows}
                      footerBuckets={salesMonthDayFooter.colSums}
                      footerTotal={salesMonthDayFooter.grand}
                      emptyMessage="No data for this month."
                      className="userreport-table"
                    />
                  )}
                  {!loadingSalesReport && salesRangeMode === "year" && (
                    <ReportCategoryPeriodTable
                      periodColumnLabel="Month"
                      showDocColumns={false}
                      showActionColumn={false}
                      rows={salesYearMonthRows}
                      footerBuckets={salesYearMonthFooter.colSums}
                      footerTotal={salesYearMonthFooter.grand}
                      emptyMessage="No data for this financial year."
                      className="userreport-table"
                    />
                  )}
                  {!loadingSalesReport &&
                    salesRangeMode === "entry" &&
                    salesReportByDate.length > 0 &&
                    filteredProducts.length === 0 &&
                    filteredCategory.length === 0 && (
                      <p
                        className="report-table-empty-message"
                        style={{ textAlign: "center", padding: "24px" }}
                      >
                        No sales on any day in this date range.
                      </p>
                    )}
                  {!loadingSalesReport &&
                    salesRangeMode !== "date" &&
                    salesReportByDate.length === 0 && (
                    <p
                      className="report-table-empty-message"
                      style={{ textAlign: "center", padding: "24px" }}
                    >
                      No report data. Adjust the date range and try again.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div ref={printRef} className="print-content">
        {/*  */}
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
          {salesReportTitle}
        </h1>
        <div className="bill_header_sub">
          <p style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "bold" }}>
            Date range:{" "}
            <span style={{ fontWeight: "600" }}>{printRangeDateLabel}</span>
          </p>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: "500" }}>
            Printed:{" "}
            <span style={{ fontWeight: "400" }}>{currentDateTime()}</span>
          </p>
          {currentReport.map((data) => (
            <p
              key={data.userId || data.userName}
              style={{ fontSize: "17px", fontWeight: "bold" }}
            >
              User :-{" "}
              <span style={{ fontWeight: "300" }}>{data.userFullName}</span>
            </p>
          ))}
        </div>
        <div className="bill_header_main"></div>
        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 8px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px -2px 0px" }} />
          <div
            className="pavti_title_head"
            style={{
              height: "22px",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <p
              className="pavti_title"
              style={{
                width: "55px",
                textAlign: "center",
                fontWeight: "bold",
                borderRight: "1px solid",
              }}
            >
              Id
            </p>
            <p
              className="pavti_title"
              style={{
                width: "215px",
                textAlign: "left",
                fontWeight: "bold",
                borderRight: "1px solid",
                height: "20px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              Product
            </p>
            <p
              className="pavti_title"
              style={{
                width: "40px",
                textAlign: "center",
                fontWeight: "bold",
                borderRight: "1px solid",
                height: "23px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Qty
            </p>
            <p
              className="pavti_title"
              style={{
                width: "80px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              Amt
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px" }} />
          {filteredProducts?.map((product, index) => (
            <div key={index}>
              <div
                className="pavti_data_1"
                style={{ justifyContent: "flex-start" }}
              >
                <p
                  className="pavti_product_Id_1"
                  style={{
                    textAlign: "left",
                    width: "55px",
                    borderRight: "1px solid",
                    fontSize: "15px",
                  }}
                >
                  {product.productId}
                </p>
                <h3
                  className="pavti_product_name_1"
                  style={{
                    width: "213px",
                    borderRight: "1px solid",
                    paddingLeft: "2px",
                    fontSize: "17px",
                  }}
                >
                  {product.name}
                </h3>
                <div
                  className="pavti_data_quantity"
                  style={{ borderRight: "1px solid" }}
                >
                  <span style={{ fontSize: "15px" }}>
                    {new Intl.NumberFormat("en-IN").format(
                      variant === "returns"
                        ? Math.abs(Number(product.totalBuyingCount) || 0)
                        : product.totalBuyingCount
                    )}
                  </span>
                </div>
                <p
                  className="product_price_report"
                  style={{ fontSize: "15px" }}
                >
                  {new Intl.NumberFormat("en-IN").format(
                    displayLineTotal(product)
                  )}
                </p>
              </div>
            </div>
          ))}

          <hr style={{ borderTop: "solid 2px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
          <div
            className="pavti_total"
            style={{
              height: "30px",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <p
              style={{
                width: "271px",
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
                borderRight: "1px solid",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(totalQuantity)}
            </p>
            <p
              style={{
                width: "80px",
                margin: 0,
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {" "}
              {new Intl.NumberFormat("en-IN").format(totalAmount)}
            </p>
          </div>

          <hr style={{ borderTop: "solid 2px" }} />
          <p className="pavti_footer_text_report" style={{ fontSize: "22px" }}>
            ... Category Wise Daily Report ...
          </p>
        </div>

        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 8px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
          <div
            className="pavti_title_head"
            style={{
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <p
              className="pavti_title"
              style={{
                width: "190px",
                textAlign: "left",
                fontWeight: "bold",
                fontSize: "20px",
                borderRight: "1px solid black",
              }}
            >
              Category
            </p>
            <p
              className="pavti_title"
              style={{
                width: "200px",
                textAlign: "end",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              Amt
            </p>
          </div>
          {filteredCategory.map((category, name) => (
            <div key={name}>
              <div
                className="pavti_data"
                style={{ display: "flex", justifyContent: "flex-start" }}
              >
                <h3
                  className="pavti_product_name"
                  style={{
                    fontSize: "20px",
                    width: "190px",
                    borderRight: "1px solid black", // Add border-right here
                  }}
                >
                  {category.categoryName}
                </h3>
                <p
                  className="product_price_report_1"
                  style={{
                    fontSize: "20px",
                    width: "200px",
                    textAlign: "end",
                  }}
                >
                  {new Intl.NumberFormat("en-IN").format(
                    variant === "returns"
                      ? Math.abs(Number(category.totalAmount) || 0)
                      : Number(category.totalAmount) || 0
                  )}
                </p>
              </div>
            </div>
          ))}

          <hr style={{ borderTop: "solid 2px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
          <div
            className="pavti_total"
            style={{
              height: "27px",
              alignItems: "center",
              display: "flex",
              justifyContent: "flex-start  ",
            }}
          >
            <p
              style={{
                width: "190px",
                margin: 0,
                textAlign: "left",
                fontWeight: "bold",
                fontSize: "20px",
                borderRight: "1px solid black",
              }}
            >
              Total
            </p>
            <p
              style={{
                width: "200px",
                margin: 0,
                textAlign: "right",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(
                filteredCategory.reduce(
                  (sum, c) =>
                    sum +
                    (variant === "returns"
                      ? Math.abs(Number(c.totalAmount) || 0)
                      : Number(c.totalAmount) || 0),
                  0
                )
              )}
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
        </div>

        <h2
          style={{
            padding: "0px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "20px 0px",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          -: Bill Detail :-
        </h2>
        <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
        <div
          className="pavti_title_head"
          style={{
            display: "flex",
            justifyContent: "center",
            height: "auto",
            width: "390px",
            marginLeft: "6px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "188px",
                }}
              >
                <p
                  className="pavti_title"
                  style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Bill
                </p>
                <p
                  className="pavti_title"
                  style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Amt
                </p>
              </div>
              {firstHalf.map((bill, index) => (
                <div
                  key={index}
                  className="pavti_data"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3
                    className="pavti_product_name"
                    style={{
                      fontSize: "20px",
                      width: "90px",
                      fontWeight: 500,
                    }}
                  >
                    {bill.billId}
                  </h3>
                  <p
                    className="product_price_report_1"
                    style={{ fontSize: "20px", width: "92px", fontWeight: 500 }}
                  >
                    {new Intl.NumberFormat("en-IN").format(bill.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              borderLeft: "1px solid black",
              height: "auto",
              margin: "0 5px",
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "188px",
                }}
              >
                <p
                  className="pavti_title"
                  style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Bill
                </p>
                <p
                  className="pavti_title"
                  style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Amt
                </p>
              </div>
              {secondHalf.map((bill, index) => (
                <div
                  key={index}
                  className="pavti_data"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3
                    className="pavti_product_name"
                    style={{
                      fontSize: "20px",
                      width: "90px",
                      fontWeight: 500,
                    }}
                  >
                    {bill.billId}
                  </h3>
                  <p
                    className="product_price_report_1"
                    style={{ fontSize: "20px", width: "92px" }}
                  >
                    {new Intl.NumberFormat("en-IN").format(bill.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
        <div
          className="pavti_total"
          style={{
            height: "27px",
            alignItems: "center",
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <p
            style={{
              width: "195px",
              margin: 0,
              textAlign: "left",
              fontWeight: "bold",
              fontSize: "20px",
              borderRight: "1px solid black", // Add border-right here
              marginLeft: "5px",
            }}
          >
            Total
          </p>
          <p
            style={{
              width: "200px",
              margin: 0,
              textAlign: "right",
              fontWeight: "bold",
              fontSize: "20px",
              paddingRight: "10px",
            }}
          >
            {new Intl.NumberFormat("en-IN").format(totalSilakAmount)}
          </p>
        </div>
        <hr style={{ borderTop: "solid 2px", margin: "0px 0px 0px 0px" }} />

        {firstHalfReturn.length > 0 && (
          <>
            <h2
              style={{
                padding: "0px 0px",
                fontSize: "22px",
                textAlign: "center",
                margin: "20px 0px",
                background: "white",
                borderRadius: "0px 25px 0px 0px",
              }}
            >
              -: Return Bill Detail :-
            </h2>
            <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
            <div
              className="pavti_title_head"
              style={{
                display: "flex",
                justifyContent: "flex-start",
                height: "auto",
                width: "400px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "188px",
                    }}
                  >
                    <p
                      className="pavti_title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      Return
                    </p>
                    <p
                      className="pavti_title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      Amt
                    </p>
                  </div>
                  {firstHalfReturn.map((bill, index) => (
                    <div
                      key={index}
                      className="pavti_data"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h3
                        className="pavti_product_name"
                        style={{
                          fontSize: "20px",
                          width: "100px",
                          fontWeight: 500,
                        }}
                      >
                        {bill.billId}
                      </h3>
                      <p
                        className="product_price_report_1"
                        style={{
                          fontSize: "20px",
                          width: "95px",
                          fontWeight: 500,
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          bill.totalAmount
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  borderLeft: "1px solid black",
                  height: "auto",
                  margin: "0 7px",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "193px",
                    }}
                  >
                    <p
                      className="pavti_title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      Return
                    </p>
                    <p
                      className="pavti_title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      Amt
                    </p>
                  </div>
                  {secondHalfReturn.map((bill, index) => (
                    <div
                      key={index}
                      className="pavti_data"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h3
                        className="pavti_product_name"
                        style={{
                          fontSize: "20px",
                          width: "100px",
                          fontWeight: 500,
                        }}
                      >
                        {bill.billId}
                      </h3>
                      <p
                        className="product_price_report_1"
                        style={{ fontSize: "20px", width: "95px" }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          bill.totalAmount
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
            <div
              className="pavti_total"
              style={{
                height: "27px",
                alignItems: "center",
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <p
                style={{
                  width: "200px",
                  margin: 0,
                  textAlign: "left",
                  fontWeight: "bold",
                  fontSize: "20px",
                  borderRight: "1px solid black",
                }}
              >
                Total
              </p>
              <p
                style={{
                  width: "196px",
                  margin: 0,
                  textAlign: "right",
                  fontWeight: "bold",
                  fontSize: "20px",
                  paddingRight: "10px",
                }}
              >
                {new Intl.NumberFormat("en-IN").format(totalSilakReturnAmount)}
              </p>
            </div>
            <hr style={{ borderTop: "solid 2px", margin: "0px 0px 0px 0px" }} />
          </>
        )}

        <h2
          style={{
            padding: "0px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "20px 0px",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          -: ({silakAccountDateLabel}) આજનો હિસાબ :-
        </h2>
        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 8px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              આજની ખુલતી સીલક
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              10,000
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              આજનુ વેચાણ
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(silakDisplayTotal)}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              ખર્ચ
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(kharch)}
            </p>
          </div>

          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                borderTop: "2px solid black",
                borderBottom: "2px solid black",
                lineHeight: "28px",
              }}
            >
              કુલ બેલેન્સ
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                borderTop: "2px solid black",
                borderBottom: "2px solid black",
                lineHeight: "28px",
                fontWeight: 700,
              }}
            >
              {new Intl.NumberFormat("en-IN").format(
                parseInt(openSilak, 10) +
                  parseInt(silakDisplayTotal, 10) -
                  parseInt(kharch, 10) || 0
              )}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              આજની બંધ સીલક
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(closeSilak)}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              આજની જમા કરાવેલ રકમ નીચે મુજબ
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(SilakCurrencyTotal)}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                borderTop: "2px solid black",
                lineHeight: "28px",
              }}
            >
              {`હિસાબની ભૂલ (${
                parseInt(openSilak, 10) +
                  parseInt(silakDisplayTotal, 10) -
                  closeSilak -
                  SilakCurrencyTotal -
                  (parseInt(kharch, 10) || 0) ===
                0
                  ? "રાજીપો"
                  : parseInt(openSilak, 10) +
                      parseInt(silakDisplayTotal, 10) -
                      closeSilak -
                      SilakCurrencyTotal -
                      (parseInt(kharch, 10) || 0) >
                    0
                  ? "વધારો"
                  : "ઘટાડો"
              })`}
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                borderTop: "2px solid black",
                lineHeight: "28px",
                fontWeight: 700,
                ...silakVadGhatDeltaStyle,
              }}
            >
              {new Intl.NumberFormat("en-IN").format(silakVadGhatDelta)}
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px", margin: 0 }} />
        </div>
        <h2
          style={{
            padding: "0px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "20px 0px",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          -: Silak :-
        </h2>
        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 8px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
          <div
            className="pavti_title_head"
            style={{
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <p
              className="pavti_title"
              style={{
                width: "130px",
                textAlign: "left",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              Currency
            </p>
            <p
              className="pavti_title"
              style={{
                width: "130px",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              No.
            </p>
            <p
              className="pavti_title"
              style={{
                width: "130px",
                textAlign: "end",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              Amt
            </p>
          </div>
          {salesData && salesData.length > 0 ? (
            salesData.map((cur, index) => {
              const denom = Number(cur.currency) || 0;
              const cnt = Number(cur.count) || 0;
              const lineAmt = denom * cnt;
              const nf = new Intl.NumberFormat("en-IN");
              return (
              <div key={index}>
                <div
                  className="pavti_data"
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  <h3
                    className="pavti_product_name"
                    style={{
                      fontSize: "20px",
                      width: "130px",
                      textAlign: "left",
                    }}
                  >
                    {denom ? nf.format(denom) : cur.currency}
                  </h3>
                  <p
                    className="product_price_report_1"
                    style={{
                      fontSize: "20px",
                      width: "130px",
                      textAlign: "center",
                    }}
                  >
                    {nf.format(cnt)}
                  </p>
                  <p
                    className="product_price_report_1"
                    style={{
                      fontSize: "20px",
                      width: "130px",
                      textAlign: "end",
                    }}
                  >
                    {nf.format(lineAmt)}
                  </p>
                </div>
              </div>
              );
            })
          ) : (
            <div>
              <p style={{ textAlign: "center" }}>No data available</p>
            </div>
          )}

          <hr style={{ borderTop: "solid 2px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
          <div
            className="pavti_total"
            style={{
              height: "27px",
              alignItems: "center",
              display: "flex",
              justifyContent: "flex-start  ",
            }}
          >
            <p
              style={{
                width: "130px",
                margin: 0,
                textAlign: "left",
                fontWeight: "bold",
                fontSize: "20px",
                borderRight: "1px solid black",
              }}
            >
              Total
            </p>
            <p
              style={{
                width: "130px",
                margin: 0,
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "20px",
                borderRight: "1px solid black",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(currencyNoteCountTotal)}
            </p>
            <p
              style={{
                width: "130px",
                margin: 0,
                textAlign: "right",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(SilakCurrencyTotal)}
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
        </div>
        <div className="bhet-amt">ટોટલ ભેટ: {formattedTotalBhet}</div>
        <p className="pavti_footer_text_report" style={{ fontSize: "22px" }}>
          ... Jay Swaminarayan ...
        </p>
      </div>
      {silakOpen && (
        <div className="cash-closing-modal">
          <div
            className="cash-closing-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cash-closing-dialog-title"
          >
            <header className="cash-closing-dialog-header cash-closing-dialog-header--bar">
              <div className="cash-closing-dialog-header-inner">
                <h3
                  id="cash-closing-dialog-title"
                  className="cash-closing-dialog-title cash-closing-dialog-title--in-bar"
                >
                  ({silakAccountDateLabel}) આજનો હિસાબ
                </h3>
                <div className="cash-closing-dialog-header-date">
                  <label htmlFor="silak-modal-date-picker">
                    તારીખ
                  </label>
                  <DatePicker
                    id="silak-modal-date-picker"
                    selected={silakModalDate}
                    onChange={(date) => {
                      if (date) setSilakModalDate(startOfLocalDay(date));
                    }}
                    maxDate={new Date()}
                    dateFormat="dd-MM-yyyy"
                    className="cash-closing-date-input"
                  />
                </div>
              </div>
            </header>
            <div className="cash-closing-dialog-body">
            <div className="cash-closing-grid silak-table-main">
              <div className="cash-closing-card cash-closing-summary">
                <h4 className="cash-closing-section-title">Silak</h4>
                <div className="silak-table">
                <table className="cash-closing-summary-table">
                  <tbody>
                    <tr className="cash-closing-summary-row">
                      <th scope="row" className="cash-closing-summary-label">
                        આજની ખુલતી સીલક
                      </th>
                      <td className="cash-closing-summary-value">
                        {silakIsViewOnly || isOpeningSilakFixed ? (
                          <span className="cash-closing-summary-field cash-closing-summary-field--text">
                            {new Intl.NumberFormat("en-IN").format(
                              Number(openSilak) || 0
                            )}
                          </span>
                        ) : (
                          <input
                            type="text"
                            className="cash-closing-summary-field"
                            value={
                              openSilak === "" || openSilak == null
                                ? ""
                                : new Intl.NumberFormat("en-IN").format(
                                    openSilak
                                  )
                            }
                            onChange={(e) => {
                              const opensilakValue = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              setOpenSilak(
                                opensilakValue === ""
                                  ? ""
                                  : Number(opensilakValue)
                              );
                            }}
                            aria-label="Opening silak amount"
                          />
                        )}
                      </td>
                    </tr>
                    <tr className="cash-closing-summary-row">
                      <th scope="row" className="cash-closing-summary-label">
                        આજનું વેચાણ
                      </th>
                      <td className="cash-closing-summary-value">
                        {new Intl.NumberFormat("en-IN").format(silakDisplayTotal)}
                      </td>
                    </tr>
                    <tr className="cash-closing-summary-row">
                      <th scope="row" className="cash-closing-summary-label">
                        ખર્ચ
                      </th>
                      <td className="cash-closing-summary-value">
                        {silakIsViewOnly ? (
                          <span className="cash-closing-summary-field cash-closing-summary-field--text">
                            {kharch
                              ? `-${new Intl.NumberFormat("en-IN").format(
                                  kharch
                                )}`
                              : "0"}
                          </span>
                        ) : (
                          <input
                            type="text"
                            className="cash-closing-summary-field"
                            value={
                              kharch !== ""
                                ? `-${new Intl.NumberFormat("en-IN").format(
                                    kharch
                                  )}`
                                : ""
                            }
                            onChange={(e) => {
                              const kharchData = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              setKharch(kharchData ? Number(kharchData) : 0);
                            }}
                          />
                        )}
                      </td>
                    </tr>
                    <tr className="cash-closing-summary-row cash-closing-summary-row--emphasis">
                      <th scope="row" className="cash-closing-summary-label">
                        કુલ બેલેન્સ
                      </th>
                      <td className="cash-closing-summary-value">
                        {new Intl.NumberFormat("en-IN").format(
                          (isNaN(parseInt(openSilak, 10))
                            ? 0
                            : parseInt(openSilak, 10)) +
                            (isNaN(parseInt(silakDisplayTotal, 10))
                              ? 0
                              : parseInt(silakDisplayTotal, 10)) -
                            (isNaN(parseInt(kharch, 10))
                              ? 0
                              : parseInt(kharch, 10))
                        )}
                      </td>
                    </tr>
                    <tr className="cash-closing-summary-row">
                      <th scope="row" className="cash-closing-summary-label">
                        આજની બંધ સીલક
                      </th>
                      <td className="cash-closing-summary-value">
                        <span className="cash-closing-summary-field cash-closing-summary-field--text">
                          {new Intl.NumberFormat("en-IN").format(
                            Number(closeSilak) || 0
                          )}
                        </span>
                      </td>
                    </tr>
                    <tr className="cash-closing-summary-row">
                      <th scope="row" className="cash-closing-summary-label">
                        આજની જમા કરાવેલ રકમ નીચે મુજબ
                      </th>
                      <td className="cash-closing-summary-value">
                        {new Intl.NumberFormat("en-IN").format(
                          SilakCurrencyTotal
                        )}
                      </td>
                    </tr>
                    <tr className="cash-closing-summary-row cash-closing-summary-row--emphasis">
                      <th scope="row" className="cash-closing-summary-label">
                        {`હિસાબની ભૂલ (${
                          parseInt(openSilak, 10) +
                            parseInt(silakDisplayTotal, 10) -
                            closeSilak -
                            SilakCurrencyTotal -
                            kharch ===
                          0
                            ? "રાજીપો"
                            : parseInt(openSilak, 10) +
                                parseInt(silakDisplayTotal, 10) -
                                closeSilak -
                                SilakCurrencyTotal -
                                kharch >
                              0
                            ? "ઘટાડો"
                            : "વધારો"
                        })`}
                      </th>
                      <td
                        className="cash-closing-summary-value"
                        style={silakVadGhatDeltaStyle}
                      >
                        {new Intl.NumberFormat("en-IN").format(silakVadGhatDelta)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="cash-closing-bhet" role="status">
                  <span className="cash-closing-bhet-label">ટોટલ ભેટ:</span>
                  <span className="cash-closing-bhet-value">
                    {formattedSilakModalBhet}
                  </span>
                </div>
                </div>
              </div>
              <div className="cash-closing-card cash-closing-currency-panel">
                <h4 className="cash-closing-section-title">જમા કરાવ્યાની વિગત</h4>
                <div className="cash-closing-table-scroll">
                  <table className="cash-closing-currency-table">
                <thead>
                  <tr>
                    <th>Currency</th>
                    <th>No.</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData && salesData.length > 0 ? (
                    salesData.map((cur, index) => (
                      <tr key={index}>
                        <td>{cur.currency}</td>
                        <td className="cash-closing-count-cell">
                          {silakIsViewOnly ? (
                            <span className="cash-closing-count-input cash-closing-summary-field--text">
                              {new Intl.NumberFormat("en-IN").format(cur.count)}
                            </span>
                          ) : (
                            <input
                              type="text"
                              className="cash-closing-count-input"
                              value={new Intl.NumberFormat("en-IN").format(
                                cur.count
                              )}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );

                                handleValueChange(index, numericValue);
                              }}
                              min="0"
                            />
                          )}
                        </td>
                        <td className="cash-closing-amount-cell">
                          {new Intl.NumberFormat("en-IN").format(
                            cur.currency * cur.count
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="cash-closing-empty-row">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot className="cash-closing-currency-tfoot">
                  <tr>
                    <td className="cash-closing-total-pad" aria-hidden="true">
                      {"\u00a0"}
                    </td>
                    <td className="cash-closing-total-label">Total</td>
                    <td className="cash-closing-total-value">
                      {new Intl.NumberFormat("en-IN").format(
                        SilakCurrencyTotal
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
                </div>
              </div>
            </div>
            </div>
            <footer className="cash-closing-dialog-footer">
            <div className="cash-closing-actions">
              <ReactToPrint
                trigger={() => (
                  <button type="button" className="icon-button cash-closing-action-btn">
                    Print
                  </button>
                )}
                content={() => printRef.current}
                onBeforePrint={async () => {
                  if (!modalPrintPrepPromiseRef.current) {
                    modalPrintPrepPromiseRef.current = (async () => {
                      await exportModalPrintSalesExcel({
                        printOverrides: silakIsViewOnly
                          ? {
                              totalAmount: silakDisplayTotal,
                              formattedDate: silakAccountDateLabel,
                            }
                          : undefined,
                      });
                      if (!silakIsViewOnly) handleSubmit();
                    })().finally(() => {
                      modalPrintPrepPromiseRef.current = null;
                    });
                  }
                  await modalPrintPrepPromiseRef.current;
                }}
              />
              <button
                type="button"
                className="icon-button cash-closing-action-btn"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportIndex;
