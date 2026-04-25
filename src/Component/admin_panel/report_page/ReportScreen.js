import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  fetchBhet,
  fetchInvoices,
} from "../../../store/invoice/InvoiceAction";
import { useInvoice } from "../../../store/invoice/InvoiceReducer";
import PurchaseReport from "../../report/PurchaseReport";
import ReportIndex from "../../report/ReportIndex";
import PurchaseReturn from "../../report/PurchaseReturn";
import StockTable from "../../report/StockTable";
import BhetReport from "../../report/BhetReport";
import BhetReturn from "../../report/BhetReturn";
import SilakMonthlyReport from "../../report/SilakMonthlyReport";
import SilakYearlyReport from "../../report/SilakYearlyReport";
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
 */
const ReportScreen = () => {
  const dispatch = useDispatch();
  const [activeKey, setActiveKey] = useState("sales");

  const { invoiceData } = useInvoice();

  useEffect(() => {
    if (activeKey === "purchase") dispatch(fetchInvoices(false));
    else if (activeKey === "purchaseReturn") dispatch(fetchInvoices(true));
    else if (activeKey === "bhet") dispatch(fetchBhet(false));
    else if (activeKey === "bhetReturn") dispatch(fetchBhet(true));
  }, [activeKey, dispatch]);

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
      component: <PurchaseReport invoiceData={invoiceData} />,
    },
    {
      key: "purchaseReturn",
      label: "Purchase return",
      icon: LuRotateCcw,
      component: <PurchaseReturn invoiceData={invoiceData} />,
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

  return (
    <div className="admin-report-page">
      <aside className="admin-report-sidebar" aria-label="Report types">
        <div className="admin-report-sidebar-head">
          <div className="admin-report-sidebar-head-icon" aria-hidden>
            <LuBarChart3 />
          </div>
          <div className="admin-report-sidebar-head-text">
            <span className="admin-report-sidebar-title">Reports</span>
            <span className="admin-report-sidebar-sub admin-report-sidebar-sub--reserved" aria-hidden="true">
              {"\u00a0"}
            </span>
          </div>
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
};

export default ReportScreen;
