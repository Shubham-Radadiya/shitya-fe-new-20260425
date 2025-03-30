import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { fetchInvoices } from "../../store/invoice/InvoiceAction";
import { useInvoice } from "../../store/invoice/InvoiceReducer";
import { useNavigate } from "react-router-dom";
import PurchaseReport from "./PurchaseReport";
import ReportIndex from "./ReportIndex";
import PurchaseReturn from "./PurchaseReturn";
import StockTable from "./StockTable";
import BhetReport from "./BhetReport";
import SilakMonthlyReport from "./SilakMonthlyReport";
import SilakYearlyReport from "./SilakYearlyReport";
import Home from "../images/home.png";
import "./index.css";

const ReportsDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const [activeReport, setActiveReport] = useState("sales");
  const [selectedSubReport, setSelectedSubReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dropdownType, setDropdownType] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  const { invoiceData } = useInvoice();

  useEffect(() => {
    if (selectedSubReport === "purchasebill") {
      dispatch(fetchInvoices(false));
    } else if (selectedSubReport === "purchaseReturn") {
      dispatch(fetchInvoices(true));
    }
  }, [selectedSubReport, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

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
    {
      key: "silak",
      label: "Silak Report",
      hasSubReports: true,
      subReports: [
        {
          key: "silakMonthly",
          label: "Silak Report Monthly",
          component: <SilakMonthlyReport />,
        },
        {
          key: "silakYearly",
          label: "Silak Report Yearly",
          component: <SilakYearlyReport />,
        },
      ],
    },
    { key: "stock", label: "Stock Report", component: <StockTable /> },
    { key: "bhet", label: "Bhet Report", component: <BhetReport /> },
  ];

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const handleReportClick = (report, event) => {
    if (report.hasSubReports) {
      setDropdownType(report.key);
      setShowModal(true);

      const rect = event.target.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      });
    } else {
      setActiveReport(report.key);
      setSelectedSubReport(null);
    }
  };

  const handleSubReportClick = (subReport) => {
    setSelectedSubReport(subReport.key);
    setActiveReport(dropdownType);
  };

  const getButtonStyle = (reportKey) => {
    switch (reportKey) {
      case "sales":
        return { backgroundColor: "rgb(97, 37, 17)", color: "white" };
      case "purchase":
        return { backgroundColor: "rgb(113, 48, 142)", color: "white" };
      case "silak":
        return { backgroundColor: "rgb(113, 48, 142)", color: "white" };
      case "stock":
        return { backgroundColor: "rgb(97, 37, 17)", color: "white" };
      case "bhet":
        return { backgroundColor: "rgb(34, 78, 8)", color: "white" };
      default:
        return {};
    }
  };

  return (
    <div className="user-template">
      <div className="user-container">
        <div className="reportHeader">
          <div className="header-left">
            <h2>Reports Dashboard</h2>
            <div className="nav-buttons" style={{ display: "flex", gap: "10px" }}>
              {reportOptions.map((report) => (
                <button
                  key={report.key}
                  className={`nav-btn ${activeReport === report.key ? "active" : ""}`}
                  onClick={(event) => handleReportClick(report, event)}
                  style={activeReport === report.key ? getButtonStyle(report.key) : {}}
                  ref={report.hasSubReports ? buttonRef : null}
                >
                  {report.label}
                </button>
              ))}
            </div>
          </div>
          <img className="home-icon" src={Home} alt="Home" onClick={goToDashboard} />
        </div>

        <div className="report-right-side">
          {selectedSubReport
            ? reportOptions
                .find((r) => r.key === activeReport)
                ?.subReports?.find((s) => s.key === selectedSubReport)
                ?.component
            : reportOptions.find((r) => r.key === activeReport)?.component}
        </div>
      </div>

      {showModal && (
        <div
          ref={dropdownRef}
          className="dropdown-modal"
          style={{ top: modalPosition.top, left: modalPosition.left }}
        >
          {reportOptions
            .find((r) => r.key === dropdownType)
            ?.subReports.map((sub) => (
              <button
                key={sub.key}
                className={`dropdown-item ${selectedSubReport === sub.key ? "active" : ""}`}
                onClick={() => {handleSubReportClick(sub); setShowModal(false)}}
              >
                {sub.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
