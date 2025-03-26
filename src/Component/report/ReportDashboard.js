import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchInvoices } from "../../store/invoice/InvoiceAction";
import { useInvoice } from "../../store/invoice/InvoiceReducer";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import PurchaseReport from "./PurchaseReport";
import ReportIndex from "./ReportIndex";
import PurchaseReturn from "./PurchaseReturn";
import StockTable from "./StockTable";
import SilakYearlyReport from "./SilakYearlyReport";
import SilakMonthlyReport from "./SilakMonthlyReport";
import BhetReport from "./BhetReport";
import Home from "../images/home.png";

const ReportsDashboard = () => {
  const dispatch = useDispatch();
  const [activeReport, setActiveReport] = useState("sales");
  const [reportType, setReportType] = useState("purchasebill");
  const [openDropdown, setOpenDropdown] = useState(null);

  const { invoiceData } = useInvoice();
  const [pin, setPin] = useState("");
  const [showPinPrompt, setShowPinPrompt] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const correctPin = "2812";

  const handlePinChange = (e) => {
    setPin(e.target.value);
  };

  const handlePinSubmit = () => {
    if (pin === correctPin && showPinPrompt) {
      navigate(`/${showPinPrompt}`);
      setShowPinPrompt(null);
      setPin("");
    } else {
      alert("Incorrect PIN");
    }
  };

  const handleButtonClick = (screen) => {
    if (location.pathname !== `/${screen}`) {
      setShowPinPrompt(screen);
    }
  };

  useEffect(() => {
    document.querySelectorAll("input").forEach((input) => {
      input.setAttribute("autocomplete", "off");
      input.setAttribute(
        "name",
        "random-" + Math.random().toString(36).substr(2, 10)
      );
    });
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handlePinSubmit();
    }
  };

  useEffect(() => {
    if (reportType === "purchasebill") {
      dispatch(fetchInvoices(false));
    } else if (reportType === "purchaseReturn") {
      dispatch(fetchInvoices(true));
    }
  }, [reportType, dispatch]);

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
          component: <PurchaseReport invoiceData={invoiceData} />,
        },
        {
          key: "purchaseReturn",
          label: "Purchase Return",
          component: <PurchaseReturn invoiceData={invoiceData} />,
        },
      ],
    },
    { key: "stock", label: "Stock Report", component: <StockTable /> },
    // {
    //   key: "silak",
    //   label: "Silak Report",
    //   hasSubReports: true,
    //   subReports: [
    //     {
    //       key: "SilakReport",
    //       label: "Report-1",
    //       component: <SilakMonthlyReport />,
    //     },
    //     {
    //       key: "SilakYearlyReport",
    //       label: "Report-2",
    //       component: <SilakYearlyReport />,
    //     },
    //   ],
    // },
    { key: "bhet", label: "Bhet Report", component: <BhetReport /> },
  ];
  const goToDashboard = () => {
    navigate("/dashboard");
  };
  return (
    <div className="user-template" style={{ marginLeft: "10px" }}>
      <div className="user-container">
        <div className="reportHeader" style={{width:"98.6%", marginTop:"6px"}}>
          <h2 style={{ textAlign: "center" }}>Reports Dashboard</h2>
          <div className="screen-list">
              <img style={{ width: "43px", cursor:"pointer" }} src={Home} alt="edit" onClick={() => goToDashboard()} />
          </div>
        </div>

        <div
          className="report-dashboard"
          style={{ width: "auto", gap: "15px", height: "91vh" }}
        >
          <div className="report-left-side" style={{ width: "14vw" }}>
            {reportOptions.map((report) => (
              <div key={report.key}>
                <button
                  className={`sidebar-link ${
                    activeReport === report.key ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveReport(report.key);
                    setOpenDropdown(
                      report.hasSubReports
                        ? openDropdown === report.key
                          ? null
                          : report.key
                        : null
                    );

                    // ✅ If it has subReports, default to the first sub-report
                    if (report.hasSubReports) {
                      setReportType(report.subReports[0].key);
                    }
                  }}
                >
                  {report.label}
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
          <div className="report-right-side" style={{ width: "83.5vw" }}>
            {reportOptions.find((r) => r.key === activeReport)?.hasSubReports
              ? reportOptions
                  .find((r) => r.key === activeReport)
                  ?.subReports?.find((s) => s.key === reportType)?.component
              : reportOptions.find((r) => r.key === activeReport)
                  ?.component || <div>Select a report</div>}
          </div>
        </div>
      </div>
      {showPinPrompt && (
        <div className="pin-prompt">
          <div className="modal-content">
            <h3>Enter PIN for {showPinPrompt.toUpperCase()}</h3>
            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                inputMode="numeric"
                value={pin}
                name="custom-pin"
                onChange={handlePinChange}
                placeholder="Enter PIN"
                autoFocus
                onKeyDown={handleKeyPress}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  WebkitTextSecurity: "disc",
                }}
              />
            </form>
            <p className="button-group">
              <button onClick={handlePinSubmit}>Submit</button>
              <button
                className="close-btn"
                onClick={() => setShowPinPrompt(null)}
              >
                X
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
