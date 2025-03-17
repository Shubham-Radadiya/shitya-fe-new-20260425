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

const ReportScreen = () => {
  const [activeReport, setActiveReport] = useState("purchase");
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDropdown, setOpenDropdown] = useState(null);
  const dispatch = useDispatch();

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
    const data = {
      startDate: date,
      endDate: date,
    };
    dispatch({ type: REQUEST_TODAY_PRODUCT, payload: data });
    console.log("fsdfds");

    setReportType("daily");
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    getDailyReport(date);
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

  const reportOptions = [
    {
      key: "purchase",
      label: "Purchase Report",
      component: <PurchaseReport />,
    },
    {
      key: "sales",
      label: "Sales Report",
      hasSubReports: true,
      subReports: [
        { key: "daily", label: "Daily Report", component: <DailyReport /> },
        {
          key: "monthly",
          label: "Monthly Report",
          component: <MonthlyReport />,
        },
        { key: "yearly", label: "Yearly Report", component: <YearlyReport /> },
      ],
    },
    // {
    //   key: "Stock",
    //   label: "Stock Report",
    //   component: <PurchaseReport />,
    // },
  ];

  return (
    <div className="flexbetween report-screen" style={{ height: "97vh" }}>
      <div className="header">
        <Header />
      </div>
      <div className="report-dashboard">
        <div className="report-left-side" style={{ gap: "0" }}>
          {reportOptions.map((report) => (
            <div key={report.key}>
              <button
                className={`sidebar-link ${
                  activeReport === report.key ? "active" : ""
                }`}
                onClick={() => {
                  setActiveReport(report.key);
                  if (report.hasSubReports) {
                    setOpenDropdown(
                      openDropdown === report.key ? null : report.key
                    );
                  } else {
                    setOpenDropdown(null);
                  }
                }}
              >
                {report.label}{" "}
                {report.hasSubReports && (
                  <span className="arrow">
                    {openDropdown === report.key ? "▲" : "▼"}
                  </span>
                )}
              </button>
              {openDropdown === report.key && report.hasSubReports && (
                <div className="dropdown-menu">
                  {report.subReports.map((sub) => (
                    <button
                      key={sub.key}
                      className={`dropdown-item ${
                        reportType === sub.key ? "active" : ""
                      }`}
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

        <div className="report-right-side">
          {activeReport === "sales"
            ? reportOptions
                .find((r) => r.key === "sales")
                ?.subReports.find((s) => s.key === reportType)?.component
            : reportOptions.find((r) => r.key === activeReport)?.component}
        </div>
      </div>
    </div>
  );
};

export default ReportScreen;
