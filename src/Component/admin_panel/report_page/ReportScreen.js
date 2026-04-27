import React, { useState } from "react";
import PurchaseReport from "../../report/PurchaseReport";
import ReportIndex from "../../report/ReportIndex";
import PurchaseReturn from "../../report/PurchaseReturn";
import StockTable from "../../report/StockTable";
import BhetReport from "../../report/BhetReport";
import BhetReturn from "../../report/BhetReturn";
import SilakMonthlyReport from "../../report/SilakMonthlyReport";
import SilakYearlyReport from "../../report/SilakYearlyReport";
import {
  AdminReportBranchProvider,
  useAdminReportBranch,
} from "../../../context/AdminReportBranchContext";
import {
  LuBarChart3,
  LuLineChart,
  LuPackage,
  LuRotateCcw,
  LuScrollText,
  LuShoppingCart,
  LuCircleDot,
} from "react-icons/lu";
import "../../report/index.css";
import "../dashboard/index.css";
import "./ReportScreen.css";

/**
 * Admin reports: flat sidebar (purchase, returns, sales, silak, stock, bhet).
 * Silak keeps monthly / yearly sub-items.
 * Branch scope is chosen once in the sidebar for all report types.
 */
function ReportScreenInner() {
  const [activeKey, setActiveKey] = useState("sales");
  const {
    reportBranchName,
    setReportBranchName,
    reportBranchOptions,
  } = useAdminReportBranch();

  const silakSub = [
    {
      key: "silakMonthly",
      label: "Silak monthly report",
      component: <SilakMonthlyReport />,
    },
    {
      key: "silakYearly",
      label: "Silak yearly report",
      component: <SilakYearlyReport />,
    },
  ];

  const flatReports = [
    {
      key: "sales",
      label: "Sales report",
      icon: LuBarChart3,
      component: <ReportIndex variant="sales" />,
    },
    {
      key: "salesReturn",
      label: "Sales return",
      icon: LuRotateCcw,
      component: <ReportIndex variant="returns" />,
    },
    {
      key: "purchase",
      label: "Purchase",
      icon: LuShoppingCart,
      component: <PurchaseReport />,
    },
    {
      key: "purchaseReturn",
      label: "Purchase return",
      icon: LuRotateCcw,
      component: <PurchaseReturn />,
    },
    {
      key: "bhet",
      label: "Bhet",
      icon: LuScrollText,
      component: <BhetReport />,
    },
    {
      key: "bhetReturn",
      label: "Bhet return",
      icon: LuRotateCcw,
      component: <BhetReturn />,
    },
    {
      key: "stock",
      label: "Stock report",
      icon: LuPackage,
      component: <StockTable />,
    },
  ];

  const mainContent = (() => {
    if (activeKey === "silakMonthly" || activeKey === "silakYearly") {
      return silakSub.find((s) => s.key === activeKey)?.component;
    }
    return flatReports.find((r) => r.key === activeKey)?.component;
  })();

  const branchSelectOptions =
    reportBranchOptions.length > 0
      ? reportBranchOptions
      : [reportBranchName];

  return (
    <div className="admin-report-page">
      <aside className="admin-report-sidebar" aria-label="Report types">
        <div className="admin-report-sidebar-head">
          <div className="admin-report-sidebar-head-icon" aria-hidden>
            <LuBarChart3 />
          </div>
          <div className="admin-report-sidebar-head-text">
            <span className="admin-report-sidebar-title">Reports</span>
            <span className="admin-report-sidebar-sub">All reports use the branch below</span>
          </div>
        </div>
        <div className="admin-report-branch-row">
          <label htmlFor="admin-report-global-branch">Branch</label>
          <select
            id="admin-report-global-branch"
            value={reportBranchName}
            onChange={(e) =>
              setReportBranchName(String(e.target.value || "").trim().toUpperCase())
            }
          >
            {branchSelectOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <nav className="admin-report-nav">
          {flatReports.map((report) => {
            const Icon = report.icon;
            const isActive = activeKey === report.key;
            return (
              <button
                key={report.key}
                type="button"
                className={`admin-report-nav-btn${isActive ? " is-active" : ""}`}
                onClick={() => setActiveKey(report.key)}
              >
                <Icon className="admin-report-nav-btn-icon" aria-hidden />
                <span className="admin-report-nav-btn-label">{report.label}</span>
              </button>
            );
          })}

          <div
            className={`admin-report-nav-group${activeKey.startsWith("silak") ? " has-active" : ""}`}
          >
            <div className="admin-report-nav-parent">
              <LuLineChart className="admin-report-nav-parent-icon" aria-hidden />
              <span>Silak report</span>
            </div>
            <div className="admin-report-nav-sub">
              {silakSub.map((sub) => {
                const subActive = activeKey === sub.key;
                return (
                  <button
                    key={sub.key}
                    type="button"
                    className={`admin-report-nav-btn admin-report-nav-btn-sub${
                      subActive ? " is-active" : ""
                    }`}
                    onClick={() => setActiveKey(sub.key)}
                  >
                    <LuCircleDot
                      className="admin-report-nav-sub-bullet"
                      aria-hidden
                    />
                    <span className="admin-report-nav-btn-label">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>

      <div className="admin-report-main">{mainContent}</div>
    </div>
  );
}

const ReportScreen = () => (
  <AdminReportBranchProvider>
    <ReportScreenInner />
  </AdminReportBranchProvider>
);

export default ReportScreen;
