import React, { useState } from "react";
import PurchaseReport from "./PurchaseReport";
import ReportIndex from "./ReportIndex";
import { NavLink } from "react-router-dom";

const ReportsDashboard = () => {
  const [activeReport, setActiveReport] = useState("sales"); // Default to Sales Report

  return (
    <div className="user-template">
      <div className="user-container">
        <div className="reportHeader">
          <div style={{ display: "flex", gap: "10px" }}>
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
                activeReport === "sales" ? "" : "active"
              }`}
              onClick={() => setActiveReport("purchase")}
            >
              Purchase Report
            </button>
          </div>
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
            <NavLink
              // to="/purchaseReport"
              className="screen-list-circle purchase-report-circle"
            ></NavLink>
          </div>
        </div>
        <div className="reportContainerStyle">
          {activeReport === "sales" ? <ReportIndex /> : <PurchaseReport />}
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
