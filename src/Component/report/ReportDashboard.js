import React, { useState } from "react";
import PurchaseReport from "./PurchaseReport";
import ReportIndex from "./ReportIndex";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";

const ReportsDashboard = () => {
  const [activeReport, setActiveReport] = useState("sales");

  const reportOptions = [
    {
      key: "purchase",
      label: "Purchase Report",
      component: <PurchaseReport />,
    },
    { key: "sales", label: "Sales Report", component: <ReportIndex /> },
    // { key: "stock", label: "Stock Report", component: <ReportIndex /> },
  ];

  return (
    <div className="user-template">
      <div className="user-container">
        <div className="reportHeader">
          <h2 style={{ textAlign: "center" }}>Reports Dashboard</h2>
          <div className="screen-list">
            <NavLink to="/stock" className="screen-list-circle purchase-circle">
              P
            </NavLink>
            <NavLink
              to="/dashboard"
              className="screen-list-circle sales-circle"
            >
              S
            </NavLink>
            <NavLink
              to="/report"
              className="screen-list-circle sales-report-circle"
            >
              R
            </NavLink>
            {/* <NavLink
              className="screen-list-circle purchase-report-circle"
            ></NavLink> */}
          </div>
        </div>
        <div
          className="report-dashboard"
          style={{ width: "auto", gap: "15px" }}
        >
          <div className="report-left-side">
            <div>
              {reportOptions.map((report) => (
                <button
                  key={report.key}
                  className={`sidebar-link ${
                    activeReport === report.key ? "active" : ""
                  }`}
                  onClick={() => setActiveReport(report.key)}
                >
                  {report.label}
                </button>
              ))}
            </div>
          </div>

          <div className="report-right-side">
            {
              reportOptions.find((report) => report.key === activeReport)
                ?.component
            }
          </div>
        </div>
        <div className="reportContainerStyle"></div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
