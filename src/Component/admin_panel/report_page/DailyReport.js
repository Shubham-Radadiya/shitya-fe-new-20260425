import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  FILTER_DAILY,
  REQUEST_TODAY_PRODUCT,
} from "../../../store/admin_report/ReportAction";
import { REQUEST_USER } from "../../../store/auth/AuthAction";
import { useAuth } from "../../../store/auth/AuthReducers";
import ReactToPrint from "react-to-print";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";
import { useReport } from "../../../store/admin_report/ReportReducer";
import { useStoreSettings } from "../../../context/StoreSettingsContext";
import { saveReportExcelWithToast } from "../../../utils/excelExport";
import {
  getDailyProductLineTotal,
  getDailyProductUnitRate,
} from "../../../utils/dailyReportProduct";
import { ReportTableLoadingOverlay } from "../../report/ReportTableLoader";
import "../../report/reportTableLoader.css";
import { formatInrMoney } from "../../../utils/formatInr";
import { formatExcelDateDDMMYY } from "../../../utils/reportPayloadDate";
import { reportExcelBlobFromAoa } from "../../../utils/reportExcelStyled";

const DailyReport = () => {
  const { dailyreport, loadingDaily } = useReport();
  const { stallName, reportExportDirectoryHandle } = useStoreSettings();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dispatch = useDispatch();
  const users = useAuth();
  const componentRef = useRef();

  // Fetch users on component mount
  useEffect(() => {
    dispatch({ type: REQUEST_USER });
  }, [dispatch]);

  // Fetch daily report whenever selectedDate changes
  useEffect(() => {
    getDailyReport();
  }, [selectedDate, dispatch]);

  /** /report/daily (user + manager): flat `products` on each row. Legacy /daily/admin: nested `data[].products`. */
  const getProducts = (report) => {
    if (!Array.isArray(report) || report.length === 0) return [];
    return report.flatMap((item) => {
      if (Array.isArray(item?.products) && item.products.length > 0) {
        return item.products;
      }
      return item?.data?.flatMap((dataItem) => dataItem?.products || []) || [];
    });
  };

  const getTotalAmount = (products) =>
    products.reduce((acc, product) => acc + getDailyProductLineTotal(product), 0);

  const isMergedStoreWide = useMemo(
    () =>
      Array.isArray(dailyreport) &&
      dailyreport.length === 1 &&
      (dailyreport[0]?.userFullName === "All users" ||
        dailyreport[0]?.userName === "store"),
    [dailyreport]
  );

  useEffect(() => {
    if (isMergedStoreWide && selectedUser) {
      setSelectedUser(null);
    }
  }, [isMergedStoreWide, selectedUser]);

  const filteredReport =
    selectedUser && !isMergedStoreWide
      ? dailyreport.filter((item) => item.userFullName === selectedUser.fullName)
      : dailyreport;

  const productsArray = getProducts(filteredReport);

  const isDataAvailable = productsArray.length > 0;

  const handleUserChange = (user) => {
    setSelectedUser(user);
    dispatch({
      type: FILTER_DAILY,
      payload: user ? filteredReport : dailyreport,
    });
  };

  const getDailyReport = () => {
    const data = {
      startDate: selectedDate,
      endDate: selectedDate,
    };
    dispatch({ type: REQUEST_TODAY_PRODUCT, payload: data });
  };

  const exportToExcel = async () => {
    const sheetData = [];

    const reportTitle = stallName
      ? `${stallName} - Daily Sales Report`
      : "Daily Sales Report";

    sheetData.push([reportTitle]);

    sheetData.push([`Date: ${formatExcelDateDDMMYY(selectedDate)}`]);

    // Add the table headers in the third row
    sheetData.push([
      "Sr. No.",
      "Product ID",
      "Product",
      "Quantity",
      "Rate (unit)",
      "Amount (total)",
    ]);

    // Start the serial number at 1 and add the product data
    let serialNumber = 1;
    productsArray.forEach((product) => {
      const lineTotal = getDailyProductLineTotal(product);
      const unitRate = getDailyProductUnitRate(product);
      sheetData.push([
        serialNumber++,
        product.productId || "N/A",
        product.name || "N/A",
        product.totalBuyingCount || "N/A",
        formatInrMoney(unitRate),
        formatInrMoney(lineTotal),
      ]);
    });

    // Calculate the total amount
    const sumLineTotals = (products) =>
      products.reduce((acc, product) => acc + getDailyProductLineTotal(product), 0);

    const totalAmount = sumLineTotals(productsArray);
    const totalRow = [
      "",
      "",
      "",
      "",
      "Total:",
      formatInrMoney(totalAmount),
    ];
    sheetData.push(totalRow);

    const blob = await reportExcelBlobFromAoa(sheetData, "Daily Report");

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const fileName = `daily_sales_${dateStr}.xlsx`;

    await saveReportExcelWithToast(blob, fileName, reportExportDirectoryHandle);
  };

  const uniqueUsers = Array.from(
    new Map(
      users
        .filter((user) => user.userType === "USER")
        .map((user) => [user.fullName, user])
    ).values()
  );

  return (
    <div>
      <div className="report-box">
        <div className="flexgap user-btns-box">
          <div className="date-picker-container">
            <FaCalendarAlt className="calendar-icon" />
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy, EEEE"
              className="date-picker"
              popperPlacement="bottom-start"
              disabled={loadingDaily}
            />
          </div>
          <div style={{ width: "200px" }}>
            <label>Select a user: </label>
            <select
              onChange={(e) => {
                const selected = users.find(
                  (user) => user.fullName === e.target.value
                );
                handleUserChange(selected || null);
              }}
              value={selectedUser ? selectedUser.fullName : ""}
              style={{ width: "70%", height: "32px", borderRadius: "8px" }}
              disabled={loadingDaily || isMergedStoreWide}
              title={
                isMergedStoreWide
                  ? "Report is merged for all staff (same as user sales report)"
                  : undefined
              }
            >
              <option value="">All</option>
              {uniqueUsers.map((user, index) => (
                <option key={index} value={user.fullName}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          ref={componentRef}
          className="report-tables-with-loader"
          style={{ position: "relative", minHeight: 120 }}
        >
          <ReportTableLoadingOverlay
            show={loadingDaily}
            label="Loading report…"
          />
          <div className={loadingDaily ? "report-tables-dimmed" : undefined}>
          <div className="print-header">
            <h1 style={{ textAlign: "center" }}>જય સ્વામિનારાયણ</h1>
            <h3>
              Date: {selectedDate ? selectedDate.toLocaleDateString() : "N/A"}
            </h3>
          </div>
          <table className="report-table">
            <thead className="tab-header">
              <tr className="first-row" style={{ width: "100%" }}>
                <th style={{ width: "18%" }}>Sr. No.</th>
                <th style={{ textAlign: "center", width: "18%" }}>
                  Product ID
                </th>
                <th style={{ textAlign: "left", width: "32%" }}>Product</th>
                <th style={{ textAlign: "center", width: "14%" }}>Quantity</th>
                <th style={{ textAlign: "right", width: "14%" }}>Rate</th>
                <th
                  style={{
                    textAlign: "right",
                    width: "16%",
                    paddingLeft: "8px",
                    paddingRight: "12px",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="tab-body">
              {!loadingDaily && isDataAvailable ? (
                productsArray.map((product, index) => {
                  const currentSerialNumber = index + 1;
                  return (
                    <tr
                      key={product.productId + index}
                      style={{ width: "100%" }}
                    >
                      <td style={{ width: "18%" }}>{currentSerialNumber}</td>
                      <td style={{ textAlign: "center", width: "18%" }}>
                        {product.productId}
                      </td>
                      <td style={{ textAlign: "left", width: "32%" }}>
                        {product.name || "N/A"}
                      </td>
                      <td style={{ textAlign: "center", width: "14%" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          product.totalBuyingCount || "N/A"
                        )}
                      </td>
                      <td style={{ textAlign: "right", width: "14%" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          getDailyProductUnitRate(product)
                        )}
                      </td>
                      <td style={{ textAlign: "right", width: "16%" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          getDailyProductLineTotal(product)
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : !loadingDaily ? (
                <tr>
                  <td
                    colSpan="6"
                    className="no-data-cell report-table-empty-message"
                  >
                    No data found
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot className="tab-footer">
              <tr>
                <td colSpan="5">
                  <div className="flexgap">
                    <button
                      className="print-btn"
                      style={{ cursor: "pointer" }}
                      onClick={exportToExcel}
                    >
                      Export
                    </button>
                  </div>
                </td>
                <td
                  className="total-amount"
                  style={{ textAlign: "right", paddingRight: "16px" }}
                >
                  Total Amount:{" "}
                  {new Intl.NumberFormat("en-IN").format(
                    getTotalAmount(productsArray)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
