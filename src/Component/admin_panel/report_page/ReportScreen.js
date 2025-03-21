import React, { useState, useEffect } from "react";
import "./index.css";
import Header from "../header/HeaderIndex";
import { useDispatch } from "react-redux";
import {
  REQUEST_CUSTOME_PRODUCT,
  REQUEST_MONTHLY_PRODUCT,
  REQUEST_TODAY_PRODUCT,
  REQUEST_YEARLY_PRODUCT,
} from "../../../store/admin_report/ReportAction";
import DailyReport from "../report_page/DailyReport";
import YearlyReport from "../report_page/YearlyReport";
import MonthlyReport from "../report_page/MonthlyReport";
import PurchaseReport from "../../report/PurchaseReport";
import StockTable from "../../report/StockTable";
import PurchaseReturn from "../../report/PurchaseReturn";
import { useInvoice } from "../../../store/invoice/InvoiceReducer";
import { fetchInvoices } from "../../../store/invoice/InvoiceAction";

const ReportScreen = () => {
  const [activeReport, setActiveReport] = useState("purchase");
  const [reportType, setReportType] = useState("purchasebill");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDropdown, setOpenDropdown] = useState(null);
  const dispatch = useDispatch();
  const { invoiceData } = useInvoice();

  useEffect(() => {
    if (reportType === "daily") {
      getDailyReport(selectedDate);
    } else if (reportType === "monthly") {
      getMonthlyReport();
    } else if (reportType === "quarterly") {
      getQuarterlyReport();
    } else if (reportType === "yearly") {
      getYearlyReport();
    }
  }, [reportType, selectedDate]);

  const getDailyReport = (date) => {
    const data = { startDate: date, endDate: date };
    dispatch({ type: REQUEST_TODAY_PRODUCT, payload: data });
    setReportType("daily");
  };
  const getMonthlyReport = () => {
    setReportType("monthly");
  };

  const getQuarterlyReport = () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 90);

    const data = {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };

    dispatch({ type: REQUEST_MONTHLY_PRODUCT, payload: data });
  };

  const getYearlyReport = () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 365);

    const data = {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };

    dispatch({ type: REQUEST_YEARLY_PRODUCT, payload: data });
    setReportType("yearly");
  };

  useEffect(() => {
    if (reportType === "purchasebill") {
      dispatch(fetchInvoices(false));
    } else if (reportType === "purchaseReturn") {
      dispatch(fetchInvoices(true));
    }
  }, [reportType, dispatch]);

  const reportOptions = [
    {
      key: "purchase",
      label: "Purchase Report",
      hasSubReports: true,
      subReports: [
        {
          key: "purchasebill",
          label: "Purchase Bill",
          component: <PurchaseReport invoiceData={invoiceData} />,
        },
        {
          key: "purchaseReturn",
          label: "Purchase Return",
          component: <PurchaseReturn invoiceData={invoiceData} />,
        },
      ],
    },
    {
      key: "sales",
      label: "Sales Report",
      hasSubReports: true,
      subReports: [
        { key: "daily", label: "Daily Report", component: <DailyReport /> },
        { key: "monthly", label: "Monthly Report", component: <MonthlyReport /> },
        { key: "yearly", label: "Yearly Report", component: <YearlyReport /> },
      ],
    },
    { key: "stock", label: "Stock Report", component: <StockTable /> },
  ];

  return (
    <div className="flexbetween report-screen" style={{ height: "97vh" }}>
      <div className="header">
        <Header />
      </div>
      <div className="report-dashboard">
        {/* Left Sidebar */}
        <div className="report-left-side" style={{ gap: "0" }}>
          {reportOptions.map((report) => (
            <div key={report.key}>
              <button
                className={`sidebar-link ${activeReport === report.key ? "active" : ""}`}
                onClick={() => {
                  setActiveReport(report.key);
                  if (report.hasSubReports) {
                    setOpenDropdown(openDropdown === report.key ? null : report.key);
                    setReportType(report.subReports[0].key); // Default to first subReport
                  } else {
                    setOpenDropdown(null);
                    setReportType(report.key); // Ensure direct report selection
                  }
                }}
              >
                {report.label}{" "}
                {report.hasSubReports && (
                  <span className="arrow">{openDropdown === report.key ? "▲" : "▼"}</span>
                )}
              </button>

              {/* Dropdown for Sub Reports */}
              {openDropdown === report.key && report.hasSubReports && (
                <div className="dropdown-menu">
                  {report.subReports.map((sub) => (
                    <button
                      key={sub.key}
                      className={`dropdown-item ${reportType === sub.key ? "active" : ""}`}
                      onClick={() => {
                        setReportType(sub.key);
                      }}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Side Content */}
        <div className="report-right-side">
          {reportOptions.some((r) => r.key === activeReport && r.hasSubReports)
            ? reportOptions
                .find((r) => r.key === activeReport)
                ?.subReports.find((s) => s.key === reportType)?.component
            : reportOptions.find((r) => r.key === activeReport)?.component}
        </div>
      </div>
    </div>
  );
};

export default ReportScreen;
