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
import CustomeReport from "./CustomeReport";
import PurchaseReport from "../../report/PurchaseReport";

const ReportScreen = () => {
  const [reportType, setReportType] = useState("daily");
  const [activeReport, setActiveReport] = useState("sales");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
    // const now = new Date();
    // const startDate = new Date(now);
    // startDate.setDate(now.getDate() - 30);

    // const data = {
    //   startDate: startDate.toISOString(),
    //   endDate: now.toISOString(),
    // };

    // dispatch({ type: REQUEST_MONTHLY_PRODUCT, payload: data });
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

  return (
    <div className="flexbetween report-screen" style={{height:'97vh'}}>
      <div className="header">
        <Header />
      </div>
        <div className="report-tab-button">
          <button
            className={`userreprt-button ${
              activeReport === "sales" ? "active" : ""
            }`}
            onClick={() => setActiveReport("sales")}
          >
            Sales Report
          </button>
          <button
            className={`userreprt-button ${
              activeReport === "purchase" ? "active" : ""
            }`}
            onClick={() => setActiveReport("purchase")}
          >
            Purchase Report
          </button>
        </div>
        {/* Report Content */}
        {activeReport === "purchase" ? (
          <PurchaseReport />
        ) : (
          <div className="report-dashboard">
            <div className="report-left-side">
              <button
                className={`sidebar-btn ${
                  reportType === "daily" ? "selected-report" : ""
                }`}
                onClick={getDailyReport}
              >
                Today Report
              </button>
              <button
                className={`sidebar-btn ${
                  reportType === "monthly" ? "selected-report" : ""
                }`}
                onClick={getMonthlyReport}
              >
                Monthly Report
              </button>
              <button
                className={`sidebar-btn ${
                  reportType === "yearly" ? "selected-report" : ""
                }`}
                onClick={getYearlyReport}
              >
                Yearly Report
              </button>
            </div>

            <div className="report-right-side">
              {reportType === "daily" && <DailyReport />}
              {reportType === "monthly" && <MonthlyReport />}
              {reportType === "yearly" && <YearlyReport />}
              {reportType === "custome" && <CustomeReport />}
            </div>
          </div>
        )}
      </div>
  );
};

export default ReportScreen;
