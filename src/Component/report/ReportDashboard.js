import React, { useState } from "react";
import PurchaseReport from "./PurchaseReport";
import ReportIndex from "./ReportIndex";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";
// import Stock from "./stock";
import PurchaseReturn from "./PurchaseReturn";
import StockTable from "./StockTable";

const ReportsDashboard = () => {
  const [activeReport, setActiveReport] = useState("sales");
  const [reportType, setReportType] = useState("purchasebill");
  const [openDropdown, setOpenDropdown] = useState(null);

  const reportOptions = [
    { key: "sales", label: "Sales Report", component: <ReportIndex /> },
    {
      key: "purchase",
      label: "Purchase Report",
      hasSubReports: true,
      subReports: [
        {
          key: "purchasebill",
          label: "Purchase Bill",
          component: <PurchaseReport />,
        },
        {
          key: "purchaseReturn",
          label: "Purchase Return",
          component: <PurchaseReturn />,
        },
      ],
    },
    { key: "stock", label: "Stock Report", component: <StockTable /> },
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
            <NavLink className="screen-list-circle purchase-report-circle"></NavLink>
          </div>
        </div>
        <div
          className="report-dashboard"
          style={{ width: "auto", gap: "15px" }}
        >
          <div className="report-left-side">
            <div>
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
                          onClick={() => setReportType(sub.key)}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="report-right-side">
            {reportOptions.find((r) => r.key === activeReport)?.hasSubReports
              ? reportOptions
                  .find((r) => r.key === activeReport)
                  ?.subReports?.find((s) => s.key === reportType)?.component
              : reportOptions.find((r) => r.key === activeReport)
                  ?.component || <div>Select a report</div>}
          </div>
        </div>
        <div className="reportContainerStyle"></div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
